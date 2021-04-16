export interface BeagleOptions {
  verbose: boolean;
}

/**
 * An object containing data about a 'link' between modules.
 * These links are in the form of import and export statements.
 */
export interface ModuleLink {
  /**
   * The file containing the import or export statement.
   */
  filePath: string;
  /**
   * The variable being imported and/or exported.
   */
  name: string;
  /**
   * The source of the imported variable, if applicable.
   */
  source?: string;
  /**
   * True if variables are being imported into the current module.
   *
   * **Note:** Both `isImport` and `isExport` can be true for statements like
   * ```ts
   * export * from './file'
   * ```
   */
  isImport: boolean;
  /**
   * True if variables are being exported from the current module.
   *
   * **Note:** Both `isImport` and `isExport` can be true for statements like
   * ```ts
   * export * from './file'
   * ```
   */
  isExport: boolean;
}
