import { writeFileSync } from 'fs';
import { join } from 'path';

export function generatePackageJson(outputDir: string): void {
  const packageJson = {
    name: '@agentic-pipeline-schemas/typescript',
    version: '0.1.0',
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
    },
    dependencies: {
      ajv: '^8.17.0',
    },
    devDependencies: {
      typescript: '^5.6.0',
    },
  };

  const outputPath = join(outputDir, 'package.json');
  writeFileSync(outputPath, JSON.stringify(packageJson, null, 2) + '\n');
}
