import fs from 'fs';
import jscodeshift, {
  Collection,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from 'jscodeshift';
import { findImportSource } from './findImportSource';
import { ExportStatement, ImportStatement } from './types';

/** Find import and export statements in a JS/TS file. */
export const analyzeSourceFile = (projectRoot: string, filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
    const fileAST = jscodeshift(fileContents);

    return {
      imports: findImports(filePath, fileAST, projectRoot),
      exports: findExports(filePath, fileAST),
    };
  } catch (e) {
    console.log(`error in ${filePath}`);
    throw e;
  }
};

const findImports = (filePath: string, fileAST: Collection, projectRoot: string) => {
  const imports = fileAST
    .find(ImportDeclaration)
    .nodes()
    .reduce<ImportStatement[]>((acc, node) => {
      const source = findImportSource(projectRoot, filePath, (node.source.value ?? '') as string);
      const statementImports = parseImportDeclaration(node, source, filePath);

      return [...acc, ...statementImports];
    }, []);

  // TODO: track this as an export as well
  const exportAll = fileAST
    .find(ExportAllDeclaration)
    .nodes()
    .map(
      (node) => ({
        path: filePath,
        source: findImportSource(projectRoot, filePath, (node.source.value ?? '') as string),
        name: '*',
      }),
      [],
    );

  return imports.concat(exportAll);
};

/** Parse an import statement, and return a list of imports.
 * ```ts
 * // analyzed-file.ts
 * import React, { useState, useEffect } from 'react';
 *
 * // result
 * [
 *   { source: 'react', name: 'default', path: 'analyzed-file.ts' },
 *   { source: 'react', name: 'useState', path: 'analyzed-file.ts' },
 *   { source: 'react', name: 'useEffect', path: 'analyzed-file.ts' },
 * ]
 * ```
 */
const parseImportDeclaration = (
  node: ImportDeclaration,
  source: string,
  filePath: string,
): ImportStatement[] =>
  node.specifiers?.map((specifier) => {
    // import a from './path'
    if (specifier.type === 'ImportDefaultSpecifier')
      return { path: filePath, source, name: 'default' };

    // import * as a from './path'
    if (specifier.type === 'ImportNamespaceSpecifier') return { path: filePath, source, name: '*' };

    // import { a } from './path'
    return { path: filePath, source, name: specifier.imported?.name };
  }) ?? [];

const findExports = (filePath: string, fileAST: Collection) => {
  // named exports
  const exports = fileAST
    .find(ExportNamedDeclaration)
    .nodes()
    .reduce<ExportStatement[]>((acc, node) => {
      // @ts-expect-error
      const singleExportName = node.declaration?.declarations[0].id.name;

      if (singleExportName) return [...acc, { path: filePath, name: singleExportName }];

      return [
        ...acc,
        ...(node.specifiers?.map((specifier) => ({
          path: filePath,
          name: specifier.exported.name,
        })) ?? []),
      ];
    }, []);

  // default export
  if (fileAST.find(ExportDefaultDeclaration).length)
    exports.push({ path: filePath, name: 'default' });

  return exports;
};
