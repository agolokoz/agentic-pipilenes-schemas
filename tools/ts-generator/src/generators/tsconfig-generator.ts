import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateTsConfig(outputDir: string): void {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'node',
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  const outputPath = join(outputDir, 'tsconfig.json');
  writeFileSync(outputPath, JSON.stringify(tsConfig, null, 2) + '\n');
}
