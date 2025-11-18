import { Command } from 'commander';
import { generate, GenerateOptions } from './commands/generate.js';

const program = new Command();

program
  .name('ts-generator')
  .description('Generate TypeScript types and validators from JSON schemas')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate TypeScript package from JSON schemas')
  .argument('<schemas-dir>', 'Directory containing JSON schema files')
  .option(
    '-o, --output <dir>',
    'Output directory for generated package',
    'packages/typescript'
  )
  .option(
    '--package-version <version>',
    'Version for generated package.json',
    '0.1.0'
  )
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (schemasDir: string, options: GenerateOptions & { packageVersion: string }) => {
    try {
      await generate(schemasDir, {
        output: options.output,
        verbose: options.verbose,
        version: options.packageVersion,
      });
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();
