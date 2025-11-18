import { readdirSync, readFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { generateTypes } from '../generators/type-generator.js';
import { generateParser } from '../generators/parser-generator.js';
import { generatePackageJson } from '../generators/package-generator.js';
import { generateTsConfig } from '../generators/tsconfig-generator.js';
import { generateIndex } from '../generators/index-generator.js';
import { generateReadme } from '../generators/readme-generator.js';
import { generateParsingTypes } from '../generators/parsing-types-generator.js';
import { schemaFileToTypeName } from '../generators/typename-generator.js';

export interface GenerateOptions {
  output: string;
  verbose: boolean;
  packageName: string;
  version: string;
}

export async function generate(
  schemasDir: string,
  options: GenerateOptions
): Promise<void> {
  const resolvedSchemasDir = resolve(schemasDir);
  const outputPackageDir = resolve(options.output);
  const outputDir = join(outputPackageDir, 'src');

  if (options.verbose) {
    console.log(`Schemas directory: ${resolvedSchemasDir}`);
    console.log(`Output directory: ${outputPackageDir}`);
  }

  const schemaFiles = readdirSync(resolvedSchemasDir).filter((file) =>
    file.endsWith('.schema.json')
  );

  if (schemaFiles.length === 0) {
    console.error(`No schema files found in ${resolvedSchemasDir}`);
    process.exit(1);
  }

  if (options.verbose) {
    console.log(`Found ${schemaFiles.length} schema file(s)`);
  }

  mkdirSync(join(outputDir, 'types'), { recursive: true });
  mkdirSync(join(outputDir, 'parsers'), { recursive: true });

  console.log('Generating parsing types...');
  generateParsingTypes(outputDir);

  const typeNames: string[] = [];

  for (const schemaFile of schemaFiles) {
    const schemaPath = join(resolvedSchemasDir, schemaFile);
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent) as Record<string, unknown>;

    const typeName = schemaFileToTypeName(schemaFile);

    typeNames.push(typeName);

    console.log(`Generating types for ${typeName}...`);
    await generateTypes(schema, typeName, outputDir, resolvedSchemasDir);

    console.log(`Generating parser for ${typeName}...`);
    await generateParser(typeName, outputDir, schemaPath);
  }

  console.log('Generating package.json...');
  generatePackageJson(outputPackageDir, options.version, options.packageName);

  console.log('Generating tsconfig.json...');
  generateTsConfig(outputPackageDir);

  console.log('Generating index.ts...');
  generateIndex(typeNames, outputPackageDir);

  console.log('Generating README.md...');
  generateReadme(typeNames, options.packageName, outputPackageDir);

  console.log('Done!');
}
