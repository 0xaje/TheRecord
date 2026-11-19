import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
if (!process.argv.includes('--live-disposable-delete')) throw new Error('Use --live-disposable-delete to create and permanently delete only this script’s new test draft.');
const origin = 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key = randomBytes(32).toString('hex');
async function call(path = '', body, alternate = key) {
  const response = await fetch(origin + '/api/drafts' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, 'Content-Type': 'application/json', Authorization: 'Bearer workspace:' + alternate },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, data: await response.json() };
}
const created = await call('', { title: 'Disposable deletion acceptance', terms: 'Non-sensitive test. Friday.' });
assert.equal(created.status, 201);
const first = created.data;
const invite = (await call('/share', first)).data;
assert.equal((await call('/feedback', { ...invite, note: 'Disposable test feedback' })).status, 201);
assert.equal((await call('', { ...first, title: 'Disposable deletion acceptance', terms: 'Non-sensitive test. Monday.' })).status, 200);
const current = { id: first.id, revision: 2 };
assert.equal((await call('/delete', { ...current, trashedAt: 1, confirmation: 'DELETE' })).status, 409);
assert.equal((await call('/trash', current)).status, 200);
const trash = (await call('/trash')).data.find(d => d.id === first.id);
const payload = { ...current, trashedAt: trash.trashed_at, confirmation: 'DELETE' };
assert.equal((await call('/delete', { ...payload, confirmation: '' })).status, 400);
assert.equal((await call('/delete', payload, randomBytes(32).toString('hex'))).status, 409);
assert.equal((await call('/delete', { ...payload, revision: 1 })).status, 409);
assert.equal((await call('/delete', payload)).status, 200);
assert.equal((await call('/trash')).data.some(d => d.id === first.id), false);
assert.equal((await call('/item?id=' + first.id)).status, 404);
for (const revision of [1, 2]) assert.equal((await call('/revision?id=' + first.id + '&revision=' + revision)).status, 404);
assert.equal((await call('/feedback?id=' + first.id)).data.length, 0);
assert.equal((await call('/review', invite)).status, 404);
assert.equal((await call('/restore', current)).status, 409);
const evidence = { testedAt: new Date().toISOString(), origin, result: 'PASS', draftId: first.id,
  checks: ['active draft cannot be deleted', 'confirmation required', 'foreign owner rejected', 'stale revision rejected', 'trashed draft deleted', 'both revisions inaccessible', 'review and feedback inaccessible', 'restore rejected after permanent deletion'],
  scope: 'One newly created disposable non-sensitive test draft only; no existing user drafts',
  walletAction: false, backupErasureVerified: false };
writeFileSync(new URL('../docs/audit/2026-11-18/live-delete-checks.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
