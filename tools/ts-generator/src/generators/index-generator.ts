import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateIndex(typeNames: string[], outputDir: string): void {
  const typeExports = typeNames.map(
    (name) => `export * from './types/${name.toLowerCase()}.js';`
  );

  const validatorExports = typeNames.map(
    (name) => `export * from './validators/${name.toLowerCase()}.js';`
  );

  const validationTypesExport = `export * from './validators/validation-types.js';`;

  const indexContent = [...typeExports, '', validationTypesExport, ...validatorExports].join('\n') + '\n';

  const outputPath = join(outputDir, 'src', 'index.ts');
  writeFileSync(outputPath, indexContent);
}
