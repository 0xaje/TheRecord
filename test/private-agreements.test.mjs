import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { privateAgreements } from '../server/private-agreements.js';

// Real SQLite with the D1 statement interface; isolated from hosted drafts.
function database({ legacy = false } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(new URL('../migrations/', import.meta.url)).sort()) {
    if (!legacy || (!file.startsWith('0005') && !file.startsWith('0006'))) sqlite.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
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


test('saved revisions retain exact text, fingerprint and owner scope', async () => {
  const db = database();
  try {
    const draft = await (await call(db, '', { title: 'Revision test', terms: 'Friday.\n' })).json();
    const invite = await (await call(db, '/share', draft)).json();
    assert.equal((await call(db, '', { ...draft, title: 'Revision test', terms: 'Monday.\n' })).status, 200);
    assert.equal((await call(db, '', { ...draft, title: 'Stale', terms: 'Wrong' })).status, 409);
    const list = await (await call(db, '/revisions?id=' + draft.id)).json();
    assert.deepEqual(list.revisions.map(r => r.revision), [2, 1]);
    assert.equal(list.nextBefore, null);
    assert.ok(list.revisions.every(r => r.saved_at > 0));
    const old = await (await call(db, '/revision?id=' + draft.id + '&revision=1')).json();
    assert.equal(old.title, 'Revision test'); assert.equal(old.terms, 'Friday.\n');
    assert.equal(old.fingerprint, Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('Revision test\n\nFriday.\n'))).toString('hex'));
    assert.equal((await call(db, '/revision?id=' + draft.id + '&revision=1', undefined, stranger)).status, 404);
    assert.equal((await call(db, '/revisions?id=' + draft.id, undefined, stranger)).status, 404);
    assert.equal((await call(db, '/revisions?id=' + draft.id, undefined, null)).status, 401);
    assert.equal((await call(db, '/revision?id=' + draft.id + '&revision=99')).status, 404);
    assert.equal((await call(db, '/revisions?id=' + draft.id + '&before=-1')).status, 400);
    assert.equal((await call(db, '/review', invite, null)).status, 404);
    assert.equal((await (await call(db)).json())[0].terms, 'Monday.\n');
  } finally { db.sqlite.close(); }
});

test('revision pages have no overlap and do not expose full text in lists', async () => {
  const db = database();
  try {
    const draft = await (await call(db, '', { title: 'Paging', terms: 'Revision 1' })).json();
    for (let revision = 1; revision < 23; revision++) {
      assert.equal((await call(db, '', { id: draft.id, revision, title: 'Paging', terms: 'Revision ' + (revision + 1) })).status, 200);
    }
    const first = await (await call(db, '/revisions?id=' + draft.id)).json();
    assert.equal(first.revisions.length, 20); assert.equal(first.nextBefore, 4);
    assert.equal(first.revisions[0].revision, 23); assert.equal('terms' in first.revisions[0], false);
    const second = await (await call(db, '/revisions?id=' + draft.id + '&before=' + first.nextBefore)).json();
    assert.deepEqual(second.revisions.map(r => r.revision), [3, 2, 1]);
    assert.equal(second.nextBefore, null);
  } finally { db.sqlite.close(); }
});

test('additive migration preserves a legacy current revision without inventing old text', async () => {
  const db = database({ legacy: true });
  try {
    const draft = { id: crypto.randomUUID() };
    const ownerHash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(owner))).toString('hex');
    db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(draft.id,'workspace:'+ownerHash,'Existing draft','Current legacy terms');
    db.sqlite.prepare('UPDATE drafts SET revision = 5 WHERE id = ?').run(draft.id);
    db.sqlite.exec(readFileSync(new URL('../migrations/0005_draft_revisions.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0006_backend_bounds.sql', import.meta.url), 'utf8'));
    const before = await (await call(db, '/revisions?id=' + draft.id)).json();
    assert.deepEqual(before.revisions.map(r => r.revision), [5]);
    assert.equal(before.revisions[0].saved_at, null);
    assert.equal((await call(db, '/revision?id=' + draft.id + '&revision=4')).status, 404);
    await call(db, '', { id: draft.id, revision: 5, title: 'Updated draft', terms: 'New terms' });
    const preserved = await (await call(db, '/revision?id=' + draft.id + '&revision=5')).json();
    assert.equal(preserved.terms, 'Current legacy terms'); assert.equal(preserved.saved_at, null);
    const after = await (await call(db, '/revisions?id=' + draft.id)).json();
    assert.deepEqual(after.revisions.map(r => r.revision), [6, 5]);
  } finally { db.sqlite.close(); }
});

