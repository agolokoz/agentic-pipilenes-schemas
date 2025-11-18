import { compile } from 'json-schema-to-typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function generateTypes(
  schema: Record<string, unknown>,
  typeName: string,
  outputDir: string
): Promise<void> {
  const tsContent = await compile(schema, typeName, {
    bannerComment: '',
    strictIndexSignatures: true,
  });

  const outputPath = join(outputDir, 'types', `${typeName.toLowerCase()}.ts`);
  writeFileSync(outputPath, tsContent);
}
