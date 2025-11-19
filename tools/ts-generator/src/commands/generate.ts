import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { bundleAllSchemas } from '../generators/schema-bundler.js';
import { generateBundledTypes } from '../generators/bundled-type-generator.js';
import { generateBundledParser } from '../generators/bundled-parser-generator.js';
import { copyDereferencedSchemas } from '../generators/schema-copy-generator.js';
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

  mkdirSync(join(outputDir, 'types'), { recursive: true });
  mkdirSync(join(outputDir, 'parsers'), { recursive: true });

  console.log('Bundling all schemas...');
  const { schema: bundledSchema, schemaFiles } = await bundleAllSchemas(
    resolvedSchemasDir
  );

  if (schemaFiles.length === 0) {
    console.error(`No schema files found in ${resolvedSchemasDir}`);
    process.exit(1);
  }

  if (options.verbose) {
    console.log(`Found ${schemaFiles.length} schema file(s)`);
  }

  console.log('Generating TypeScript types...');
  await generateBundledTypes(bundledSchema, outputDir);

  console.log('Generating parsing types...');
  generateParsingTypes(outputDir);

  const typeNames = schemaFiles.map((file) => schemaFileToTypeName(file));

  console.log('Copying dereferenced schemas...');
  await copyDereferencedSchemas(
    resolvedSchemasDir,
    schemaFiles,
    typeNames,
    outputDir
  );

  console.log('Generating unified parser...');
  await generateBundledParser(typeNames, outputDir);

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
