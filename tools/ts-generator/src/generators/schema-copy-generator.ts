import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';

export async function copyDereferencedSchemas(
  schemasDir: string,
  schemaFiles: string[],
  typeNames: string[],
  outputDir: string
): Promise<void> {
  const schemasOutputDir = join(outputDir, 'schemas');
  mkdirSync(schemasOutputDir, { recursive: true });

  for (let i = 0; i < schemaFiles.length; i++) {
    const schemaFile = schemaFiles[i];
    const typeName = typeNames[i];
    const schemaPath = join(schemasDir, schemaFile);

    const resolvedSchema = (await $RefParser.dereference(
      schemaPath
    )) as Record<string, unknown>;

    delete resolvedSchema.$schema;

    const outputPath = join(schemasOutputDir, `${typeName.toLowerCase()}.json`);
    writeFileSync(outputPath, JSON.stringify(resolvedSchema, null, 2));
  }
}
