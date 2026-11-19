import test from 'node:test';import assert from 'node:assert/strict';
import {createWorkspaceApi} from '../web/workspace-api.js';
const key='a'.repeat(64);
test('workspace reads and writes have bounded fetch and body waits and do not leak errors',async()=>{
 for(const fetcher of [async()=>new Promise(()=>{}),async()=>new Response(new ReadableStream({start(){}})),async()=>{throw Error('private-detail');}]){
 const api=createWorkspaceApi({getKey:()=>key,fetcher,timeoutMs:10});
 await assert.rejects(api(),e=>!e.uncertain&&!e.message.includes('private-detail'));
 }
});
test('interrupted save/share/recovery move/trash/restore/delete/feedback locks writes without retry but permits read-back',async()=>{
 for(const path of ['', '/share','/move','/trash','/restore','/delete','/feedback','/revoke']){
 let calls=0,committed=false;
 const api=createWorkspaceApi({getKey:()=>key,timeoutMs:10,fetcher:async(url,options)=>{
 calls++;assert.equal(options.headers.Authorization,'Bearer workspace:'+key);
 if(options.method==='POST'){committed=true;throw Error('response lost');}return Response.json([{id:'fixture',revision:2}]);}});
 await assert.rejects(api(path,{id:'fixture'}),e=>e.uncertain);assert.equal(committed,true);assert.equal(calls,1);
 await assert.rejects(api(path,{id:'fixture'}),e=>e.uncertain);assert.equal(calls,1);
 assert.equal((await api()).length,1);assert.equal(calls,2);
 }
});
test('known rejection does not lock; server or malformed successful write response stays uncertain',async()=>{
 let rejected=true;const api=createWorkspaceApi({getKey:()=>key,fetcher:async()=>Response.json(rejected?{error:'Revision changed.'}:{id:'fixture',revision:1},{status:rejected?409:200})});
 await assert.rejects(api('',{}),e=>!e.uncertain&&/Revision changed/.test(e.message));rejected=false;assert.equal((await api('',{})).id,'fixture');
 for(const fetcher of [async()=>Response.json({error:'internal'},{status:503}),async()=>new Response('bad'),async()=>Response.json({})]){
 const uncertain=createWorkspaceApi({getKey:()=>key,fetcher});await assert.rejects(uncertain('',{}),e=>e.uncertain);
 }
});
test('recovery and invitation reads preserve credentials and use bounded requests',async()=>{
 let observed;const api=createWorkspaceApi({getKey:()=>key,fetcher:async(url,options)=>{observed=options;return Response.json([]);}});
 await api('',undefined,'b'.repeat(64));assert.equal(observed.headers.Authorization,'Bearer workspace:'+'b'.repeat(64));assert.ok(observed.signal);
 const review=createWorkspaceApi({getKey:()=>key,invitation:true,fetcher:async(url,options)=>{assert.equal(options.headers.Authorization,undefined);throw Error('offline');}});
 await assert.rejects(review('/review',{token:'fixture'}),e=>!e.uncertain);
});
test('timed-out writes remain uncertain even if server committed or body never finishes',async()=>{
 for(const fetcher of [async()=>new Promise(()=>{}),async()=>new Response(new ReadableStream({start(){}}))]){
 const api=createWorkspaceApi({getKey:()=>key,fetcher,timeoutMs:10});
 await assert.rejects(api('',{title:'Fixture'}),e=>e.uncertain);
 await assert.rejects(api('',{title:'Fixture'}),/previous write/);
 }
});
