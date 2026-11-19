import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { INITIALIZE_SQL } from '../server/capacity.js';
import { privateAgreements } from '../server/private-agreements.js';

// Real SQLite with the D1 statement interface; isolated from hosted drafts.
function database({ legacy = false, before = legacy ? 5 : Infinity } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(new URL('../migrations/', import.meta.url)).sort()) {
    if (Number(file.slice(0,4)) < before) sqlite.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }
  if(before===Infinity)sqlite.prepare(INITIALIZE_SQL).get(67108864,Date.now());
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
    db.sqlite.exec(readFileSync(new URL('../migrations/0007_draft_trash.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0008_draft_delete.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0009_owner_transfer_quota.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0010_service_capacity.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0011_workspace_admission.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(readFileSync(new URL('../migrations/0012_relay_sessions.sql', import.meta.url), 'utf8'));
    db.sqlite.prepare(INITIALIZE_SQL).get(67108864,Date.now());
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


test('Trash is owner-scoped, revokes invitations atomically and restores every revision', async () => {
  const db = database();
  try {
    const draft = await (await call(db, '', { title: 'Trash check', terms: 'Friday' })).json();
    await call(db, '', { ...draft, title: 'Trash check', terms: 'Monday' });
    const saved = { id: draft.id, revision: 2 };
    const invite = await (await call(db, '/share', saved)).json();
    assert.equal((await call(db, '/trash', saved, stranger)).status, 409);
    assert.equal((await call(db, '/trash', draft)).status, 409);
    assert.equal((await call(db, '/trash', saved)).status, 200);
    assert.deepEqual(await (await call(db)).json(), []);
    const trash = await (await call(db, '/trash')).json();
    assert.equal(trash.length, 1); assert.equal(trash[0].id, draft.id);
    assert.equal('terms' in trash[0], false);
    assert.deepEqual(await (await call(db, '/trash', undefined, stranger)).json(), []);
    assert.equal((await call(db, '/item?id=' + draft.id)).status, 404);
    assert.equal((await call(db, '', { ...saved, title: 'Blocked', terms: 'Blocked' })).status, 409);
    assert.equal((await call(db, '/share', saved)).status, 409);
    assert.equal((await call(db, '/review', invite, null)).status, 404);
    assert.equal((await call(db, '/feedback', { ...invite, note: 'Blocked' }, null)).status, 409);
    assert.equal(db.sqlite.prepare('SELECT revoked FROM shares').get().revoked, 1);
    assert.equal((await call(db, '/restore', saved, stranger)).status, 409);
    assert.equal((await call(db, '/restore', saved)).status, 200);
    assert.equal((await (await call(db)).json())[0].revision, 2);
    assert.equal((await (await call(db, '/revision?id=' + draft.id + '&revision=1')).json()).terms, 'Friday');
    assert.equal((await (await call(db, '/revision?id=' + draft.id + '&revision=2')).json()).terms, 'Monday');
    assert.equal((await call(db, '/review', invite, null)).status, 404);
    const fresh = await (await call(db, '/share', saved)).json();
    assert.equal((await call(db, '/review', fresh, null)).status, 200);
  } finally { db.sqlite.close(); }
});

test('permanent deletion requires owner, Trash snapshot and confirmation; removes only its private rows', async () => {
  const db = database();
  try {
    const draft = await (await call(db, '', { title: 'Delete acceptance', terms: 'First' })).json();
    const other = await (await call(db, '', { title: 'Keep this', terms: 'Untouched' })).json();
    const invite = await (await call(db, '/share', draft)).json();
    await call(db, '/feedback', { ...invite, note: 'Test feedback' }, null);
    const token = db.sqlite.prepare('SELECT token_hash FROM shares').get().token_hash;
    db.sqlite.prepare('INSERT INTO invite_codes(token_hash,code_hash,expires,sent_at,sends) VALUES(?,?,?,?,?)').run(token,'old-code',1,1,1);
    await call(db, '', { ...draft, title: 'Delete acceptance', terms: 'Second' });
    const payload = { id: draft.id, revision: 2, trashedAt: 1, confirmation: 'DELETE' };
    assert.equal((await call(db, '/delete', payload)).status, 409);
    await call(db, '/trash', { id: draft.id, revision: 2 });
    payload.trashedAt = (await (await call(db, '/trash')).json())[0].trashed_at;
    assert.equal((await call(db, '/delete', { ...payload, confirmation: '' })).status, 400);
    assert.equal((await call(db, '/delete', payload, stranger)).status, 409);
    assert.equal((await call(db, '/delete', { ...payload, revision: 1 })).status, 409);
    assert.equal((await call(db, '/delete', { ...payload, trashedAt: payload.trashedAt - 1 })).status, 409);
    assert.equal((await call(db, '/delete', payload, owner, { origin: 'https://other.test' })).status, 403);
    assert.equal((await call(db, '/delete', payload)).status, 200);
    for (const table of ['shares', 'invite_codes', 'review_feedback']) assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ' + table).get().n, 0);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM draft_revisions WHERE draft_id = ?').get(draft.id).n, 0);
    assert.equal((await call(db, '/item?id=' + draft.id)).status, 404);
    assert.equal((await call(db, '/revision?id=' + draft.id + '&revision=1')).status, 404);
    assert.equal((await call(db, '/restore', { id: draft.id, revision: 2 })).status, 409);
    assert.equal((await call(db, '/review', invite, null)).status, 404);
    assert.equal((await (await call(db, '/item?id=' + other.id)).json()).terms, 'Untouched');
  } finally { db.sqlite.close(); }
});

test('permanent deletion rolls back dependent removals when final delete fails', async () => {
  const db = database();
  try {
    const d = await (await call(db, '', { title: 'Rollback', terms: 'Keep if failure' })).json();
    await call(db, '/share', d);
    await call(db, '/trash', d);
    const trash = (await (await call(db, '/trash')).json())[0];
    db.sqlite.exec("CREATE TRIGGER fail_delete AFTER DELETE ON drafts BEGIN SELECT RAISE(ABORT, 'injected_failure'); END");
    assert.equal((await call(db, '/delete', { ...d, trashedAt: trash.trashed_at, confirmation: 'DELETE' })).status, 503);
    for (const table of ['drafts', 'shares', 'draft_revisions']) assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ' + table).get().n, 1);
  } finally { db.sqlite.close(); }
});

test('invalid traffic cannot consume another workspace read or write allowance',async()=>{
 const db=database();try{
  const untouched={prepare(){throw new Error('Invalid route or origin reached database');}};
  assert.equal((await call(untouched,'/not-a-route')).status,404);
  assert.equal((await call(untouched,'',{title:'T',terms:'Text'},owner,{origin:'https://other.test'})).status,403);
  for(let n=0;n<650;n++) assert.equal((await call(db,'/not-a-route')).status,404);
  for(let n=0;n<650;n++) assert.ok([400,429].includes((await call(db,'',{title:'',terms:'Invalid'},owner)).status));
  assert.equal(db.sqlite.prepare("SELECT hits FROM request_limits WHERE scope='service:write'").get(),undefined);
  assert.equal((await call(db,'',undefined,stranger)).status,200);
  assert.equal((await call(db,'',{title:'Unaffected user',terms:'Saved correctly'},stranger)).status,201);
 }finally{db.sqlite.close();}
});

test('shared emergency write ceiling preserves owner and invitation reads',async()=>{
 const db=database();try{
  const draft=await (await call(db,'',{title:'Existing',terms:'Readable'})).json();
  const invite=await (await call(db,'/share',draft)).json();
  db.sqlite.prepare("INSERT INTO request_limits(scope,window_start,hits) VALUES('service:write',?,600) ON CONFLICT(scope) DO UPDATE SET window_start=excluded.window_start,hits=600").run(Math.floor(Date.now()/60000)*60000);
  const limited=await call(db,'',{title:'At capacity',terms:'Not written'},stranger);
  assert.equal(limited.status,429); assert.ok(Number(limited.headers.get('Retry-After'))>0);
  assert.equal((await call(db,'',undefined,stranger)).status,200);
  assert.equal((await call(db,'/item?id='+draft.id)).status,200);
  assert.equal((await call(db,'/review',invite,null)).status,200);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,1);
 }finally{db.sqlite.close();}
});

