import { Collection, ExportAllDeclaration } from 'jscodeshift';
import { findImportSource } from './findImportSource';
import { ModuleLink } from '../types';

export const parseExportAllDeclarations = (
  filePath: string,
  fileAST: Collection,
  projectRoot: string,
): ModuleLink[] =>
  fileAST
    .find(ExportAllDeclaration)
    .nodes()
    .map((node) => ({
      filePath,
      source: findImportSource(projectRoot, filePath, (node.source.value ?? '') as string),
      name: '*',
      isImport: true,
      isExport: true,
    }));
