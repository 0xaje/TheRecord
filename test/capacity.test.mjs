import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openLocalDatabase} from '../scripts/local-db.mjs';
import {capacityOperations,INITIALIZE_SQL,INVENTORY_SQL} from '../server/capacity.js';
import {privateAgreements} from '../server/private-agreements.js';
import {main as operator} from '../scripts/capacity-operator.mjs';
const origin='https://record.test',key='a'.repeat(64),token='c'.repeat(64);
const digest=s=>createHash('sha256').update(s).digest('hex');
const env=db=>({DB:db,RECORD_OPERATIONS_TOKEN_SHA256:digest(token)});
const ops=(db,path='',method='GET',headers={})=>capacityOperations(new Request(origin+'/api/operations/capacity'+path,{method,headers:{Authorization:'Bearer '+token,Origin:origin,...headers}}),env(db));
const call=(db,path='',body,workspace=key)=>privateAgreements(new Request(origin+'/api/drafts'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'X-Record-Workspace':workspace},...(body===undefined?{}:{body:JSON.stringify(body)})}),db);
const snapshot=db=>({drafts:db.sqlite.prepare('SELECT * FROM drafts ORDER BY rowid').all(),revisions:db.sqlite.prepare('SELECT * FROM draft_revisions ORDER BY rowid').all(),shares:db.sqlite.prepare('SELECT * FROM shares ORDER BY rowid').all(),capacity:db.sqlite.prepare('SELECT * FROM service_capacity').get()});

test('operator authentication fails before DB access and never exposes workspace content',async()=>{
 const untouched={prepare(){throw Error('Unauthorized database access');}};
 assert.equal((await ops(untouched,'','GET',{Authorization:''})).status,401);
 assert.equal((await ops(untouched,'','GET',{Authorization:'Bearer '+'d'.repeat(64)})).status,401);
 const db=openLocalDatabase(':memory:');try{
  await call(db,'',{title:'Private title do not expose',terms:'Private text do not expose'});
  const stats=await ops(db);assert.equal(stats.status,200);const body=await stats.json();
  assert.equal(body.reconciled,true);assert.equal(body.capacity.drafts_count,1);
  const text=JSON.stringify(body);for(const secret of [token,key,'Private title do not expose','Private text do not expose','workspace:'])assert.equal(text.includes(secret),false);
  assert.equal(body.antiBotGateEnabled,false);assert.equal(body.providerMonitoringVerified,false);
 }finally{db.sqlite.close();}
});

test('bounded baseline initializes existing rows atomically, cannot reset, and requires explicit confirmation',async()=>{
 const db=openLocalDatabase(':memory:');try{
  db.sqlite.exec('DELETE FROM service_capacity');
  const d={id:crypto.randomUUID(),owner:'workspace:'+digest(key)};
  db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(d.id,d.owner,'T','Existing');
  assert.equal((await call(db,'',{title:'Paused',terms:'No save'})).status,503);
  assert.equal((await call(db)).status,200);
  assert.equal((await ops(db,'/initialize','POST')).status,403);
  const initialized=await ops(db,'/initialize','POST',{'X-Record-Operation':'initialize-64MiB'});
  assert.equal(initialized.status,200);const b=await initialized.json();
  assert.equal(b.capacity.used_bytes,18);assert.equal(b.reconciled,true);
  const before=snapshot(db);assert.equal((await ops(db,'/initialize','POST',{'X-Record-Operation':'initialize-64MiB'})).status,409);assert.deepEqual(snapshot(db),before);
 }finally{db.sqlite.close();}
});

test('exact-fit budget, UTF-8 accounting and revision overflow roll back the whole save',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const bytes=Buffer.byteLength('T😀');db.sqlite.prepare('UPDATE service_capacity SET limit_bytes=?').run(bytes*2);
  const r=await call(db,'',{title:'T',terms:'😀'});assert.equal(r.status,201);const draft=await r.json();
  assert.equal((await (await ops(db)).json()).status,'full');
  const before=snapshot(db);
  const failure=await call(db,'',{...draft,title:'T',terms:'😀 changed'});assert.equal(failure.status,503);assert.equal((await failure.json()).code,'CAPACITY_FULL');
  assert.deepEqual(snapshot(db),before);
  assert.equal((await call(db,'/item?id='+draft.id)).status,200);
  assert.equal((await call(db,'/revisions?id='+draft.id)).status,200);
  db.sqlite.prepare('UPDATE service_capacity SET limit_bytes=67108864').run();
  assert.equal((await call(db,'',{...draft,title:'T',terms:'é'})).status,200);
  const measured=await (await ops(db)).json();assert.equal(measured.reconciled,true);assert.equal(measured.capacity.used_bytes,11);
 }finally{db.sqlite.close();}
});

