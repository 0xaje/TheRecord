import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const url = 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/verify.js';
const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error('Published verifier download failed: HTTP ' + response.status);
const code = await response.text();
const folder = mkdtempSync(join(tmpdir(), 'record-storage-'));
try {
  const bundle = join(folder, 'verify.js');
  writeFileSync(bundle, code);
  const test = spawnSync(process.execPath, ['--test', 'test/verification-storage.test.mjs'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8',
    env: { ...process.env, RECORD_VERIFIER_BUNDLE: bundle },
  });
  if (test.status !== 0) throw new Error(test.stdout + test.stderr);
  const evidence = { testedAt: new Date().toISOString(), url, result: 'PASS',
    sha256: createHash('sha256').update(code).digest('hex'),
    method: 'Published JavaScript in an isolated DOM startup harness with denied localStorage; not real browser or chain acceptance',
    checks: ['verification handlers installed', 'verification input reset works', 'storage warning shown', 'failed recovery-code save sends no POST'],
    walletAction: false, chainResponsesSimulated: false };
  writeFileSync(new URL('../docs/audit/2026-11-18/published-storage-startup.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
} finally { rmSync(folder, { recursive: true, force: true }); }
