import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startLocal } from '../scripts/serve-local.mjs';

test('built Worker serves pages and persistent private drafts with real local SQLite', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'record-local-'));
  const filename = join(folder, 'drafts.sqlite');
  let server = await startLocal({ filename, port: 0 });
  const key = 'c'.repeat(64);
  const call = async (path, body, headers = { 'X-Record-Workspace': key }) => fetch(server.url + path, {
    method: body === undefined ? 'GET' : 'POST', headers: { origin: server.url, ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    assert.match(await (await call('/')).text(), /Verify an agreement file/);
    assert.equal((await call('/verify.js')).status, 200);
    assert.match(await (await call('/demo/agreement-v1.txt')).text(), /Friday/);
    assert.equal((await call('/api/drafts', { title: 'Spoof', terms: 'No write' }, { 'oai-authenticated-user-id': 'fake' })).status, 401);
    const saved = await (await call('/api/drafts', { title: 'Local persistence', terms: 'Harmless test' })).json();
    assert.ok(saved.id);
    await server.close(); server = await startLocal({ filename, port: 0 });
    const list = await (await call('/api/drafts')).json();
    assert.equal(list[0].id, saved.id); assert.equal(list[0].terms, 'Harmless test');
    assert.equal((await call('/api/drafts', undefined, { 'X-Record-Workspace': 'd'.repeat(64) })).status, 200);
    assert.deepEqual(await (await call('/api/drafts', undefined, { 'X-Record-Workspace': 'd'.repeat(64) })).json(), []);
  } finally { await server.close(); rmSync(folder, { recursive: true, force: true }); }
});
