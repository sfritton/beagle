import fs from 'fs';
import path from 'path';

/** Matches paths ending in .js, .ts, .jsx, .tsx */
export const sourceFileExtensionRegex = /\.[jt]sx?$/;

/** Recursively finds JS/TS files in `directory` */
export const getSourceFiles = (directory: string): string[] =>
  fs.readdirSync(directory).reduce<string[]>((files, file) => {
    const fullPath = path.resolve(directory, file);

    // if it's a directory, search for more files inside it
    if (fs.statSync(fullPath).isDirectory()) {
      return [...files, ...getSourceFiles(fullPath)];
    }

    // if it's a JS/TS file, add it to the list
    if (sourceFileExtensionRegex.test(fullPath)) {
      return [...files, fullPath];
    }

    // Otherwise, skip it
    return files;
  }, []);
