import { writeFileSync } from 'fs';
import { join } from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';

export async function generateParser(
  typeName: string,
  outputDir: string,
  schemaPath: string
): Promise<void> {
  const resolvedSchema = await $RefParser.dereference(schemaPath) as Record<string, unknown>;
  const schemaString = JSON.stringify(resolvedSchema, null, 2);

  const parserCode = `import Ajv from 'ajv';
import type { ${typeName} } from '../types/${typeName.toLowerCase()}.js';
import type { ParsingResult, ParsingError } from './parsing-types.js';

const schema = ${schemaString};

const ajv = new Ajv({ allErrors: true });
const parseFunction = ajv.compile(schema);

export function parse${typeName}(data: unknown): ParsingResult<${typeName}> {
  const valid = parseFunction(data);

  if (valid) {
    return {
      success: true,
      data: data as unknown as ${typeName},
    };
  }

  return {
    success: false,
    errors: parseFunction.errors as ParsingError[],
  };
}
`;

  const outputPath = join(
    outputDir,
    'parsers',
    `${typeName.toLowerCase()}.ts`
  );
  writeFileSync(outputPath, parserCode);
}
