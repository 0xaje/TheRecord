// Provider responses and signed envelopes here are local adapter fixtures only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openLocalDatabase} from '../scripts/local-db.mjs';
import {relayAccess,authorizeRelay} from '../server/relay-access.js';
import {relayRegistration} from '../server/registration-relay.js';
const origin='https://record.test', key='a'.repeat(64), digest=x=>createHash('sha256').update(x).digest('hex');
const binding=digest(key), now=1795095000000;
const config={RECORD_TURNSTILE_SITE_KEY:'fixture-site-key',RECORD_TURNSTILE_SECRET:'fixture-secret-key',RECORD_TURNSTILE_HOSTNAME:'record.test'};
const request=(path='/api/relay/session',options={})=>new Request(origin+path,{...options,headers:{Authorization:'Bearer relay:'+key,Origin:origin,...options.headers}});
const post=(token='fixture-proof',headers={})=>request('/api/relay/session',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({token})});
const verified=(patch={})=>async()=>Response.json({success:true,hostname:'record.test',action:'diana-relay',cdata:binding,challenge_ts:new Date(now).toISOString(),...patch});
const seed=(db,k=key,expiry=now+900000)=>db.sqlite.prepare('INSERT INTO relay_sessions(binding,proof_hash,expires_at) VALUES(?,?,?)').run(digest(k),digest('proof'+k),expiry);

test('relay access requires provider proof bound to host, action, session and age; stores hashes only',async()=>{
 const db=openLocalDatabase(':memory:'),env={...config,DB:db};try{
  const policy=await relayAccess(request('/api/relay/policy'),env,{now});const p=await policy.json();assert.equal(p.binding,binding);assert.equal(p.action,'diana-relay');assert.equal(p.required,true);assert.equal(JSON.stringify(p).includes(config.RECORD_TURNSTILE_SECRET),false);
  let calls=0;const options={now,fetcher:async()=>{calls++;return verified()();}};
  for(const patch of [{success:false},{action:'new-workspace'},{hostname:'wrong.test'},{cdata:'wrong'},{challenge_ts:'invalid'},{challenge_ts:new Date(now-300001).toISOString()},{challenge_ts:new Date(now+30001).toISOString()}]) assert.equal((await relayAccess(post(),env,{now,fetcher:verified(patch)})).status,403);
  assert.equal((await relayAccess(post(),env,options)).status,200);assert.equal(calls,1);
  const row=db.sqlite.prepare('SELECT * FROM relay_sessions').get();assert.equal(row.binding,binding);assert.equal(row.proof_hash,digest('fixture-proof'));assert.equal(row.expires_at,now+900000);assert.equal(JSON.stringify(row).includes('fixture-proof'),false);assert.equal(JSON.stringify(row).includes(key),false);
  const existing=await relayAccess(request('/api/relay/policy'),env,{now});assert.deepEqual(await existing.json(),{required:false,expiresAt:now+900000});
  assert.equal(await authorizeRelay(request('/api/diana/test'),env,'read',now),null);
 }finally{db.sqlite.close();}
});

test('session endpoint fails closed on missing configuration, malformed bodies, provider failure and replay',async()=>{
 const db=openLocalDatabase(':memory:'),env={...config,DB:db};try{
  assert.equal((await relayAccess(new Request(origin+'/api/relay/policy'),env,{now})).status,401);
  assert.equal((await relayAccess(post(),{DB:db},{now})).status,503);
  assert.equal((await relayAccess(post('x',{Origin:'https://evil.test'}),env,{now})).status,403);
  assert.equal((await relayAccess(post('x',{'Content-Type':'text/plain'}),env,{now})).status,415);
  assert.equal((await relayAccess(post('x'.repeat(4096)),env,{now})).status,400);
  assert.equal((await relayAccess(post(''),env,{now})).status,403);
  const failure=await relayAccess(post(),env,{now,fetcher:async()=>{throw Error('private-secret');}});assert.equal(failure.status,503);assert.equal((await failure.text()).includes('private-secret'),false);
  assert.equal((await relayAccess(post(),env,{now,fetcher:verified()})).status,200);
  const other='b'.repeat(64);const replay=post('fixture-proof',{Authorization:'Bearer relay:'+other});assert.equal((await relayAccess(replay,env,{now,fetcher:verified({cdata:digest(other)})})).status,409);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM relay_sessions').get().n,1);
 }finally{db.sqlite.close();}
});

