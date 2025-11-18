import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateIndex(typeNames: string[], outputDir: string): void {
  const typeExports = typeNames.map(
    (name) => `export * from './types/${name.toLowerCase()}.js';`
  );

  const parserExports = typeNames.map(
    (name) => `export * from './parsers/${name.toLowerCase()}.js';`
  );

  const parsingTypesExport = `export * from './parsers/parsing-types.js';`;

  const indexContent = [...typeExports, '', parsingTypesExport, ...parserExports].join('\n') + '\n';

  const outputPath = join(outputDir, 'src', 'index.ts');
  writeFileSync(outputPath, indexContent);
}
