import { generateParser } from '../parser-generator.js';
import { readFileSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('generateParser', () => {
  const testOutputDir = '/tmp/test-parser-generator';
  const parsersDir = join(testOutputDir, 'parsers');
  const typesDir = join(testOutputDir, 'types');
  const schemasDir = join(testOutputDir, 'schemas');

  const personSchema = {
    type: 'object',
    properties: {
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      profession: { type: 'string' },
      age: { type: 'integer' },
    },
    required: ['first_name', 'last_name', 'profession', 'age'],
    additionalProperties: false,
  };

  let personSchemaPath: string;

  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    mkdirSync(parsersDir, { recursive: true });
    mkdirSync(typesDir, { recursive: true });
    mkdirSync(schemasDir, { recursive: true });

    personSchemaPath = join(schemasDir, 'person.schema.json');
    writeFileSync(personSchemaPath, JSON.stringify(personSchema, null, 2));
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('file generation', () => {
    it('should create parser file with correct name', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const outputPath = join(parsersDir, 'person.ts');
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should create parser file in lowercase', async () => {
      await generateParser('UserProfile', testOutputDir, personSchemaPath);

      const outputPath = join(parsersDir, 'userprofile.ts');
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should generate file for different type names', async () => {
      await generateParser('Company', testOutputDir, personSchemaPath);

      const outputPath = join(parsersDir, 'company.ts');
      expect(existsSync(outputPath)).toBe(true);
    });
  });

  describe('code structure', () => {
    it('should import Ajv', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain("import Ajv from 'ajv';");
    });

    it('should import type from types directory', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain("import type { Person } from '../types/person.js';");
    });

    it('should embed the schema', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain('const schema = {');
      expect(content).toContain('"type": "object"');
      expect(content).toContain('"first_name"');
      expect(content).toContain('"last_name"');
      expect(content).toContain('"profession"');
      expect(content).toContain('"age"');
    });

    it('should create Ajv instance with allErrors', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain('const ajv = new Ajv({ allErrors: true });');
    });

    it('should import ParsingError and ParsingResult from parsing-types', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain("import type { ParsingResult, ParsingError } from './parsing-types.js';");
    });

    it('should export parsing function with correct name', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'person.ts'), 'utf-8');

      expect(content).toContain('export function parsePerson(data: unknown): ParsingResult<Person> {');
    });

    it('should handle different type names in parsing function', async () => {
      await generateParser('UserProfile', testOutputDir, personSchemaPath);

      const content = readFileSync(join(parsersDir, 'userprofile.ts'), 'utf-8');

      expect(content).toContain('export function parseUserProfile(data: unknown): ParsingResult<UserProfile> {');
    });
  });

  describe('functional parsing', () => {
    beforeEach(() => {
      const personType = `export interface Person {
  first_name: string;
  last_name: string;
  profession: string;
  age: number;
}`;
      writeFileSync(join(typesDir, 'person.ts'), personType);
    });

    it('should generate parser that parses correct data', async () => {

      await generateParser('Person', testOutputDir, personSchemaPath);

      const testFile = join(testOutputDir, 'test-parser.ts');
      const testCode = `
import { parsePerson } from './parsers/person.js';

const validData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 30
};

const result = parsePerson(validData);
console.log(JSON.stringify(result));
`;
      writeFileSync(testFile, testCode);

      const packageJsonPath = join(testOutputDir, 'package.json');
      const packageJson = {
        type: 'module',
        dependencies: {
          ajv: '^8.17.0',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      execSync('pnpm install', { cwd: testOutputDir, stdio: 'pipe' });

      const output = execSync(`npx tsx test-parser.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        profession: 'Engineer',
        age: 30,
      });
    });

    it('should generate parser that rejects missing required fields', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const testFile = join(testOutputDir, 'test-parser.ts');
      const testCode = `
import { parsePerson } from './parsers/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe'
};

const result = parsePerson(invalidData);
console.log(JSON.stringify(result));
`;
      writeFileSync(testFile, testCode);

      const packageJsonPath = join(testOutputDir, 'package.json');
      const packageJson = {
        type: 'module',
        dependencies: {
          ajv: '^8.17.0',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      execSync('pnpm install', { cwd: testOutputDir, stdio: 'pipe' });

      const output = execSync(`npx tsx test-parser.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should generate parser that rejects wrong types', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const testFile = join(testOutputDir, 'test-parser.ts');
      const testCode = `
import { parsePerson } from './parsers/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 'thirty'
};

const result = parsePerson(invalidData);
console.log(JSON.stringify(result));
`;
      writeFileSync(testFile, testCode);

      const packageJsonPath = join(testOutputDir, 'package.json');
      const packageJson = {
        type: 'module',
        dependencies: {
          ajv: '^8.17.0',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      execSync('pnpm install', { cwd: testOutputDir, stdio: 'pipe' });

      const output = execSync(`npx tsx test-parser.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should generate parser that rejects additional properties', async () => {
      await generateParser('Person', testOutputDir, personSchemaPath);

      const testFile = join(testOutputDir, 'test-parser.ts');
      const testCode = `
import { parsePerson } from './parsers/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 30,
  extra_field: 'not allowed'
};

const result = parsePerson(invalidData);
console.log(JSON.stringify(result));
`;
      writeFileSync(testFile, testCode);

      const packageJsonPath = join(testOutputDir, 'package.json');
      const packageJson = {
        type: 'module',
        dependencies: {
          ajv: '^8.17.0',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      execSync('pnpm install', { cwd: testOutputDir, stdio: 'pipe' });

      const output = execSync(`npx tsx test-parser.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
