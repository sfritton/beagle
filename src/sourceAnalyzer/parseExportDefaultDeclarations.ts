import { Collection, ExportDefaultDeclaration } from 'jscodeshift';
import { ModuleLink } from '../types';

export const parseExportDefaultDeclarations = (
  filePath: string,
  fileAST: Collection,
): ModuleLink[] =>
  fileAST
    .find(ExportDefaultDeclaration)
    .nodes()
    .map(() => ({
      filePath,
      name: 'default',
      isImport: true,
      isExport: true,
    }));
