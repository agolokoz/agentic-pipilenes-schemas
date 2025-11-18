import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateReadme(typeNames: string[], packageName: string, outputDir: string): void {
  const typesList = typeNames.map(name => `- **${name}**`).join('\n');

  const exampleType = typeNames[0] || 'Person';
  const exampleParserFunction = `parse${exampleType}`;

  const readmeContent = `# ${packageName}

TypeScript types and parsers generated from JSON schemas.

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Generated Types

This package includes TypeScript types and parsers for the following schemas:

${typesList}

## Usage

### Importing Types and Parsers

\`\`\`typescript
import { ${exampleType}, ${exampleParserFunction} } from '${packageName}';
\`\`\`

### Validating Data

Each parser function takes unknown data and returns a typed parsing result:

\`\`\`typescript
import { ${exampleParserFunction} } from '${packageName}';

const data = {
};

const result = ${exampleParserFunction}(data);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Parsing errors:', result.errors);
}
\`\`\`

### Parsing Result Interface

All parsers return a \`ParsingResult\` object with the following structure:

\`\`\`typescript
interface ParsingResult {
  success: boolean;
  data?: ${exampleType};
  errors?: ParsingError[];
}

interface ParsingError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}
\`\`\`

### Example: Successful Parsing

\`\`\`typescript
const validData = {
};

const result = ${exampleParserFunction}(validData);

console.log(result);
\`\`\`

### Example: Failed Parsing

\`\`\`typescript
const invalidData = {
};

const result = ${exampleParserFunction}(invalidData);

console.log(result);
\`\`\`

## Available Parsers

${typeNames.map(name => `- \`parse${name}(data: unknown): ParsingResult\``).join('\n')}

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
