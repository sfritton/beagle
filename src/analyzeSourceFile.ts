import fs from 'fs';
import jscodeshift, {
  Collection,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from 'jscodeshift';
import { ExportStatement, ImportStatement } from './types';

/** Find import and export statements in a JS/TS file. */
export const analyzeSourceFile = (filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
    const fileAST = jscodeshift(fileContents);

    return {
      imports: findImports(filePath, fileAST),
      exports: findExports(filePath, fileAST),
    };
  } catch (e) {
    console.log(`error in ${filePath}`);
    throw e;
  }
};

const findImports = (filePath: string, fileAST: Collection) => {
  const imports = fileAST
    .find(ImportDeclaration)
    .nodes()
    .reduce<ImportStatement[]>((acc, node) => {
      const source = (node.source.value ?? '') as string;
      let hasDefaultImport = false;
      const namedImports: ImportStatement[] =
        node.specifiers?.reduce<ImportStatement[]>((acc, specifier) => {
          // @ts-expect-error
          const importedName = specifier.imported?.name;
          if (!importedName) {
            hasDefaultImport = true;
            return acc;
          }

          return [...acc, { path: filePath, source, name: importedName }];
        }, []) ?? [];

      return [
        ...acc,
        ...namedImports,
        ...(hasDefaultImport ? [{ path: filePath, source, name: 'default' }] : []),
      ];
    }, []);

  // TODO: track this as an export as well
  const exportAll = fileAST
    .find(ExportAllDeclaration)
    .nodes()
    .map(
      (node) => ({
        path: filePath,
        source: (node.source.value ?? '') as string,
        name: 'default',
      }),
      [],
    );

  return imports.concat(exportAll);
};

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
