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

    expect(content).toContain("export { Person } from './types/person.js';");
    expect(content).toContain("export * from './parsers/parsing-types.js';");
    expect(content).toContain("export { parsePerson } from './parsers/person.js';");
  });

  it('should generate index.ts with multiple type names', () => {
    const typeNames = ['Person', 'Company', 'Product'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export { Person } from './types/person.js';");
    expect(content).toContain("export { Company } from './types/company.js';");
    expect(content).toContain("export { Product } from './types/product.js';");
    expect(content).toContain("export * from './parsers/parsing-types.js';");
    expect(content).toContain("export { parsePerson } from './parsers/person.js';");
    expect(content).toContain("export { parseCompany } from './parsers/company.js';");
    expect(content).toContain("export { parseProduct } from './parsers/product.js';");
  });

  it('should separate type exports from parser exports with empty line', () => {
    const typeNames = ['Person'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');
    const lines = content.split('\n');

    const typeExportIndex = lines.findIndex((line) =>
      line.includes("export { Person } from './types/person.js'")
    );
    const parsingTypesIndex = lines.findIndex((line) =>
      line.includes("export * from './parsers/parsing-types.js'")
    );

    expect(lines[typeExportIndex + 1]).toBe('');
    expect(parsingTypesIndex).toBe(typeExportIndex + 2);
  });

  it('should convert type names to lowercase in file paths', () => {
    const typeNames = ['PersonProfile', 'CompanyInfo'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export { PersonProfile } from './types/personprofile.js';");
    expect(content).toContain("export { CompanyInfo } from './types/companyinfo.js';");
    expect(content).toContain("export { parsePersonProfile } from './parsers/personprofile.js';");
    expect(content).toContain("export { parseCompanyInfo } from './parsers/companyinfo.js';");
  });

  it('should handle empty type names array', () => {
    const typeNames: string[] = [];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain("export * from './parsers/parsing-types.js';");
  });

  it('should end file with newline', () => {
    const typeNames = ['Person'];

    generateIndex(typeNames, testOutputDir);

    const content = readFileSync(outputPath, 'utf-8');

    expect(content.endsWith('\n')).toBe(true);
  });
});
