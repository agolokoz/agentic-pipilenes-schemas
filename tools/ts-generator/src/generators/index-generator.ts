import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateIndex(_typeNames: string[], outputDir: string): void {
  const typeExports = `export * from './types/index.js';`;
  const parserExports = `export { parse, type TypeMap } from './parsers/index.js';`;
  const parsingTypesExport = `export * from './parsers/parsing-types.js';`;

  const indexContent = [typeExports, '', parsingTypesExport, parserExports].join('\n') + '\n';

  const outputPath = join(outputDir, 'src', 'index.ts');
  writeFileSync(outputPath, indexContent);
}