test('snapshots and feedback are metered; Trash, restore, transfer and deletion stay consistent',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const draft=await (await call(db,'',{title:'T',terms:'Original'})).json();
  const invite=await (await call(db,'/share',draft)).json();
  assert.equal((await call(db,'/feedback',{...invite,note:'Please revise 😀'})).status,201);
  assert.equal((await (await ops(db)).json()).reconciled,true);
  const usage=db.sqlite.prepare('SELECT used_bytes FROM service_capacity').get().used_bytes;
  db.sqlite.prepare('UPDATE service_capacity SET limit_bytes=?').run(usage);
  assert.equal((await call(db,'/share',draft)).status,503);
  assert.equal((await call(db,'/trash',draft)).status,200);
  let row=db.sqlite.prepare('SELECT * FROM drafts WHERE id=?').get(draft.id);
  assert.equal((await (await ops(db)).json()).capacity.used_bytes,usage);
  assert.equal((await call(db,'/restore',draft)).status,200);
  assert.equal((await call(db,'/trash',draft)).status,200);
  row=db.sqlite.prepare('SELECT * FROM drafts WHERE id=?').get(draft.id);
  // Ownership changes are metadata and do not alter text accounting.
  db.sqlite.prepare('UPDATE drafts SET owner=? WHERE id=?').run('workspace:'+digest('b'.repeat(64)),draft.id);
  assert.equal((await (await ops(db)).json()).reconciled,true);
  const deletion=await call(db,'/delete',{id:draft.id,revision:1,trashedAt:row.trashed_at,confirmation:'DELETE'},'b'.repeat(64));assert.equal(deletion.status,200);
  const stats=await (await ops(db)).json();assert.equal(stats.reconciled,true);assert.equal(stats.capacity.used_bytes,0);for(const field of ['drafts','revisions','shares','feedback'])assert.equal(stats.capacity[field+'_count'],0);
 }finally{db.sqlite.close();}
});

test('failure in dependent deletion rolls back capacity decrements and all private rows',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const draft=await (await call(db,'',{title:'T',terms:'Retained'})).json();await call(db,'/share',draft);await call(db,'/trash',draft);
  const row=db.sqlite.prepare('SELECT trashed_at FROM drafts WHERE id=?').get(draft.id);
  db.sqlite.exec("CREATE TRIGGER fail_capacity_delete AFTER DELETE ON drafts BEGIN SELECT RAISE(ABORT,'test_failure'); END;");
  const before=snapshot(db);assert.equal((await call(db,'/delete',{...draft,trashedAt:row.trashed_at,confirmation:'DELETE'})).status,503);assert.deepEqual(snapshot(db),before);
 }finally{db.sqlite.close();}
});

test('existing over-budget data remains intact and readable; competing growth cannot overspend',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const draft=await (await call(db,'',{title:'T',terms:'Existing'})).json();
  db.sqlite.exec('DELETE FROM service_capacity');db.sqlite.prepare(INITIALIZE_SQL).get(1,Date.now());
  assert.equal((await call(db,'/item?id='+draft.id)).status,200);assert.equal((await (await ops(db)).json()).status,'full');
  assert.equal((await call(db,'',{title:'New',terms:'Refused'})).status,503);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,1);
  db.sqlite.prepare('UPDATE service_capacity SET limit_bytes=used_bytes+4').run();
  const results=await Promise.all([call(db,'',{title:'T',terms:'x'}),call(db,'',{title:'T',terms:'x'},'b'.repeat(64))]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,503]);assert.equal((await (await ops(db)).json()).reconciled,true);
 }finally{db.sqlite.close();}
});

test('request scopes are bounded without evicting live limits; stale cleanup admits a new scope',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const now=Math.floor(Date.now()/60000)*60000;
  const insert=db.sqlite.prepare('INSERT INTO request_limits(scope,window_start,hits) VALUES(?,?,1)');
  for(let n=0;n<4096;n++)insert.run(n===0?'read:'+digest('workspace:'+digest(key)):'scope:'+n,now);
  assert.equal((await call(db)).status,200);
  assert.equal((await call(db,'',undefined,'b'.repeat(64))).status,429);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM request_limits').get().n,4096);
  db.sqlite.exec('UPDATE request_limits SET window_start=0');
  assert.equal((await call(db,'',undefined,'b'.repeat(64))).status,200);assert.ok(db.sqlite.prepare('SELECT COUNT(*) n FROM request_limits').get().n<=4096);
 }finally{db.sqlite.close();}
});

