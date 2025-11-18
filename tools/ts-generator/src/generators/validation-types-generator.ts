import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateValidationTypes(outputDir: string): void {
  const validationTypesContent = `export interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}
`;

  const outputPath = join(outputDir, 'validators', 'validation-types.ts');
  writeFileSync(outputPath, validationTypesContent);
}
