import fs from 'fs';
import jscodeshift from 'jscodeshift';
import { parseImportDeclarations } from './parseImportDeclarations';
import { parseExportNamedDeclarations } from './parseExportNamedDeclarations';
import { parseExportAllDeclarations } from './parseExportAllDeclarations';
import { parseExportDefaultDeclarations } from './parseExportDefaultDeclarations';

/** Find import and export statements in a JS/TS file. */
export const analyzeSourceFile = (projectRoot: string, filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
    const fileAST = jscodeshift(fileContents);

    return [
      ...parseImportDeclarations(filePath, fileAST, projectRoot),
      ...parseExportNamedDeclarations(filePath, fileAST, projectRoot),
      ...parseExportAllDeclarations(filePath, fileAST, projectRoot),
      ...parseExportDefaultDeclarations(filePath, fileAST),
    ];
  } catch (e) {
    console.log(`error in ${filePath}`);
    throw e;
  }
};
