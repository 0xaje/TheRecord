import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { privateAgreements } from '../server/private-agreements.js';

// Real SQLite with the D1 statement interface; isolated from hosted drafts.
function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../migrations/', import.meta.url)).sort()) {
    sqlite.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }
  return { sqlite, prepare(sql) { return { bind(...args) {
    const statement = sqlite.prepare(sql);
    return {
      async first() { return statement.get(...args) ?? null; },
      async all() { return { results: statement.all(...args) }; },
      async run() { const result = statement.run(...args); return { meta: { changes: result.changes } }; },
    };
  } }; } };
}

const origin = 'https://record.test';
const owner = 'a'.repeat(64);
const stranger = 'b'.repeat(64);
function call(db, path = '', body, key = owner, extra = {}) {
  return privateAgreements(new Request(origin + '/api/drafts' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(key ? { 'X-Record-Workspace': key } : {}), origin, ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), db);
}

test('draft, review, feedback, revision isolation and revocation', async () => {
  const db = database();
  try {
    const created = await call(db, '', { title: 'Audit agreement', terms: 'Deliver Friday.' });
    assert.equal(created.status, 201);
    const draft = await created.json();
    assert.equal((await (await call(db)).json()).length, 1);
    assert.deepEqual(await (await call(db, '', undefined, stranger)).json(), []);
    assert.equal((await call(db, '/share', draft, stranger)).status, 409);
    const invite = await (await call(db, '/share', draft)).json();
    assert.equal((await call(db, '/review', { ...invite, code: '0'.repeat(24) }, null)).status, 404);
    const reviewed = await (await call(db, '/review', invite, null)).json();
    assert.equal(reviewed.terms, 'Deliver Friday.');
    assert.equal(reviewed.fingerprint, Buffer.from(await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode('Audit agreement\n\nDeliver Friday.'))).toString('hex'));
    assert.equal((await call(db, '/feedback', { ...invite, note: 'Please change the date.' }, null)).status, 201);
    assert.equal((await call(db, '/feedback', { ...invite, note: 'Duplicate' }, null)).status, 409);
    assert.equal((await (await call(db, '/feedback?id=' + draft.id)).json()).length, 1);
    assert.equal((await call(db, '', { ...draft, title: 'Audit agreement', terms: 'Deliver Monday.' })).status, 200);
    assert.equal((await call(db, '/review', invite, null)).status, 404);
    assert.equal((await call(db, '', { ...draft, title: 'Stale', terms: 'Old write' })).status, 409);
    const secondInvite = await (await call(db, '/share', { id: draft.id, revision: 2 })).json();
    assert.equal((await call(db, '/review', secondInvite, null)).status, 200);
    await call(db, '/revoke', { id: draft.id });
    assert.equal((await call(db, '/review', secondInvite, null)).status, 404);
  } finally { db.sqlite.close(); }
});

test('expiry, malformed requests, origins and storage failures', async () => {
  const db = database();
  try {
    assert.equal((await call(db, '', { title: 'Title', terms: 'Text' }, owner, { origin: 'https://other.test' })).status, 403);
    assert.equal((await call(db, '', { title: 'Title', terms: 'Text' }, 'invalid')).status, 400);
    assert.equal((await call(db, '', { title: 'Title', terms: 'Text' }, null)).status, 401);
    assert.equal((await call(db, '', { title: '', terms: 'Text' })).status, 400);
    assert.equal((await call(db, '', { title: 'Title', terms: 'x'.repeat(100001) })).status, 400);
    assert.equal((await call(undefined)).status, 503);
    const draft = await (await call(db, '', { title: 'Expiry', terms: 'Text' })).json();
    const invite = await (await call(db, '/share', draft)).json();
    db.sqlite.exec('UPDATE shares SET expires = 0');
    assert.equal((await call(db, '/review', invite, null)).status, 404);
  } finally { db.sqlite.close(); }
});