test('legacy ownership moves are all-or-nothing at quota and preserve revisions and invitations',async()=>{
 for(const existing of [48,49,50]){
  const db=database();try{
   const legacy={'oai-authenticated-user-id':'legacy-move-owner'};
   const first=await (await call(db,'',{title:'Legacy original',terms:'Friday'},null,legacy)).json();
   await call(db,'',{...first,title:'Legacy revised',terms:'Monday'},null,legacy);
   const invite=await (await call(db,'/share',{id:first.id,revision:2},null,legacy)).json();
   await call(db,'',{title:'Second legacy',terms:'Kept too'},null,legacy);
   const ownerHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner))).toString('hex');
   const destination='workspace:'+ownerHash;
   for(let n=0;n<existing;n++) db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(crypto.randomUUID(),destination,'Existing '+n,'Retained');
   const before=db.sqlite.prepare('SELECT * FROM drafts ORDER BY rowid').all();
   const revisions=db.sqlite.prepare('SELECT * FROM draft_revisions ORDER BY rowid').all();
   const shares=db.sqlite.prepare('SELECT * FROM shares ORDER BY rowid').all();
   const moved=await call(db,'/move',{},owner,legacy);
   assert.equal(moved.status,existing===48?200:409);
   assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get(destination).n,existing===48?50:existing);
   assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get('legacy-move-owner').n,existing===48?0:2);
   assert.deepEqual(db.sqlite.prepare('SELECT * FROM draft_revisions ORDER BY rowid').all(),revisions);
   assert.deepEqual(db.sqlite.prepare('SELECT * FROM shares ORDER BY rowid').all(),shares);
   if(existing!==48)assert.deepEqual(db.sqlite.prepare('SELECT * FROM drafts ORDER BY rowid').all(),before);
   assert.equal((await call(db,'/review',invite,null)).status,200);
  }finally{db.sqlite.close();}
 }
});

