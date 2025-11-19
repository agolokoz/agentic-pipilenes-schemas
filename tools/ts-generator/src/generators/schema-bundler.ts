import $RefParser from '@apidevtools/json-schema-ref-parser';
import { readdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface BundledSchema {
  schema: Record<string, unknown>;
  schemaFiles: string[];
}

export async function bundleAllSchemas(
  schemasDir: string
): Promise<BundledSchema> {
  const schemaFiles = readdirSync(schemasDir)
    .filter((file) => file.endsWith('.schema.json'))
    .sort();

  const wrapperSchema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema',
    $defs: {},
  };

  for (const schemaFile of schemaFiles) {
    const schemaName = schemaFile.replace('.schema.json', '');
    (wrapperSchema.$defs as Record<string, unknown>)[schemaName] = {
      $ref: `./${schemaFile}`,
    };
  }

  const wrapperPath = join(schemasDir, '_temp_wrapper.json');

  writeFileSync(wrapperPath, JSON.stringify(wrapperSchema, null, 2));

  try {
    const bundled = (await $RefParser.bundle(wrapperPath)) as Record<string, unknown>;

    return {
      schema: bundled,
      schemaFiles,
    };
  } finally {
    try {
      unlinkSync(wrapperPath);
    } catch {
    }
  }
}
