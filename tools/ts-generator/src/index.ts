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
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (schemasDir: string, options: GenerateOptions) => {
    try {
      await generate(schemasDir, options);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();
