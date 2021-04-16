import fs from 'fs';
import path from 'path';
import { TsConfig } from './types';

/** Matches ./ or ../ */
const relativePathRegex = /^\./;

export const findImportSource = (projectRoot: string, filePath: string, source: string) => {
  const isRelative = relativePathRegex.test(source);

  if (isRelative) return resolveRelativePath(filePath, source);

  return resolveAlias(source, projectRoot);
};

const resolveRelativePath = (filePath: string, source: string) => {
  const absolutePath = path.resolve(path.dirname(filePath), source);

  try {
    // If the path is a directory, assume we're importing from an index file
    if (fs.statSync(absolutePath).isDirectory()) return path.resolve(absolutePath, 'index');
  } catch (e) {
    // Since import paths skip the file extension,
    // some file paths will be invalid and fs will throw an error.
  }

  return absolutePath;
};

const resolveAlias = (source: string, projectRoot: string) => {
  const tsconfigContent = fs.readFileSync(path.resolve(projectRoot, 'tsconfig.json'), {
    encoding: 'utf8',
  });

  const tsconfig: TsConfig = JSON.parse(tsconfigContent);
  const aliases = tsconfig.compilerOptions?.paths;

  if (!aliases) return `Couldn't find path for ${source}`;

  const [sourceAlias, ...sourceSubPath] = source.split('/');

  // Importing from the alias root
  if (aliases[sourceAlias] && sourceSubPath.length < 1)
    return path.resolve(projectRoot, aliases[sourceAlias][0]);

  // Importing from inside the alias directory
  if (aliases[`${sourceAlias}/*`] && sourceSubPath.length > 0)
    return path.resolve(
      projectRoot,
      aliases[`${sourceAlias}/*`][0].replace(/\/\*/, ''),
      ...sourceSubPath,
    );

  return `Couldn't find path for ${sourceAlias}`;
};
