import commander from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import jscodeshift, {
  ExportDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Identifier,
  VariableDeclarator,
} from 'jscodeshift';
import { BeagleOptions } from './types';

export const beagle = (
  projectRoot: string,
  program: commander.Command,
  { verbose }: BeagleOptions,
) => {
  if (!projectRoot) {
    program.outputHelp();
    return;
  }

  console.log(`Searching for unused exports in ${chalk.cyan(projectRoot)} ...`);

  const files = getAllFiles(projectRoot);
  verbose && console.log(`Analyzing ${files.length} files ...`);
  console.log(findAllImportsAndExports(files));
};

/** Recursively finds JS/TS files in `directory` */
const getAllFiles = (directory: string): string[] => {
  let files: string[] = [];
  fs.readdirSync(directory).forEach((file) => {
    const fullPath = `${directory}/${file}`;
    if (fs.statSync(fullPath).isDirectory()) {
      // if it's a directory, search for more files inside it
      files = [...files, ...getAllFiles(fullPath)];
    } else if (/\.[jt]sx?$/.test(fullPath)) {
      // if it's a JS/TS file, add it to the list
      files = [...files, fullPath];
    }
  });

  return files;
};

const findAllImportsAndExports = (files: string[]) => {
  return files.map(findImportsAndExports);
  // return findImportsAndExports(files[0]);
};

const findImportsAndExports = (filePath: string) => {
  try {
    const imports: string[] = [];
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
    const fileAST = jscodeshift(fileContents);
    // named exports
    const exports = fileAST
      .find(ExportNamedDeclaration)
      .nodes()
      .reduce<string[]>((acc, node) => {
        // @ts-expect-error
        const singleExportName = node.declaration?.declarations[0].id.name;

        if (singleExportName) return [...acc, singleExportName];

        return [...acc, ...(node.specifiers?.map((specifier) => specifier.exported.name) ?? [])];
      }, []);

    // default export
    if (fileAST.find(ExportDefaultDeclaration).length) exports.push('default');

    return { path: filePath, imports, exports };
  } catch (e) {
    console.log(`error in ${filePath}`);
    throw e;
  }
};
