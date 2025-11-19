import { writeFileSync } from 'fs';
import { join } from 'path';

export async function generateBundledParser(
  typeNames: string[],
  outputDir: string
): Promise<void> {
  const typeMapEntries: string[] = [];
  const schemaImports: string[] = [];

  for (const typeName of typeNames) {
    typeMapEntries.push(`  ${typeName}: ${typeName};`);
    schemaImports.push(
      `import ${typeName}Schema from '../schemas/${typeName.toLowerCase()}.json' assert { type: 'json' };`
    );
  }

  const parserCode = `import Ajv, { type ValidateFunction } from 'ajv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
${typeNames.map((name) => `  ${name}`).join(',\n')}
} from '../types/index.js';
import type { ParsingResult, ParsingError } from './parsing-types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TypeMap {
${typeMapEntries.join('\n')}
}

const schemaCache: Partial<Record<keyof TypeMap, any>> = {};

function loadSchema<K extends keyof TypeMap>(type: K): any {
  if (!schemaCache[type]) {
    const schemaPath = join(__dirname, '../schemas', \`\${String(type).toLowerCase()}.json\`);
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    schemaCache[type] = JSON.parse(schemaContent);
  }
  return schemaCache[type];
}

const ajv = new Ajv({ allErrors: true });
const validators: { [K in keyof TypeMap]?: ValidateFunction } = {};

function getValidator<K extends keyof TypeMap>(type: K): ValidateFunction {
  if (!validators[type]) {
    const schema = loadSchema(type);
    validators[type] = ajv.compile(schema);
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
