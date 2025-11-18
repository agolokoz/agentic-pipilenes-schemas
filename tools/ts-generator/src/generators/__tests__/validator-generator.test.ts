import { generateValidator } from '../validator-generator.js';
import { readFileSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('generateValidator', () => {
  const testOutputDir = '/tmp/test-validator-generator';
  const validatorsDir = join(testOutputDir, 'validators');
  const typesDir = join(testOutputDir, 'types');

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

  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    mkdirSync(validatorsDir, { recursive: true });
    mkdirSync(typesDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('file generation', () => {
    it('should create validator file with correct name', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const outputPath = join(validatorsDir, 'person.ts');
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should create validator file in lowercase', () => {
      generateValidator(personSchema, 'UserProfile', testOutputDir);

      const outputPath = join(validatorsDir, 'userprofile.ts');
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should generate file for different type names', () => {
      generateValidator(personSchema, 'Company', testOutputDir);

      const outputPath = join(validatorsDir, 'company.ts');
      expect(existsSync(outputPath)).toBe(true);
    });
  });

  describe('code structure', () => {
    it('should import Ajv', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain("import Ajv from 'ajv';");
    });

    it('should import type from types directory', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain("import type { Person } from '../types/person.js';");
    });

    it('should embed the schema', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain('const schema = {');
      expect(content).toContain('"type": "object"');
      expect(content).toContain('"first_name"');
      expect(content).toContain('"last_name"');
      expect(content).toContain('"profession"');
      expect(content).toContain('"age"');
    });

    it('should create Ajv instance with allErrors', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain('const ajv = new Ajv({ allErrors: true });');
    });

    it('should export ValidationError interface', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain('export interface ValidationError {');
      expect(content).toContain('instancePath: string;');
      expect(content).toContain('schemaPath: string;');
      expect(content).toContain('keyword: string;');
      expect(content).toContain('params: Record<string, unknown>;');
      expect(content).toContain('message?: string;');
    });

    it('should export ValidationResult interface', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain('export interface ValidationResult {');
      expect(content).toContain('success: boolean;');
      expect(content).toContain('data?: Person;');
      expect(content).toContain('errors?: ValidationError[];');
    });

    it('should export validation function with correct name', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'person.ts'), 'utf-8');

      expect(content).toContain('export function validatePerson(data: unknown): ValidationResult {');
    });

    it('should handle different type names in validation function', () => {
      generateValidator(personSchema, 'UserProfile', testOutputDir);

      const content = readFileSync(join(validatorsDir, 'userprofile.ts'), 'utf-8');

      expect(content).toContain('export function validateUserProfile(data: unknown): ValidationResult {');
    });
  });

  describe('functional validation', () => {
    beforeEach(() => {
      const personType = `export interface Person {
  first_name: string;
  last_name: string;
  profession: string;
  age: number;
}`;
      writeFileSync(join(typesDir, 'person.ts'), personType);
    });

    it('should generate validator that validates correct data', () => {

      generateValidator(personSchema, 'Person', testOutputDir);

      const testFile = join(testOutputDir, 'test-validator.ts');
      const testCode = `
import { validatePerson } from './validators/person.js';

const validData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 30
};

const result = validatePerson(validData);
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

      const output = execSync(`npx tsx test-validator.ts`, {
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

    it('should generate validator that rejects missing required fields', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const testFile = join(testOutputDir, 'test-validator.ts');
      const testCode = `
import { validatePerson } from './validators/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe'
};

const result = validatePerson(invalidData);
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

      const output = execSync(`npx tsx test-validator.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should generate validator that rejects wrong types', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const testFile = join(testOutputDir, 'test-validator.ts');
      const testCode = `
import { validatePerson } from './validators/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 'thirty'
};

const result = validatePerson(invalidData);
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

      const output = execSync(`npx tsx test-validator.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should generate validator that rejects additional properties', () => {
      generateValidator(personSchema, 'Person', testOutputDir);

      const testFile = join(testOutputDir, 'test-validator.ts');
      const testCode = `
import { validatePerson } from './validators/person.js';

const invalidData = {
  first_name: 'John',
  last_name: 'Doe',
  profession: 'Engineer',
  age: 30,
  extra_field: 'not allowed'
};

const result = validatePerson(invalidData);
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

      const output = execSync(`npx tsx test-validator.ts`, {
        cwd: testOutputDir,
        encoding: 'utf-8',
      });

      const result = JSON.parse(output.trim());
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
