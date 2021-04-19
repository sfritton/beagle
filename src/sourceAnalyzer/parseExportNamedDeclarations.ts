import { Collection, ExportNamedDeclaration, VariableDeclaration } from 'jscodeshift';
import { findImportSource } from './findImportSource';
import { ModuleLink } from '../types';

export const parseExportNamedDeclarations = (
  filePath: string,
  fileAST: Collection,
  projectRoot: string,
) =>
  fileAST
    .find(ExportNamedDeclaration)
    .nodes()
    .reduce<ModuleLink[]>((acc, node) => {
      // export { a }
      // export { a } from './path'
      const exportedSpecifiers =
        node.specifiers?.map((specifier) => ({
          filePath,
          source: node.source
            ? findImportSource(projectRoot, filePath, (node.source.value ?? '') as string)
            : undefined,
          name: specifier.exported.name,
          isImport: Boolean(node.source),
          isExport: true,
        })) ?? [];

      if (!node.declaration) return [...acc, ...exportedSpecifiers];

      // TODO: there are over 30 types, find out which ones we need to worry about
      switch (node.declaration.type) {
        case 'ClassDeclaration':
        case 'FunctionDeclaration':
        case 'TSTypeAliasDeclaration':
          // case 'TSInterfaceDeclaration':
          return [
            ...acc,
            ...exportedSpecifiers,
            {
              filePath,
              name: node.declaration.id?.name ?? '',
              isImport: false,
              isExport: true,
            },
          ];
        case 'VariableDeclaration':
          return [
            ...acc,
            ...exportedSpecifiers,
            ...parseVariableDeclaration(filePath, node.declaration.declarations),
          ];
        default:
          return [...acc, ...exportedSpecifiers];
      }
    }, []);

const parseVariableDeclaration = (
  filePath: string,
  declarations: VariableDeclaration['declarations'],
) => {
  return declarations.map((declaration) => {
    let name;
    if (declaration.type === 'VariableDeclarator') {
      // @ts-expect-error
      name = declaration.id.name; // TODO: handle edge cases
    } else {
      name = declaration.name;
    }

    return {
      filePath,
      name,
      isImport: false,
      isExport: true,
    };
  });
};
