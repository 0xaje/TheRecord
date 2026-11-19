// Local RPC fixtures test error paths only; real Diana acceptance is saved separately.
import test from 'node:test';import assert from 'node:assert/strict';
import {verifyAgreementFile,createVerificationRpc,verificationErrorMessage}from'../web/file-verification.js';
import {LEGACY_DEPLOYMENT,WITHDRAWAL_DEPLOYMENT}from'../web/deployments.js';
const text='Fixture only',file={arrayBuffer:async()=>new TextEncoder().encode(text).buffer},id='0x'+'a'.repeat(64);
const hash=Buffer.from(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())).toString('hex');
const record=(fingerprint=hash,approvals=3,finalized=1,withdrawn)=>'0x'+fingerprint+[approvals,finalized,...(withdrawn===undefined?[]:[withdrawn])].map(n=>n.toString(16).padStart(64,'0')).join('');
const input={deployment:LEGACY_DEPLOYMENT,id,version:'1',file};
const rpc=(value=record(),chain='0x2648')=>async method=>method==='eth_chainId'?chain:value;
test('verifier validates input and missing file before any lookup',async()=>{
 let calls=0;const offline=async()=>{calls++;throw Error();};
 for(const patch of [{id:'bad'},{version:'-1'},{version:'0'},{version:'1.5'},{version:'abc'},{version:(2n**256n).toString()},{file:null},{deployment:null}]){
 await assert.rejects(verifyAgreementFile({...input,...patch,rpc:offline}),e=>['input','file'].includes(e.code));
 }assert.equal(calls,0);
});
test('missing or inconsistent record and wrong chain never become mismatch or permit approval',async()=>{
 for(const [value,chain,code]of [[record('0'.repeat(64)),'0x2648','not-found'],['0xbad','0x2648','response'],[record(hash,4),'0x2648','response'],[record(hash,1,1),'0x2648','response'],[record(),'0x1','network']]){
 await assert.rejects(verifyAgreementFile({...input,rpc:rpc(value,chain)}),e=>e.code===code&&!e.message.includes('does not match'));
 }
});
test('unreadable and stalled local file errors are distinct from a genuine hash mismatch',async()=>{
 for(const arrayBuffer of [async()=>{throw Error('private-name');},async()=>new Promise(()=>{})]){
 await assert.rejects(verifyAgreementFile({...input,file:{arrayBuffer},fileTimeoutMs:10,rpc:rpc()}),e=>e.code==='file'&&!e.message.includes('private-name'));
 }
 const match=await verifyAgreementFile({...input,rpc:rpc()});assert.equal(match.matches,true);assert.equal(match.canApprove,false);
 const mismatch=await verifyAgreementFile({...input,rpc:rpc(record('b'.repeat(64)))});assert.equal(mismatch.matches,false);assert.equal(mismatch.canApprove,false);
 const withdrawn=await verifyAgreementFile({...input,deployment:WITHDRAWAL_DEPLOYMENT,rpc:rpc(record(hash,1,0,1))});assert.equal(withdrawn.withdrawn,true);assert.equal(withdrawn.canApprove,false);
});
test('RPC transport bounds header/body waits, rejects oversized/invalid replies and hides raw errors',async()=>{
 for(const fetcher of [async()=>{throw Error('private-upstream');},async()=>new Promise(()=>{}),async()=>new Response(new ReadableStream({start(){}})),async()=>new Response('x'.repeat(65537)),async()=>Response.json({error:{message:'private-upstream'}}),async()=>new Response('bad')]){
 const read=createVerificationRpc({fetcher,timeoutMs:10});
 await assert.rejects(read('eth_chainId',[]),e=>['network','response'].includes(e.code)&&!verificationErrorMessage(e).includes('private-upstream'));
 }
 assert.equal(verificationErrorMessage(Error('private-upstream')).includes('private-upstream'),false);
});
