import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveDeployment,agreementQuery,LEGACY_DEPLOYMENT,versionPresentation} from '../web/deployments.js';
import {readHistoryVersions} from '../web/history-data.js';
const id='0x'+'11'.repeat(32),fp=n=>'0x'+String(n).repeat(64),hash='0x'+'aa'.repeat(32),first='0x'+'12'.repeat(20);
const v2={id:'test-fixture',address:'0x'+'34'.repeat(20),fromBlock:1n,withdrawals:true};
// Explicit isolated reader fixtures, not actual Diana receipts or wallet proof.
function event(eventName,version,args={},index=0){return {eventName,args:{id,version:BigInt(version),...args},blockNumber:BigInt(version*10),logIndex:index,transactionHash:hash};}
const events=[event('Proposed',1,{fingerprint:fp(1)}),event('Approved',1,{signer:first},1),event('Approved',1,{signer:'0x'+'56'.repeat(20)},2),event('Finalized',1,{fingerprint:fp(1)},3),event('Proposed',2,{fingerprint:fp(2)}),event('Approved',2,{signer:first},1),event('Withdrawn',2,{proposer:first},2),event('Proposed',3,{fingerprint:fp(3)})];
function reader(){return {async readContract({functionName,args,blockNumber,address}){assert.equal(blockNumber,40n);assert.equal(address,v2.address);const n=Number(args[1]);if(n===4)return [fp(0),0,false];assert.equal(functionName,'getVersionState');return n===1?[fp(1),3,true,false]:n===2?[fp(2),1,false,true]:[fp(3),0,false,false];}};}
test('legacy links stay pinned and unknown deployments never fall back',()=>{
 assert.equal(resolveDeployment(''),LEGACY_DEPLOYMENT);assert.equal(resolveDeployment('?id='+id),LEGACY_DEPLOYMENT);
 assert.throws(()=>resolveDeployment('?deployment=unverified'),/Unknown/);
 assert.equal(agreementQuery(LEGACY_DEPLOYMENT,id,1).has('deployment'),false);
 assert.equal(agreementQuery(v2,id,3).get('deployment'),'test-fixture');
 assert.equal(resolveDeployment('?deployment=test-fixture',[LEGACY_DEPLOYMENT,v2]),v2);
});
test('matching withdrawn file is never approvable or finalized',()=>{
 const shown=versionPresentation({matches:true,approvals:1,finalized:false,withdrawn:true});assert.equal(shown.canApprove,false);assert.match(shown.status,/Withdrawn/);assert.match(shown.message,/cannot be approved/);
 assert.throws(()=>versionPresentation({matches:true,approvals:3,finalized:true,withdrawn:true}),/Inconsistent/);
 assert.equal(versionPresentation({matches:true,approvals:0,finalized:false}).canApprove,true);
});
test('history retains original, withdrawal receipt and fresh zero-approval correction',async()=>{
 const versions=await readHistoryVersions(reader(),id,events,40n,v2);
 assert.deepEqual(versions.map(v=>[Number(v.version),v.finalized,v.withdrawn,v.approvals.length]),[[3,false,false,0],[2,false,true,1],[1,true,false,2]]);
 assert.equal(versions[1].withdrawal.transactionHash,hash);
});
test('history rejects missing withdrawal evidence and post-withdrawal approvals',async()=>{
 await assert.rejects(()=>readHistoryVersions(reader(),id,events.filter(e=>e.eventName!=='Withdrawn'),40n,v2),/Withdrawal/);
 const reordered=events.map(e=>e.eventName==='Approved'&&e.args.version===2n?{...e,logIndex:3}:e);
 await assert.rejects(()=>readHistoryVersions(reader(),id,reordered,40n,v2),/after withdrawal/);
});
test('deployment artifact is source-bound and preserves the legacy source',()=>{
 const artifact=JSON.parse(readFileSync(new URL('../deploy/withdrawal-v2-artifact.json',import.meta.url)));
 assert.equal(artifact.contract,'TheRecordV2');assert.ok(artifact.abi.some(e=>e.type==='function'&&e.name==='withdraw'));
 const legacy=readFileSync(new URL('../contracts/TheRecord.sol',import.meta.url),'utf8');assert.equal(legacy.includes('function withdraw('),false);
 assert.equal(LEGACY_DEPLOYMENT.withdrawals,false);
});

test('owner deployment plan is offline, one creation transaction, and never changes legacy routing',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {initAccount}=await import('../scripts/scoped-window-cli.mjs');const {main}=await import('../scripts/withdrawal-deploy.mjs');
 const directory=mkdtempSync(join(tmpdir(),'record-v2-plan-'));const secret=join(directory,'account.secret');
 try {initAccount(secret);const plan=await main(['plan'],secret);assert.equal(plan.transactionSent,false);assert.equal(plan.window.maxTransactions,1);assert.deepEqual(plan.window.allowedTargets,[]);assert.equal(plan.maximumDeploymentFeeQor,'1');assert.equal(plan.contract,'TheRecordV2');assert.equal(JSON.stringify(plan).includes('mnemonic'),false);assert.equal(LEGACY_DEPLOYMENT.withdrawals,false);}finally{rmSync(directory,{recursive:true,force:true});}
});