test('operator CLI init is offline, private, non-replacing and never prints its token',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'record-ops-')),file=join(folder,'operator.secret');try{
  const result=await operator(['init'],file);const secret=JSON.parse(readFileSync(file,'utf8'));
  assert.equal(result.publicTokenSha256,digest(secret.token));assert.equal(JSON.stringify(result).includes(secret.token),false);
  await assert.rejects(operator(['init'],file),/EEXIST/);
  await assert.rejects(operator(['initialize'],file),/Review inventory/);
 }finally{rmSync(folder,{recursive:true,force:true});}
});

test('bounded inventory refuses oversized initialization without changing existing records',async()=>{
 const db=openLocalDatabase(':memory:');try{
  db.sqlite.exec('DELETE FROM service_capacity');
  const insert=db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)');
  for(let n=0;n<2001;n++)insert.run(crypto.randomUUID(),'owner:'+Math.floor(n/50),'T','x');
  const stats=await (await ops(db)).json();assert.equal(stats.inventoryExhaustive,false);assert.equal(stats.inventory.drafts_count,2001);
  assert.equal((await ops(db,'/initialize','POST',{'X-Record-Operation':'initialize-64MiB'})).status,409);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,2001);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM service_capacity').get().n,0);
 }finally{db.sqlite.close();}
});

test('operator readout flags counter drift instead of describing it as normal',async()=>{
 const db=openLocalDatabase(':memory:');try{
  await call(db,'',{title:'T',terms:'Stored'});
  db.sqlite.exec('UPDATE service_capacity SET used_bytes=used_bytes+1');
  const stats=await (await ops(db)).json();assert.equal(stats.reconciled,false);assert.equal(stats.status,'accounting-mismatch');
 }finally{db.sqlite.close();}
});

test('provider probe requires operator authorization and explicit confirmation, with no DB mutation',async()=>{
 const untouched={prepare(){throw Error('Provider probe must not read private rows');}};
 const original=globalThis.fetch;
 try{
  assert.equal((await ops(untouched,'/provider-probe','POST',{Authorization:''})).status,401);
  assert.equal((await ops(untouched,'/provider-probe','POST')).status,403);
  globalThis.fetch=async()=>Response.json({success:false,'error-codes':['invalid-input-response']});
  const response=await capacityOperations(new Request(origin+'/api/operations/capacity/provider-probe',{method:'POST',headers:{Authorization:'Bearer '+token,Origin:origin,'X-Record-Operation':'probe-no-save'}}),{...env(untouched),RECORD_TURNSTILE_SITE_KEY:'fixture-public-site-key',RECORD_TURNSTILE_SECRET:'fixture-private-secret',RECORD_TURNSTILE_HOSTNAME:'record.test'});
  assert.equal(response.status,200);const p=await response.json();assert.equal(p.invalidTokenRejected,true);assert.equal(p.admissionGranted,false);assert.equal(p.draftSaved,false);
 }finally{globalThis.fetch=original;}
});

test('operator database-size readout allows only valid provider bytes; missing metadata stays unknown',async()=>{
 const db=openLocalDatabase(':memory:');try{
  await call(db,'',{title:'Private title',terms:'Private terms'});
  const before=snapshot(db);
  for(const value of [1048576,undefined,null,0,-1,1.5,'1048576',Infinity,Number.MAX_SAFE_INTEGER+1]){
   const decorated={prepare(sql){const prepared=db.prepare(sql);return{bind(...args){const statement=prepared.bind(...args);return{...statement,async all(){return{...await statement.all(),meta:{size_after:value,private_provider_field:'must-not-leak'}};}};}};}};
   const response=await ops(decorated);assert.equal(response.status,200);const result=await response.json();
   assert.equal(result.databaseStorage.reportedSizeBytes,value===1048576?1048576:null);
   assert.equal(result.databaseStorage.providerQuotaBytes,null);
   assert.equal(result.operations.automaticAlertDelivery,'not-configured');assert.equal(result.operations.backupRetentionVerified,false);assert.equal(result.providerMonitoringVerified,false);
   const json=JSON.stringify(result);for(const secret of ['must-not-leak','Private title','Private terms'])assert.equal(json.includes(secret),false);
  }
  assert.deepEqual(snapshot(db),before);
 }finally{db.sqlite.close();}
});
