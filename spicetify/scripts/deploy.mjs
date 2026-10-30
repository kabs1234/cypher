import { execFileSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXTENSION_FILE = 'cypher.js';

const userData = execFileSync('spicetify', ['path', 'userdata'], {
  encoding: 'utf8',
}).trim();
await copyFile(
  new URL(`../dist/${EXTENSION_FILE}`, import.meta.url),
  join(userData, 'Extensions', EXTENSION_FILE),
);
execFileSync('spicetify', ['config', 'extensions', EXTENSION_FILE], {
  stdio: 'inherit',
});
execFileSync('spicetify', ['apply'], { stdio: 'inherit' });
