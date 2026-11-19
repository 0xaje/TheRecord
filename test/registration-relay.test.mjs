import test from 'node:test';
import assert from 'node:assert/strict';
import {TxBody,TxRaw} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {relayRegistration as actualRelay} from '../server/registration-relay.js';
import {openLocalDatabase} from '../scripts/local-db.mjs';
import {createHash} from 'node:crypto';
// Locally seeded access isolates existing transport tests; not live anti-bot proof.
async function relayRegistration(request, options={}) {
 const db=openLocalDatabase(':memory:');
 const key='a'.repeat(64), binding=createHash('sha256').update(key).digest('hex');
 db.sqlite.prepare('INSERT INTO relay_sessions(binding,proof_hash,expires_at) VALUES(?,?,?)').run(binding,'transport-fixture',Date.now()+60000);
 const headers=new Headers(request.headers); headers.set('Authorization','Bearer relay:'+key);
 try {return await actualRelay(new Request(request,{headers}),{...options,env:{DB:db}});} finally {db.sqlite.close();}
}
const origin='https://record.test',route='/api/diana/cosmos/tx/v1beta1/txs';
const encode=(type='/qorechain.pqc.v1.MsgRegisterPQCKeyV2',extra={})=>Buffer.from(TxRaw.encode(TxRaw.fromPartial({bodyBytes:TxBody.encode(TxBody.fromPartial({messages:[{typeUrl:type,value:new Uint8Array()}],...extra})).finish(),signatures:[new Uint8Array([1])]})).finish()).toString('base64');
const req=(body,headers={})=>new Request(origin+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const envelope=()=>({tx_bytes:encode(),mode:'BROADCAST_MODE_SYNC'});
test('relay refuses forbidden routes, origin, content type and malformed envelopes before forwarding',async()=>{
 let calls=0;const options={fetcher:async()=>{calls++;return Response.json({});}};
 for(const path of ['/api/diana/not-allowed','/api/diana/cosmos/tx/v1beta1/txs/abc'])assert.equal((await relayRegistration(new Request(origin+path),options)).status,404);
 const cases=[[req(envelope(),{Origin:'https://other.test'}),403],[req(envelope(),{'Content-Type':'text/plain'}),415],[req('{'),400],[req('x'.repeat(16001)),413],[req({...envelope(),mode:'BROADCAST_MODE_BLOCK'}),400],[req({...envelope(),tx_bytes:encode('/cosmos.bank.v1beta1.MsgSend')}),400],[req({...envelope(),tx_bytes:encode(undefined,{extensionOptions:[{typeUrl:'/other',value:new Uint8Array()}]})}),400]];
 for(const[r,status]of cases)assert.equal((await relayRegistration(r,options)).status,status);
 assert.equal(calls,0);
});
test('relay forwards the exact signed registration only to fixed Diana endpoint and never retries',async()=>{
 let calls=0;const input=envelope();
 const response=await relayRegistration(req({...input,untrusted:'discard'}),{fetcher:async(url,options)=>{calls++;assert.equal(url,'https://api-testnet.qore.host/cosmos/tx/v1beta1/txs');assert.equal(options.redirect,'manual');assert.deepEqual(JSON.parse(options.body),input);assert.equal(new Headers(options.headers).has('Authorization'),false);return Response.json({tx_response:{code:0,txhash:'fixture-only'}});}});
 assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(calls,1);
});
test('relay bounds request/body waits, response bytes and hides upstream errors with uncertain-write guidance',async()=>{
 const bad=[
  async()=>{throw Error('private-upstream-detail');},
  async()=>new Response('private-upstream-detail',{status:302,headers:{Location:'https://other.test'}}),
  async()=>new Response('private-upstream-detail',{status:500}),
  async()=>new Response('<html>private-upstream-detail</html>',{headers:{'Content-Type':'text/html'}}),
  async()=>new Response('{bad private-upstream-detail',{headers:{'Content-Type':'application/json'}}),
  async()=>new Response('x'.repeat(262145),{headers:{'Content-Type':'application/json'}}),
  async(url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('private-upstream-detail')))),
  async()=>new Response(new ReadableStream({start(){}}),{headers:{'Content-Type':'application/json'}}),
 ];
 for(const fetcher of bad){let calls=0;const r=await relayRegistration(req(envelope()),{timeoutMs:10,fetcher:(...args)=>{calls++;return fetcher(...args);}});assert.equal(r.status,502);const data=await r.json();assert.equal(data.outcomeUnknown,true);assert.equal(JSON.stringify(data).includes('private-upstream-detail'),false);assert.equal(calls,1);}
 const stalled=new Request(origin+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:new ReadableStream({start(){}}),duplex:'half'});
 assert.equal((await relayRegistration(stalled,{timeoutMs:10,fetcher:()=>{throw Error('Must not forward');}})).status,408);
});
test('relay allowlisted read drops query and caller credentials; upstream rate limit is safe',async()=>{
 const response=await relayRegistration(new Request(origin+'/api/diana/cosmos/base/tendermint/v1beta1/node_info?untrusted=secret',{headers:{Authorization:'Bearer private-test'}}),{fetcher:async(url,options)=>{assert.equal(url,'https://api-testnet.qore.host/cosmos/base/tendermint/v1beta1/node_info');assert.equal(options.headers,undefined);return Response.json({default_node_info:{network:'fixture-only'}});}});
 assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
 const limited=await relayRegistration(req(envelope()),{fetcher:async()=>new Response('private-upstream-detail',{status:429})});
 assert.equal(limited.status,429);assert.equal((await limited.json()).outcomeUnknown,true);
 assert.equal((await relayRegistration(req(envelope(),{'Content-Type':'application/json-attacker'}))).status,415);
});
