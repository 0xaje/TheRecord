import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
if (!process.argv.includes('--live-write')) throw new Error('This check creates a non-sensitive test draft. Run with --live-write to authorize it. No wallet or chain transaction is used.');
const base = process.env.RECORD_TEST_ORIGIN ?? 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key = randomBytes(32).toString('hex');
const stranger = randomBytes(32).toString('hex');
const checks = [];
async function api(label, path, body, expected, workspace = key) {
  const response = await fetch(base + '/api/drafts' + path, { method: body === undefined ? 'GET' : 'POST', headers: {
    Origin: base, 'Content-Type': 'application/json', ...(workspace ? { 'X-Record-Workspace': workspace } : {}),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, expected, label);
  const data = await response.json(); checks.push({ check: label, http: response.status, result: 'PASS' }); return data;
}
const title = 'Revision retention check — ' + new Date().toISOString();
const draft = await api('Create isolated draft', '', { title, terms: 'Deliver Friday.\n' }, 201);
await api('Save revision 2', '', { ...draft, title, terms: 'Deliver Monday.\n' }, 200);
await api('Reject stale save', '', { ...draft, title, terms: 'Do not save stale text.' }, 409);
const list = await api('List owner revisions', '/revisions?id=' + draft.id, undefined, 200);
assert.deepEqual(list.revisions.map(r => r.revision), [2, 1]);
const original = await api('Read revision 1', '/revision?id=' + draft.id + '&revision=1', undefined, 200);
assert.equal(original.terms, 'Deliver Friday.\n');
assert.equal(original.fingerprint, createHash('sha256').update(title + '\n\nDeliver Friday.\n').digest('hex'));
await api('Deny another workspace list', '/revisions?id=' + draft.id, undefined, 404, stranger);
await api('Deny another workspace content', '/revision?id=' + draft.id + '&revision=1', undefined, 404, stranger);
await api('Deny anonymous history', '/revisions?id=' + draft.id, undefined, 401, null);
const latest = await api('Read current revision', '/revision?id=' + draft.id + '&revision=2', undefined, 200);
assert.equal(latest.terms, 'Deliver Monday.\n');
console.log(JSON.stringify({ testedAt: new Date().toISOString(), origin: base, draftId: draft.id, checks,
  revisions: list.revisions.map(r => r.revision), originalFingerprint: original.fingerprint,
  note: 'Non-sensitive dedicated test draft only. No invitations or wallet actions. Workspace credentials omitted.' }, null, 2));
