import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsCommit = 'c7fb4210a76a6717b3619f46752f27312580d833';
const source =
  process.env.AXIOM_OPENAPI_V2_URL ??
  `https://raw.githubusercontent.com/axiomhq/docs/${docsCommit}/content/docs/(api-reference)/restapi/versions/v2.json`;

const response = await fetch(source);
if (!response.ok) {
  throw new Error(`Failed to download Axiom v2 OpenAPI document: ${response.status} ${response.statusText}`);
}

const specification = await response.json();

// The public document represents null-only union branches as a nullable string
// enum containing null. Orval 8 emits an empty TypeScript union member for that
// shape. Replacing the enum value with an empty string preserves the effective
// unions in the affected schemas (`'' | null`) and produces valid TypeScript.
function normalizeNullableEnums(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeNullableEnums);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, normalizeNullableEnums(child)]),
  );

  if (normalized.nullable === true && Array.isArray(normalized.enum) && normalized.enum.length === 1) {
    if (normalized.enum[0] === null) {
      normalized.enum = [''];
    }
  }

  return normalized;
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(currentDirectory, '../openapi/.cache/v2.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(normalizeNullableEnums(specification), null, 2)}\n`);

console.log(`Prepared Axiom v2 OpenAPI document from ${source}`);