test('competing legacy moves cannot exceed the shared destination quota',async()=>{
 const db=database();try{
  const ownerHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner))).toString('hex');
  const destination='workspace:'+ownerHash;
  for(const[who,count]of [[destination,49],['legacy-a',1],['legacy-b',1]])for(let n=0;n<count;n++)db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(crypto.randomUUID(),who,'Concurrent','Kept');
  const responses=await Promise.all(['legacy-a','legacy-b'].map(who=>call(db,'/move',{},owner,{'oai-authenticated-user-id':who})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get(destination).n,50);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner IN (?,?)').get('legacy-a','legacy-b').n,1);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,51);
 }finally{db.sqlite.close();}
});

test('redacted transport preserves workspace identity, recovery and isolation; conflicts fail closed',async()=>{
 const db=database();
 try{
  const created=await call(db,'',{title:'Transport test',terms:'Same private owner.'});
  const draft=await created.json();
  const request=(key,legacy)=>privateAgreements(new Request(origin+'/api/drafts',{headers:{Authorization:'Bearer workspace:'+key,...(legacy?{'X-Record-Workspace':legacy}:{})}}),db);
  const recovered=await request(owner);assert.equal(recovered.status,200);assert.equal((await recovered.json())[0].id,draft.id);
  assert.deepEqual(await (await request(stranger)).json(),[]);
  assert.equal((await request(owner,stranger)).status,400);
  assert.equal((await request('invalid',owner)).status,400);
  assert.equal((await request(owner,owner)).status,200);
  const updated=await privateAgreements(new Request(origin+'/api/drafts',{method:'POST',headers:{Origin:origin,Authorization:'Bearer workspace:'+owner},body:JSON.stringify({...draft,title:'Updated',terms:'Same owner updated.'})}),db);
  assert.equal(updated.status,200);assert.equal((await (await call(db)).json())[0].title,'Updated');
 }finally{db.sqlite.close();}
});


test('pre-access-code invitation migration stays closed; owner can issue a fresh usable invitation',async()=>{
 const db=database({before:3});
 try{
  const hash=async text=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex');
  const id=crypto.randomUUID(),token='c'.repeat(64),code='d'.repeat(24),title='Legacy fixture',terms='Private legacy fixture text';
  const ownerId='workspace:'+await hash(owner),tokenHash=await hash(token);
  db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(id,ownerId,title,terms);
  db.sqlite.prepare('INSERT INTO shares(token_hash,draft_id,revision,reviewer_email,reviewer_id,title,terms,fingerprint,expires) VALUES(?,?,1,?,?,?,?,?,?)')
   .run(tokenHash,id,'fixture@example.test','old-reviewer',title,terms,await hash(title+'\n\n'+terms),Date.now()+86400000);
  db.sqlite.prepare('INSERT INTO invite_codes(token_hash,code_hash,expires,sent_at,sends) VALUES(?,?,?,?,1)')
   .run(tokenHash,await hash(code),Date.now()+86400000,Date.now());
  for(const file of readdirSync(new URL('../migrations/',import.meta.url)).sort())
   if(Number(file.slice(0,4))>=3)db.sqlite.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  db.sqlite.prepare(INITIALIZE_SQL).get(67108864,Date.now());
  assert.equal(db.sqlite.prepare('SELECT access_code_hash FROM shares WHERE token_hash=?').get(tokenHash).access_code_hash,null);
  for(const input of [{token},{token,code},{token,code:'0'.repeat(24)}]){
   const response=await call(db,'/review',input,null,{'oai-authenticated-user-id':'old-reviewer'});
   assert.equal(response.status,input.code?404:400);
   assert.equal((await response.text()).includes(terms),false);
  }
  assert.equal((await call(db,'/feedback',{token,code,note:'Must stay blocked'},null)).status,409);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM review_feedback').get().n,0);
  const freshResponse=await call(db,'/share',{id,revision:1});assert.equal(freshResponse.status,200);
  const fresh=await freshResponse.json();
  const review=await call(db,'/review',fresh,null);assert.equal(review.status,200);assert.equal((await review.json()).terms,terms);
  assert.equal((await call(db,'/feedback',{...fresh,note:'Fresh coded review works'},null)).status,201);
  assert.equal(db.sqlite.prepare('SELECT access_code_hash FROM shares WHERE token_hash=?').get(tokenHash).access_code_hash,null);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,1);
 }finally{db.sqlite.close();}
});
