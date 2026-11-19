// Siteverify responses below are explicitly local adapter fixtures, NOT live anti-bot proof.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {openLocalDatabase} from '../scripts/local-db.mjs';
import {admitNewWorkspace,admissionPolicy} from '../server/admission.js';
import {privateAgreements} from '../server/private-agreements.js';
const origin='https://record.test',request=new Request(origin+'/api/drafts'),hash=x=>createHash('sha256').update(x).digest('hex');
const owner='workspace:'+hash('a'.repeat(64));
const env={RECORD_ADMISSION_MODE:'enforce',RECORD_TURNSTILE_SITE_KEY:'fixture-public-site-key',RECORD_TURNSTILE_SECRET:'fixture-private-secret',RECORD_TURNSTILE_HOSTNAME:'record.test'};
const valid=()=>({success:true,hostname:'record.test',action:'new-workspace',cdata:owner.slice(10),challenge_ts:new Date().toISOString()});
const fetchFixture=(patch={})=>async(url,options)=>{assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.equal(options.redirect,'manual');assert.equal(JSON.parse(options.body).secret,env.RECORD_TURNSTILE_SECRET);assert.equal(Object.hasOwn(JSON.parse(options.body),'remoteip'),false);return Response.json({...valid(),...patch});};

test('off is inert; preview is opt-in; enforce fails closed without configuration or proof',async()=>{
 const untouched={prepare(){throw Error('Off mode reached database');}};
 await admitNewWorkspace(request,untouched,{},owner,undefined,()=>{throw Error('Off mode reached provider');});
 await admitNewWorkspace(request,untouched,{RECORD_ADMISSION_MODE:'preview'},owner,undefined);
 const db=openLocalDatabase(':memory:');try{
  await assert.rejects(admitNewWorkspace(request,db,{RECORD_ADMISSION_MODE:'enforce'},owner,'token'),/not configured/);
  await assert.rejects(admitNewWorkspace(request,db,env,owner,undefined),/Complete/);
  const result=await privateAgreements(new Request(origin+'/api/drafts',{method:'POST',headers:{Origin:origin,'X-Record-Workspace':'a'.repeat(64)},body:JSON.stringify({title:'T',terms:'No proof'})}),db,env);
  assert.equal(result.status,403);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,0);
 }finally{db.sqlite.close();}
});

test('existing and trashed workspaces preserve access without a new challenge',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const id=crypto.randomUUID();db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(id,owner,'T','Existing');db.sqlite.prepare('UPDATE drafts SET trashed_at=1 WHERE id=?').run(id);
  await admitNewWorkspace(request,db,{RECORD_ADMISSION_MODE:'enforce'},owner,undefined,()=>{throw Error('Existing owner challenged');});
  const policy=await admissionPolicy(new Request(origin+'/api/admission/policy',{headers:{'X-Record-Workspace':'a'.repeat(64)}}),{DB:db,RECORD_ADMISSION_MODE:'enforce'});
  assert.deepEqual(await policy.json(),{mode:'enforce',required:false});
 }finally{db.sqlite.close();}
});

test('server validation binds hostname, action, age and workspace; errors never admit',async()=>{
 const db=openLocalDatabase(':memory:');try{
  for(const patch of [{success:false},{hostname:'other.test'},{action:'other-action'},{cdata:'wrong'},{challenge_ts:'invalid'},{challenge_ts:new Date(Date.now()-301000).toISOString()},{challenge_ts:new Date(Date.now()+60000).toISOString()}])await assert.rejects(admitNewWorkspace(request,db,env,owner,'token',fetchFixture(patch)),/expired or did not match/);
  await assert.rejects(admitNewWorkspace(request,db,env,owner,'token',async()=>{throw Error('private provider detail');}),/could not be confirmed/);
  await assert.rejects(admitNewWorkspace(request,db,env,owner,'token',async()=>new Response('x'.repeat(16385))),/could not be confirmed/);
  await assert.rejects(admitNewWorkspace(request,db,env,owner,'x'.repeat(2049),fetchFixture()),/Complete/);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM workspace_admissions').get().n,0);
 }finally{db.sqlite.close();}
});

test('successful adapter fixture stores only hashes, bounds replay and preserves an admission',async()=>{
 const db=openLocalDatabase(':memory:');try{
  await admitNewWorkspace(request,db,env,owner,'fixture-success-token',fetchFixture());
  const admission=db.sqlite.prepare('SELECT * FROM workspace_admissions').get();assert.equal(admission.owner,owner);assert.equal(admission.token_hash,hash('fixture-success-token'));assert.equal(JSON.stringify(admission).includes('fixture-success-token'),false);
  await admitNewWorkspace(request,db,env,owner,undefined,()=>{throw Error('admitted workspace called provider');});
  const other='workspace:'+hash('b'.repeat(64));await assert.rejects(admitNewWorkspace(request,db,env,other,'fixture-success-token',fetchFixture({cdata:other.slice(10)})),/already used/);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM workspace_admissions').get().n,1);
 }finally{db.sqlite.close();}
});

