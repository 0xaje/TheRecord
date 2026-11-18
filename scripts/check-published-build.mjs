import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const origin = 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const checks = [];
for (const [path, file] of [['/', 'dist/index.html'], ['/verify.js', 'dist/verify.js']]) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  const remote = Buffer.from(await response.arrayBuffer());
  const local = readFileSync(file);
  assert.deepEqual(remote, local, 'Published asset differs from source build: ' + path);
  checks.push({ path, sha256: createHash('sha256').update(local).digest('hex'), exactMatch: true });
}
const evidence = { testedAt: new Date().toISOString(), origin, result: 'PASS', checks,
  scope: 'Published HTML and browser JavaScript match this source build byte for byte. Does not attest private database contents or platform runtime.' };
writeFileSync('docs/audit/2026-11-18/published-build-match.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
