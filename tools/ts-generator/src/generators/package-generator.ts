import { writeFileSync } from 'fs';
import { join } from 'path';

export function generatePackageJson(
  outputDir: string,
  version: string,
  packageName: string
): void {
  const packageJson = {
    name: packageName,
    version,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
    },
    dependencies: {
      ajv: '^8.17.0',
      '@types/node': '^22.0.0',
    },
    devDependencies: {
      typescript: '^5.6.0',
    },
  };

  const outputPath = join(outputDir, 'package.json');
  writeFileSync(outputPath, JSON.stringify(packageJson, null, 2) + '\n');
}
