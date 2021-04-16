import { Collection, ImportDeclaration } from 'jscodeshift';
import { findImportSource } from './findImportSource';
import { ModuleLink } from '../types';

export const parseImportDeclarations = (
  filePath: string,
  fileAST: Collection,
  projectRoot: string,
) =>
  fileAST
    .find(ImportDeclaration)
    .nodes()
    .reduce<ModuleLink[]>((acc, node) => {
      const source = findImportSource(projectRoot, filePath, (node.source.value ?? '') as string);
      const statementImports = parseImportDeclaration(node, source, filePath);

      return [...acc, ...statementImports];
    }, []);

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
): ModuleLink[] =>
  node.specifiers?.map((specifier) => {
    // import a from './path'
    if (specifier.type === 'ImportDefaultSpecifier')
      return { filePath, source, name: 'default', isImport: true, isExport: false };

    // import * as a from './path'
    if (specifier.type === 'ImportNamespaceSpecifier')
      return { filePath, source, name: '*', isImport: true, isExport: false };

    // import { a } from './path'
    return {
      filePath,
      source,
      name: specifier.imported?.name,
      isImport: true,
      isExport: false,
    };
  }) ?? [];
