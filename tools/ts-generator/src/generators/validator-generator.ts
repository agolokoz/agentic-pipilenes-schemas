import { writeFileSync } from 'fs';
import { join } from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';

export async function generateValidator(
  typeName: string,
  outputDir: string,
  schemaPath: string
): Promise<void> {
  const resolvedSchema = await $RefParser.dereference(schemaPath) as Record<string, unknown>;
  const schemaString = JSON.stringify(resolvedSchema, null, 2);

  const validatorCode = `import Ajv from 'ajv';
import type { ${typeName} } from '../types/${typeName.toLowerCase()}.js';
import type { ValidationResult, ValidationError } from './validation-types.js';

const schema = ${schemaString};

const ajv = new Ajv({ allErrors: true });
const validateFunction = ajv.compile(schema);

export function validate${typeName}(data: unknown): ValidationResult<${typeName}> {
  const valid = validateFunction(data);

  if (valid) {
    return {
      success: true,
      data: data as unknown as ${typeName},
    };
  }

  return {
    success: false,
    errors: validateFunction.errors as ValidationError[],
  };
}
`;

  const outputPath = join(
    outputDir,
    'validators',
    `${typeName.toLowerCase()}.ts`
  );
  writeFileSync(outputPath, validatorCode);
}
