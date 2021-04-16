import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import { BeagleOptions, ModuleLink } from './types';
import { getSourceFiles, sourceFileExtensionRegex } from './getSourceFiles';
import { analyzeSourceFile } from './sourceAnalyzer';

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
  const moduleLinks = findAllModuleLinks(fullPath, files);

  const exports = moduleLinks.filter(({ isExport }) => isExport);
  const imports = moduleLinks.filter(({ isImport }) => isImport);

  const unusedExports = exports.filter(({ name: exportName, filePath: exportPath }) => {
    const matchingImport = imports.find(
      ({ name: importName, source: importSource }) =>
        (importName === exportName || importName === '*') &&
        importSource === exportPath.replace(sourceFileExtensionRegex, ''),
    );
    return !matchingImport;
  });

  console.log(chalk.bold(`\nFound ${unusedExports.length} unused exports:`));

  const exportsByFile = unusedExports.reduce<Record<string, string[]>>(
    (filesWithExports, { name: exportName, filePath: exportPath }) => {
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

const findAllModuleLinks = (projectRoot: string, files: string[]) => {
  const moduleLinksByFile = files.map((filePath) => analyzeSourceFile(projectRoot, filePath));

  return ([] as ModuleLink[]).concat(...moduleLinksByFile);
};