test('admissions have a bounded row ceiling and expiry frees space without evicting active records',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const insert=db.sqlite.prepare('INSERT INTO workspace_admissions(owner,token_hash,expires_at) VALUES(?,?,?)');for(let n=0;n<4096;n++)insert.run('workspace:'+n,hash('token'+n),Date.now()+100000);
  await assert.rejects(admitNewWorkspace(request,db,env,owner,'fresh-token',fetchFixture()),/at capacity/);
  db.sqlite.exec('UPDATE workspace_admissions SET expires_at=0');
  await admitNewWorkspace(request,db,env,owner,'fresh-token',fetchFixture());assert.ok(db.sqlite.prepare('SELECT COUNT(*) n FROM workspace_admissions').get().n<=4096);
 }finally{db.sqlite.close();}
});

test('public policy exposes only configured sitekey and binding, not provider secret; rejects dummy keys',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const request=new Request(origin+'/api/admission/policy',{headers:{'X-Record-Workspace':'a'.repeat(64)}});
  const response=await admissionPolicy(request,{...env,DB:db});assert.equal(response.status,200);const p=await response.json();assert.equal(p.workspaceBinding,owner.slice(10));assert.equal(p.required,true);assert.equal(JSON.stringify(p).includes(env.RECORD_TURNSTILE_SECRET),false);
  const dummy=await admissionPolicy(request,{...env,DB:db,RECORD_TURNSTILE_SITE_KEY:'1x00000000000000000000AA'});assert.equal(dummy.status,503);
 }finally{db.sqlite.close();}
});

test('browser helper does not load a widget in off mode and does not retry a failed policy',async()=>{
 const {collectAdmissionToken}=await import('../web/admission.js');const originalFetch=globalThis.fetch,originalLocation=globalThis.location;let calls=0;
 try{
  globalThis.location={search:''};globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/admission/policy');assert.equal(options.headers.Authorization,'Bearer workspace:'+'a'.repeat(64));assert.equal(Object.hasOwn(options.headers,'X-Record-Workspace'),false);return Response.json({mode:'off',required:false});};
  assert.equal(await collectAdmissionToken('a'.repeat(64)),undefined);assert.equal(calls,1);
  calls=0;globalThis.fetch=async()=>{calls++;return Response.json({error:'Policy unavailable'},{status:503});};
  await assert.rejects(collectAdmissionToken('a'.repeat(64)),/Policy unavailable/);assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch;globalThis.location=originalLocation;}
});

test('opt-in preview on an existing workspace really validates with provider instead of bypassing it',async()=>{
 const db=openLocalDatabase(':memory:');try{
  db.sqlite.prepare('INSERT INTO drafts(id,owner,title,terms) VALUES(?,?,?,?)').run(crypto.randomUUID(),owner,'T','Existing');
  const previewEnv={...env,DB:db,RECORD_ADMISSION_MODE:'preview'};
  const policy=await admissionPolicy(new Request(origin+'/api/admission/policy?preview=1',{headers:{'X-Record-Workspace':'a'.repeat(64)}}),previewEnv);
  const p=await policy.json();assert.equal(p.mode,'preview');assert.equal(p.sitekey,env.RECORD_TURNSTILE_SITE_KEY);
  let called=false;await admitNewWorkspace(request,db,previewEnv,owner,'preview-token',async(...args)=>{called=true;return fetchFixture()(...args);});assert.equal(called,true);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM drafts').get().n,1);
 }finally{db.sqlite.close();}
});

test('misspelled admission mode cannot silently disable a configured gate',async()=>{
 const db=openLocalDatabase(':memory:');try{
  const invalid={...env,RECORD_ADMISSION_MODE:'enfroce'};
  await assert.rejects(admitNewWorkspace(request,db,invalid,owner,'token',fetchFixture()),/not configured/);
  const policy=await admissionPolicy(new Request(origin+'/api/admission/policy',{headers:{'X-Record-Workspace':'a'.repeat(64)}}),{...invalid,DB:db});assert.equal(policy.status,503);
 }finally{db.sqlite.close();}
});

test('provider diagnostics classify failures without exposing tokens, secrets or response bodies',async()=>{
 const {requestSiteverify,admissionProviderProbe}=await import('../server/admission.js');
 const secretText='never-print-this-private-provider-message';
 const cases=[
  [async()=>{throw Error(secretText);},'AP-CONNECTION'],
  [async()=>new Response(secretText,{status:403}),'AP-HTTP-403'],
  [async(url,options)=>{assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://untrusted.test'}});},'AP-HTTP-302'],
  [async()=>new Response('not-json '+secretText),'AP-JSON'],
  [async()=>new Response('x'.repeat(16385)),'AP-SIZE'],
  [async()=>Response.json(null),'AP-SHAPE'],
 ];
 for(const[fetcher,code]of cases){
  const r=await requestSiteverify(env,'sensitive-challenge-token',fetcher);assert.equal(r.ok,false);assert.equal(r.code,code);
  const text=JSON.stringify(r);for(const hidden of [secretText,env.RECORD_TURNSTILE_SECRET,'sensitive-challenge-token'])assert.equal(text.includes(hidden),false);
 }
 const result=await admissionProviderProbe(request,env,async()=>Response.json({success:false,'error-codes':['invalid-input-response',secretText],secret:secretText,hostname:'private.example'}));
 assert.equal(result.connectionConfirmed,true);assert.equal(result.invalidTokenRejected,true);assert.deepEqual(result.providerCodes,['invalid-input-response']);assert.equal(result.admissionGranted,false);assert.equal(result.draftSaved,false);assert.equal(JSON.stringify(result).includes(secretText),false);
});
