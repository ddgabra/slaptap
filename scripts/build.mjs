import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = `${root}/dist`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(`${root}/index.html`, `${dist}/index.html`);
await cp(`${root}/src`, `${dist}/src`, { recursive: true });

console.log('built static app to dist');
