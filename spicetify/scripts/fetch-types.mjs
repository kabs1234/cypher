import { mkdir, writeFile } from 'node:fs/promises';

const SPICETIFY_VERSION = 'v2.46.2';
const TYPES_URL = `https://raw.githubusercontent.com/spicetify/cli/${SPICETIFY_VERSION}/globals.d.ts`;
const TARGET_DIRECTORY = new URL('../src/types/', import.meta.url);

const response = await fetch(TYPES_URL);
if (!response.ok) {
  throw new Error(`Could not download Spicetify types: ${response.status}`);
}
await mkdir(TARGET_DIRECTORY, { recursive: true });
await writeFile(
  new URL('spicetify.d.ts', TARGET_DIRECTORY),
  await response.text(),
);
console.log(
  `Spicetify ${SPICETIFY_VERSION} types saved to src/types/spicetify.d.ts`,
);
