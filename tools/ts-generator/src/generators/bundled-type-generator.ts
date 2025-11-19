import { compile } from 'json-schema-to-typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function generateBundledTypes(
  bundledSchema: Record<string, unknown>,
  outputDir: string
): Promise<void> {
  const tsContent = await compile(bundledSchema, 'Schemas', {
    bannerComment: '',
    strictIndexSignatures: true,
    unreachableDefinitions: true,
  });

  const outputPath = join(outputDir, 'types', 'index.ts');
  writeFileSync(outputPath, tsContent);
}
