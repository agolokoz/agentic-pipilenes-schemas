import { readdirSync, readFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import { generateTypes } from './type-generator.js';
import { generateValidator } from './validator-generator.js';
import { generatePackageJson } from './package-generator.js';
import { generateTsConfig } from './tsconfig-generator.js';
import { generateIndex } from './index-generator.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node dist/index.js <schemas-directory>');
    process.exit(1);
  }

  const schemasDir = resolve(args[0]);
  const outputDir = resolve(process.cwd(), 'packages/typescript/src');
  const outputPackageDir = resolve(process.cwd(), 'packages/typescript');

  const schemaFiles = readdirSync(schemasDir).filter((file) =>
    file.endsWith('.schema.json')
  );

  if (schemaFiles.length === 0) {
    console.error('No schema files found in directory');
    process.exit(1);
  }

  const typeNames: string[] = [];

  for (const schemaFile of schemaFiles) {
    const schemaPath = join(schemasDir, schemaFile);
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent) as Record<string, unknown>;

    const fileName = basename(schemaFile, '.schema.json');
    const typeName = fileName
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    typeNames.push(typeName);

    console.log(`Generating types for ${typeName}...`);
    await generateTypes(schema, typeName, outputDir);

    console.log(`Generating validator for ${typeName}...`);
    generateValidator(schema, typeName, outputDir);
  }

  console.log('Generating package.json...');
  generatePackageJson(outputPackageDir);

  console.log('Generating tsconfig.json...');
  generateTsConfig(outputPackageDir);

  console.log('Generating index.ts...');
  generateIndex(typeNames, outputPackageDir);

  console.log('Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