test('unverified or forged source headers never authorize or reach Diana; expiry and DB failure fail closed',async()=>{
 const db=openLocalDatabase(':memory:'),env={DB:db};try{
  let calls=0;const fetcher=async()=>{calls++;return Response.json({});};
  const path='/api/diana/cosmos/base/tendermint/v1beta1/node_info';
  for(const headers of [{},{'CF-Connecting-IP':'1.2.3.4','X-Forwarded-For':'1.2.3.4','oai-authenticated-user-id':'fake'},{Authorization:'Bearer relay:'+key}])assert.equal((await relayRegistration(new Request(origin+path,{headers}),{env,fetcher})).status,401);
  seed(db,key,Date.now()-1);assert.equal((await relayRegistration(request(path),{env,fetcher})).status,401);assert.equal(calls,0);
  assert.equal((await authorizeRelay(request(path),{},'read',now)).status,503);
  assert.equal((await authorizeRelay(request(path),{DB:{prepare(){throw Error('private-db-detail');}}},'read',now)).status,503);
 }finally{db.sqlite.close();}
});

test('atomic session limits survive concurrency and credential/header rotation; reads stay available after send cap',async()=>{
 const db=openLocalDatabase(':memory:'),env={DB:db};try{
  seed(db);const req=request('/api/diana/read');
  const results=await Promise.all(Array.from({length:10},(_,n)=>authorizeRelay(request('/api/diana/read',{headers:{'X-Forwarded-For':'forged-'+n}}),env,'broadcast',now)));
  assert.equal(results.filter(r=>r===null).length,3);for(const r of results.filter(Boolean)){assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'60');assert.equal((await r.json()).broadcastSubmitted,false);}
  for(let minute=1;minute<4;minute++)for(let n=0;n<3;n++)assert.equal(await authorizeRelay(req,env,'broadcast',now+minute*60000),null);
  assert.equal((await authorizeRelay(req,env,'broadcast',now+4*60000)).status,429);
  assert.equal(await authorizeRelay(req,env,'read',now+4*60000),null);
  for(let n=1;n<120;n++)assert.equal(await authorizeRelay(req,env,'read',now+4*60000),null);
  assert.equal((await authorizeRelay(req,env,'read',now+4*60000)).status,429);
  assert.equal(await authorizeRelay(req,env,'read',now+5*60000),null);
  assert.equal((await authorizeRelay(req,env,'read',now+900000)).status,401);
 }finally{db.sqlite.close();}
});

test('service-wide limits persist across sessions and bound provider verification before outbound work',async()=>{
 const db=openLocalDatabase(':memory:'),env={...config,DB:db};try{
  const window=Math.floor(now/60000)*60000;
  db.sqlite.prepare('INSERT INTO request_limits(scope,window_start,hits) VALUES(?,?,?)').run('relay:checks',window,30);
  let calls=0;assert.equal((await relayAccess(post(),env,{now,fetcher:async()=>{calls++;return verified()();}})).status,429);assert.equal(calls,0);
  seed(db);db.sqlite.prepare('INSERT INTO request_limits(scope,window_start,hits) VALUES(?,?,?)').run('relay:read',window,600);
  assert.equal((await authorizeRelay(request('/api/diana/read'),env,'read',now)).status,429);
  assert.equal(await authorizeRelay(request('/api/diana/read'),env,'read',now+60000),null);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) n FROM request_limits WHERE scope LIKE 'relay:%'").get().n,2);
 }finally{db.sqlite.close();}
});

test('relay sessions are bounded; expiry cleanup frees rows without removing active sessions',async()=>{
 const db=openLocalDatabase(':memory:'),env={...config,DB:db};try{
  const insert=db.sqlite.prepare('INSERT INTO relay_sessions(binding,proof_hash,expires_at) VALUES(?,?,?)');for(let n=0;n<4096;n++)insert.run('binding'+n,'proof'+n,now+900000);
  assert.equal((await relayAccess(post(),env,{now,fetcher:verified()})).status,409);
  db.sqlite.exec('UPDATE relay_sessions SET expires_at=0');
  assert.equal((await relayAccess(post(),env,{now,fetcher:verified()})).status,200);
  assert.ok(db.sqlite.prepare('SELECT COUNT(*) n FROM relay_sessions').get().n<=4096);
 }finally{db.sqlite.close();}
});