test('workspace write throttle returns Retry-After without blocking reads', async () => {
  const db = database();
  try {
    for (let i = 0; i < 30; i++) assert.equal((await call(db, '', { title: '', terms: 'Invalid test' })).status, 400);
    const limited = await call(db, '', { title: '', terms: 'Invalid test' });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('Retry-After')) >= 1);
    assert.equal((await call(db)).status, 200);
    db.sqlite.exec('UPDATE request_limits SET window_start = 0');
    assert.equal((await call(db, '', { title: '', terms: 'Invalid test' })).status, 400);
  } finally { db.sqlite.close(); }
});

test('draft quota and keyset pagination preserve ownership and existing records', async () => {
  const db = database();
  try {
    const ownerHash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(owner))).toString('hex');
    for (let n = 0; n < 50; n++) db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(crypto.randomUUID(), 'workspace:' + ownerHash, 'Draft ' + n, 'Saved text');
    const firstResponse = await call(db);
    const first = await firstResponse.json();
    assert.equal(first.length, 20);
    const secondResponse = await call(db, '?before=' + firstResponse.headers.get('X-Next-Draft'));
    const second = await secondResponse.json();
    const third = await (await call(db, '?before=' + secondResponse.headers.get('X-Next-Draft'))).json();
    assert.equal(third.length, 10);
    assert.equal(new Set([...first, ...second, ...third].map(d => d.id)).size, 50);
    assert.equal((await call(db, '', { title: 'Over quota', terms: 'Do not save' })).status, 409);
    assert.equal((await call(db, '/item?id=' + third[0].id)).status, 200);
    assert.equal((await call(db, '/item?id=' + third[0].id, undefined, stranger)).status, 404);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM drafts').get().n, 50);
  } finally { db.sqlite.close(); }
});

test('retained revision and invitation quotas are atomic', async () => {
  const db = database();
  try {
    const d = await (await call(db, '', { title: 'Bounds', terms: 'Initial text' })).json();
    for (let revision = 1; revision < 200; revision++) db.sqlite.prepare('UPDATE drafts SET revision = revision + 1, terms = ? WHERE id = ?').run('Revision ' + (revision + 1), d.id);
    assert.equal((await call(db, '', { id: d.id, revision: 200, title: 'Bounds', terms: 'Do not save' })).status, 409);
    assert.equal(db.sqlite.prepare('SELECT revision FROM drafts WHERE id = ?').get(d.id).revision, 200);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM draft_revisions WHERE draft_id = ?').get(d.id).n, 200);
    for (let n = 0; n < 100; n++) db.sqlite.prepare('INSERT INTO shares(token_hash,draft_id,revision,reviewer_email,title,terms,fingerprint,expires) VALUES(?,?,?,?,?,?,?,?)').run(String(n).padStart(64, '0'),d.id,200,'','Bounds','Revision 200','0'.repeat(64),Date.now()+100000);
    assert.equal((await call(db, '/share', { id: d.id, revision: 200 })).status, 409);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM shares').get().n, 100);
  } finally { db.sqlite.close(); }
});

test('review throttling and temporary storage failures fail safely', async () => {
  const db = database();
  try {
    const d = await (await call(db, '', { title: 'Review limit', terms: 'Text' })).json();
    const invite = await (await call(db, '/share', d)).json();
    for (let i = 0; i < 30; i++) assert.equal((await call(db, '/review', { ...invite, code: '0'.repeat(24) }, null)).status, 404);
    assert.equal((await call(db, '/review', invite, null)).status, 429);
    db.sqlite.exec('UPDATE request_limits SET window_start = 0');
    assert.equal((await call(db, '/review', invite, null)).status, 200);
    const broken = { prepare() { throw new Error('Internal SQL details should not escape'); } };
    const failure = await call(broken);
    assert.equal(failure.status, 503);
    assert.equal((await failure.text()).includes('Internal SQL'), false);
  } finally { db.sqlite.close(); }
});
