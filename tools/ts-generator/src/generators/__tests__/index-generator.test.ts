import { generateIndex } from '../index-generator.js';
import { readFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('generateIndex', () => {
  const testOutputDir = '/tmp/test-index-generator';
  const outputPath = join(testOutputDir, 'src', 'index.ts');

  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    mkdirSync(join(testOutputDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  it('should generate index.ts with single type name', () => {
    const typeNames = ['Person'];

    generateIndex(typeNames, testOutputDir);

    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export * from './types/person.js';");
    expect(content).toContain("export * from './validators/person.js';");
  });

  it('should generate index.ts with multiple type names', () => {
    const typeNames = ['Person', 'Company', 'Product'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export * from './types/person.js';");
    expect(content).toContain("export * from './types/company.js';");
    expect(content).toContain("export * from './types/product.js';");
    expect(content).toContain("export * from './validators/person.js';");
    expect(content).toContain("export * from './validators/company.js';");
    expect(content).toContain("export * from './validators/product.js';");
  });

  it('should separate type exports from validator exports with empty line', () => {
    const typeNames = ['Person'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');
    const lines = content.split('\n');

    const typeExportIndex = lines.findIndex((line) =>
      line.includes("export * from './types/person.js'")
    );
    const validatorExportIndex = lines.findIndex((line) =>
      line.includes("export * from './validators/person.js'")
    );

    expect(lines[typeExportIndex + 1]).toBe('');
    expect(validatorExportIndex).toBe(typeExportIndex + 2);
  });

  it('should convert type names to lowercase in file paths', () => {
    const typeNames = ['PersonProfile', 'CompanyInfo'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export * from './types/personprofile.js';");
    expect(content).toContain("export * from './types/companyinfo.js';");
    expect(content).toContain("export * from './validators/personprofile.js';");
    expect(content).toContain("export * from './validators/companyinfo.js';");
  });

  it('should handle empty type names array', () => {
    const typeNames: string[] = [];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toBe('\n');
  });

  it('should end file with newline', () => {
    const typeNames = ['Person'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content.endsWith('\n')).toBe(true);
  });
});
