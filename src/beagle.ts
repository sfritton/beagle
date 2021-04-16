import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import { BeagleOptions, ExportStatement, ImportStatement } from './types';
import { getSourceFiles } from './getSourceFiles';
import { analyzeSourceFile } from './analyzeSourceFile';
import { findImportSource } from './findImportSource';

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

  console.log(`Searching for unused exports in ${chalk.cyan(fullPath)} ...`);

  const files = getSourceFiles(fullPath);
  verbose && console.log(`Analyzing ${files.length} files ...`);
  const importExportList = findAllImportsAndExports(files);
  importExportList.imports.map((i) => console.log(i, findImportSource(i, fullPath)));
};

const findAllImportsAndExports = (files: string[]) => {
  return files
    .map(analyzeSourceFile)
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
