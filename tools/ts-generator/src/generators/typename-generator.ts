import { basename } from 'path';

export function schemaFileToTypeName(schemaFile: string): string {
  const fileName = basename(schemaFile, '.schema.json');
  return fileName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
