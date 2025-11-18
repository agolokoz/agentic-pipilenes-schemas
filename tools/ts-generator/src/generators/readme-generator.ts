import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateReadme(typeNames: string[], packageName: string, outputDir: string): void {
  const typesList = typeNames.map(name => `- **${name}**`).join('\n');

  const exampleType = typeNames[0] || 'Person';
  const exampleValidatorFunction = `validate${exampleType}`;

  const readmeContent = `# ${packageName}

TypeScript types and validators generated from JSON schemas.

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Generated Types

This package includes TypeScript types and validators for the following schemas:

${typesList}

## Usage

### Importing Types and Validators

\`\`\`typescript
import { ${exampleType}, ${exampleValidatorFunction} } from '${packageName}';
\`\`\`

### Validating Data

Each validator function takes unknown data and returns a typed validation result:

\`\`\`typescript
import { ${exampleValidatorFunction} } from '${packageName}';

const data = {
};

const result = ${exampleValidatorFunction}(data);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
\`\`\`

### Validation Result Interface

All validators return a \`ValidationResult\` object with the following structure:

\`\`\`typescript
interface ValidationResult {
  success: boolean;
  data?: ${exampleType};
  errors?: ValidationError[];
}

interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}
\`\`\`

### Example: Successful Validation

\`\`\`typescript
const validData = {
};

const result = ${exampleValidatorFunction}(validData);

console.log(result);
\`\`\`

### Example: Failed Validation

\`\`\`typescript
const invalidData = {
};

const result = ${exampleValidatorFunction}(invalidData);

console.log(result);
\`\`\`

## Available Validators

${typeNames.map(name => `- \`validate${name}(data: unknown): ValidationResult\``).join('\n')}

## TypeScript Support

All types are fully typed with strict TypeScript definitions. Import them directly:

\`\`\`typescript
${typeNames.map(name => `import type { ${name} } from '${packageName}';`).join('\n')}
\`\`\`

## Generated with

This package is automatically generated from JSON schemas using [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) and [Ajv](https://ajv.js.org/).
`;

  const outputPath = join(outputDir, 'README.md');
  writeFileSync(outputPath, readmeContent);
}
