import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import { BeagleOptions, ExportStatement, ImportStatement } from './types';
import { getSourceFiles, sourceFileExtensionRegex } from './getSourceFiles';
import { analyzeSourceFile } from './analyzeSourceFile';

export const beagle = (
  projectRoot: string,
  program: commander.Command,
  { verbose }: BeagleOptions,
) => {
  if (!projectRoot) {
    program.outputHelp();
    return;
  }

  const fullPath = path.resolve(projectRoot);

  console.log(`\nSearching for unused exports in ${chalk.cyan(fullPath)} ...`);

  const files = getSourceFiles(fullPath);
  verbose && console.log(`Analyzing ${files.length} files ...`);
  const { imports, exports } = findAllImportsAndExports(fullPath, files);

  const unusedExports = exports.filter(({ name: exportName, path: exportPath }) => {
    const matchingImport = imports.find(
      ({ name: importName, source: importSource }) =>
        (importName === exportName || importName === '*') &&
        importSource === exportPath.replace(sourceFileExtensionRegex, ''),
    );
    return !matchingImport;
  });

  console.log(chalk.bold(`\nFound ${unusedExports.length} unused exports:`));

  const exportsByFile = unusedExports.reduce<Record<string, string[]>>(
    (filesWithExports, { name: exportName, path: exportPath }) => {
      const fileExports = filesWithExports[exportPath] ?? [];
      return {
        ...filesWithExports,
        [exportPath]: [...fileExports, exportName],
      };
    },
    {},
  );

  Object.keys(exportsByFile).forEach((exportPath) => {
    console.log('', exportPath, chalk.bold(chalk.yellow(exportsByFile[exportPath].join(', '))));
  });
};

const findAllImportsAndExports = (projectRoot: string, files: string[]) => {
  return files
    .map((filePath) => analyzeSourceFile(projectRoot, filePath))
    .reduce<{ imports: ImportStatement[]; exports: ExportStatement[] }>(
      (acc, { imports, exports }) => {
        return {
          imports: [...acc.imports, ...imports],
          exports: [...acc.exports, ...exports],
        };
      },
      { imports: [], exports: [] },
    );
};
