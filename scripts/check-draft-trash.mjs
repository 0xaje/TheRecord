import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
if (!process.argv.includes('--live-write')) throw new Error('Use --live-write to create one non-sensitive test draft.');
const origin = 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key = randomBytes(32).toString('hex');
async function call(path = '', body, alternate = key) {
  const response = await fetch(origin + '/api/drafts' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, 'Content-Type': 'application/json', 'X-Record-Workspace': alternate },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, data: await response.json() };
}
const created = await call('', { title: 'Trash acceptance check', terms: 'Non-sensitive test. Friday.' });
assert.equal(created.status, 201);
const first = created.data;
assert.equal((await call('', { ...first, title: 'Trash acceptance check', terms: 'Non-sensitive test. Monday.' })).status, 200);
const current = { id: first.id, revision: 2 };
const invitation = (await call('/share', current)).data;
assert.equal((await call('/trash', current, randomBytes(32).toString('hex'))).status, 409);
assert.equal((await call('/trash', current)).status, 200);
assert.equal((await call()).data.length, 0);
assert.equal((await call('/trash')).data[0].id, first.id);
assert.equal((await call('', { ...current, title: 'Blocked', terms: 'Blocked' })).status, 409);
assert.equal((await call('/share', current)).status, 409);
assert.equal((await call('/review', invitation)).status, 404);
assert.equal((await call('/restore', current)).status, 200);
assert.equal((await call('/revision?id=' + first.id + '&revision=1')).data.terms, 'Non-sensitive test. Friday.');
assert.equal((await call('/revision?id=' + first.id + '&revision=2')).data.terms, 'Non-sensitive test. Monday.');
assert.equal((await call('/review', invitation)).status, 404);
const fresh = (await call('/share', current)).data;
assert.equal((await call('/review', fresh)).status, 200);
await call('/revoke', { id: first.id });
const result = { testedAt: new Date().toISOString(), origin, result: 'PASS', checks: ['foreign owner rejected', 'Trash hides active draft', 'Trash blocks edits and sharing', 'Trash revokes invitations', 'restore preserves both revisions', 'restore does not reopen revoked links', 'new invitation works'], draftId: first.id, sensitiveData: false, walletAction: false };
writeFileSync(new URL('../docs/audit/2026-11-18/live-trash-checks.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
