import fs from 'fs';
import path from 'path';

/** Matches paths ending in .js, .ts, .jsx, .tsx */
export const sourceFileExtensionRegex = /\.[jt]sx?$/;

const sourceExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const pathsToIgnore = ['.git', 'node_modules'];

/** Recursively finds JS/TS files in `directory` */
export const getSourceFiles = (directory: string): string[] =>
  fs.readdirSync(directory).reduce<string[]>((files, file) => {
    const fullPath = path.resolve(directory, file);
    const fileExtension = path.extname(fullPath);

    // if it's a JS/TS file, add it to the list
    if (sourceExtensions.includes(fileExtension)) return [...files, fullPath];

    // if it has any other extension, skip it
    if (fileExtension !== '') return files;

    // if it's a path we want to ignore, skip it
    if (pathsToIgnore.includes(file)) return files;

    // if it's a directory, search for more files inside it
    if (fs.statSync(fullPath).isDirectory()) return [...files, ...getSourceFiles(fullPath)];

    // Otherwise, skip it
    return files;
  }, []);
