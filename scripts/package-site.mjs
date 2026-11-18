import { mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const args = process.argv.slice(2);
const idAt = args.indexOf('--project-id');
const outAt = args.indexOf('--output');
const projectId = idAt >= 0 ? args[idAt + 1] : null;
if (!projectId || projectId.startsWith('--')) throw new Error('Pass --project-id with the exact ID of your own registered Site.');
const output = resolve(outAt >= 0 ? args[outAt + 1] : 'site-bundle');
const journal = JSON.parse(readFileSync('deploy/migration-journal.json', 'utf8'));
const sqlFiles = readdirSync('migrations').filter(f => f.endsWith('.sql')).sort();
if (JSON.stringify(sqlFiles) !== JSON.stringify(journal.entries.map(e => e.tag + '.sql'))) throw new Error('Migration journal does not match SQL files.');
// Refuse existing destinations: never replace an existing Site identity or migration history.
mkdirSync(output);
for (const dir of ['.openai','dist/server','drizzle/meta']) mkdirSync(join(output, dir), { recursive: true });
writeFileSync(join(output, '.openai/hosting.json'), JSON.stringify({ project_id: projectId, d1: 'DB' }, null, 2));
const files = [['dist/server/index.js','dist/server/index.js'], ['deploy/migration-journal.json','drizzle/meta/_journal.json'], ...sqlFiles.map(f => ['migrations/' + f, 'drizzle/' + f])];
const hashes = {};
for (const [source, target] of files) {
  copyFileSync(source, join(output, target));
  hashes[target] = createHash('sha256').update(readFileSync(source)).digest('hex');
}
writeFileSync(join(output, 'build-hashes.json'), JSON.stringify(hashes, null, 2) + '\n');
console.log('Prepared fresh Site source bundle: ' + output);
