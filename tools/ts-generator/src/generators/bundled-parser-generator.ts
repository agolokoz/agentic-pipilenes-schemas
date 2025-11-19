import { writeFileSync } from 'fs';
import { join } from 'path';

export async function generateBundledParser(
  bundledSchema: Record<string, unknown>,
  typeNames: string[],
  schemaFiles: string[],
  outputDir: string
): Promise<void> {
  const typeMapEntries = typeNames.map((typeName) => {
    return `  ${typeName}: ${typeName};`;
  });

  const schemaRefEntries = typeNames.map((typeName, index) => {
    const schemaFile = schemaFiles[index];
    const schemaKey = schemaFile.replace('.schema.json', '');
    return `  ${typeName}: '${schemaKey}',`;
  });

  const bundledSchemaString = JSON.stringify(bundledSchema, null, 2);

  const parserCode = `import Ajv, { type ValidateFunction } from 'ajv';
import type {
${typeNames.map((name) => `  ${name}`).join(',\n')}
} from '../types/index.js';
import type { ParsingResult, ParsingError } from './parsing-types.js';

const bundledSchema = ${bundledSchemaString};

const ajv = new Ajv({ allErrors: true });
ajv.addSchema(bundledSchema, 'schemas');

export interface TypeMap {
${typeMapEntries.join('\n')}
}

const schemaRefs = {
${schemaRefEntries.join('\n')}
} as const;

const validators: { [K in keyof TypeMap]?: ValidateFunction } = {};

function getValidator<K extends keyof TypeMap>(type: K): ValidateFunction {
  if (!validators[type]) {
    const schemaKey = schemaRefs[type];
    validators[type] = ajv.compile({ $ref: \`schemas#/$defs/\${schemaKey}\` });
  }
  return validators[type]!;
}

export function parse<K extends keyof TypeMap>(
  data: unknown,
  type: K
): ParsingResult<TypeMap[K]> {
  const validate = getValidator(type);
  const valid = validate(data);

  if (valid) {
    return {
      success: true,
      data: data as TypeMap[K],
    };
  }

  return {
    success: false,
    errors: validate.errors as ParsingError[],
  };
}
`;

  const outputPath = join(outputDir, 'parsers', 'index.ts');
  writeFileSync(outputPath, parserCode);
}
