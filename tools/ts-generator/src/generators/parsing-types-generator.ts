import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateParsingTypes(outputDir: string): void {
  const parsingTypesContent = `export interface ParsingError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

export interface ParsingResult<T> {
  success: boolean;
  data?: T;
  errors?: ParsingError[];
}
`;

  const outputPath = join(outputDir, 'parsers', 'parsing-types.ts');
  writeFileSync(outputPath, parsingTypesContent);
}
