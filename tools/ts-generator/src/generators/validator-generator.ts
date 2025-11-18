import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateValidator(
  schema: Record<string, unknown>,
  typeName: string,
  outputDir: string
): void {
  const schemaString = JSON.stringify(schema, null, 2);

  const validatorCode = `import Ajv from 'ajv';
import type { ${typeName} } from '../types/${typeName.toLowerCase()}.js';

const schema = ${schemaString};

const ajv = new Ajv({ allErrors: true });
const validateFunction = ajv.compile(schema);

export interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: ${typeName};
  errors?: ValidationError[];
}

export function validate${typeName}(data: unknown): ValidationResult {
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
