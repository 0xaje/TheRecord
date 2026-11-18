import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import { callPlan, verifyProposal, TEST_TEXT, isTargetRestriction, reviewSavedProof } from '../scripts/scoped-window-proof.mjs';
const address='0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f';
const target='0x25721b3be0f24438da7daed4c800b073ef9bb802';
test('paired proof fixes zero-value scope targets and requires the exact successful proposal event',()=>{
 const p=callPlan(address,'0x'+'12'.repeat(32));
 assert.equal(p.to,target);assert.equal(p.outsideTarget,address);assert.equal(p.value,'0');assert.equal(p.text,TEST_TEXT);
 const log={address:target,topics:encodeEventTopics({abi:[parseAbiItem('event Proposed(bytes32 indexed id,uint256 indexed version,bytes32 fingerprint)')],eventName:'Proposed',args:{id:p.id,version:1n}}),data:encodeAbiParameters([{type:'bytes32'}],[p.fingerprint])};
 const receipt={status:'success',to:target,logs:[log]};
 assert.doesNotThrow(()=>verifyProposal(receipt,p));
 assert.throws(()=>verifyProposal({...receipt,status:'reverted'},p));
 assert.throws(()=>verifyProposal({...receipt,to:address},p));
 assert.throws(()=>verifyProposal({...receipt,logs:[]},p));
 assert.throws(()=>verifyProposal(receipt,{...p,id:'0x'+'34'.repeat(32)}));
 assert.throws(()=>verifyProposal(receipt,{...p,fingerprint:'0x'+'56'.repeat(32)}));
 assert.throws(()=>callPlan(target,p.salt));
});

test('Diana allowed-recipient rejection is recognized without accepting unrelated failures',()=>{
 const message='failed to broadcast transaction: the window does not list '+address+' as an allowed recipient: EVM authorisation window exhausted';
 assert.equal(isTargetRestriction(message,address),true);
 assert.equal(isTargetRestriction(message.toLowerCase(),address),true);
 assert.equal(isTargetRestriction('EVM authorisation window exhausted',address),false);
 assert.equal(isTargetRestriction('nonce too low',address),false);
 assert.equal(isTargetRestriction(message,target),false);
});

test('read-only review requires live matching snapshots and retains original evidence',()=>{
 const opening={height:'10325763'};
 const window={found:true,live:true,opened_height:opening.height,expiry_height:'10326363',max_txs:'5',max_value:'1000000',native_only:false,allowed_targets:[target],remaining_blocks:'595',remaining_txs:'4',remaining_value:'966250',used_txs:'1',used_value:'33750'};
 const evidence={evmAddress:address,plan:{to:target},opening:{code:0,opening},permitted:{status:'success',proposedEventVerified:true},beforeOutside:window,afterOutside:{...window},outside:{target:address,rejected:true,rpcError:{message:'the window does not list '+address+' as an allowed recipient'}},complete:false};
 const reviewed=reviewSavedProof(evidence);
 assert.equal(reviewed.complete,true);assert.equal(evidence.complete,false);
 assert.throws(()=>reviewSavedProof({...evidence,afterOutside:{...window,live:false}}));
 assert.throws(()=>reviewSavedProof({...evidence,afterOutside:{...window,used_txs:'2'}}));
 assert.throws(()=>reviewSavedProof({...evidence,outside:{...evidence.outside,acceptedHash:'0x123'}}));
});

test('V2 scope stays bound to its verified deployment and rejects legacy receipts', async()=>{
 const {proofDeployment, deploymentArgument, proofNames}=await import('../scripts/scoped-window-target.mjs');
 const {verifyWindowReadback, verifyWindowReceipt}=await import('../web/scoped-window-data.js');
 const v2=proofDeployment('withdrawal-v2').address;
 assert.equal(deploymentArgument(['plan','--deployment','withdrawal-v2']).address,v2);
 assert.throws(()=>deploymentArgument(['plan','--deployment','unknown']));
 assert.throws(()=>deploymentArgument(['plan','--deployment']));
 assert.throws(()=>deploymentArgument(['plan','--deployment','legacy','--deployment','withdrawal-v2']));
 for(const key of ['proof','journal','reviewed']) assert.notEqual(proofNames()[key],proofNames('withdrawal-v2')[key]);
 const p=callPlan(address,'0x'+'12'.repeat(32),'withdrawal-v2');
 const log={address:v2,topics:encodeEventTopics({abi:[parseAbiItem('event Proposed(bytes32 indexed id,uint256 indexed version,bytes32 fingerprint)')],eventName:'Proposed',args:{id:p.id,version:1n}}),data:encodeAbiParameters([{type:'bytes32'}],[p.fingerprint])};
 assert.doesNotThrow(()=>verifyProposal({status:'success',to:v2,logs:[log]},p));
 assert.throws(()=>verifyProposal({status:'success',to:target,logs:[{...log,address:target}]},p));
 assert.throws(()=>verifyProposal({status:'success',to:v2,logs:[log]},{...p,to:target}));
 const opening={height:'100',allowedTargets:[v2]};
 const window={found:true,live:true,opened_height:'100',expiry_height:'700',max_txs:'5',max_value:'1000000',native_only:false,allowed_targets:[v2],remaining_blocks:'599',remaining_txs:'4',remaining_value:'900000',used_txs:'1',used_value:'100000'};
 assert.equal(verifyWindowReadback(window,opening,v2),true);
 assert.throws(()=>verifyWindowReadback(window,opening));
 const receipt={tx_response:{txhash:'ABC',code:0,height:'100'},tx:{body:{messages:[{'@type':'/qorechain.pqc.v1.MsgOpenEVMWindow',sender:'native',blocks:'600',max_txs:'5',max_value:'1000000',native_only:false,allowed_targets:[v2]}],extension_options:[{'@type':'/qorechain.pqc.v1.PQCHybridSignature'}]}}};
 assert.equal(verifyWindowReceipt(receipt,'native','ABC',v2).allowedTargets[0],v2);
 assert.throws(()=>verifyWindowReceipt(receipt,'native','ABC'));
 const evidence={deployment:'withdrawal-v2',evmAddress:address,plan:p,opening:{code:0,opening},permitted:{status:'success',proposedEventVerified:true},beforeOutside:window,afterOutside:{...window},outside:{target:address,rejected:true,rpcError:{message:'the window does not list '+address+' as an allowed recipient'}}};
 assert.equal(reviewSavedProof(evidence).complete,true);
 assert.throws(()=>reviewSavedProof({...evidence,deployment:'legacy'}));
});

test('V2 offline plan preserves old evidence and never calls the network',async()=>{
 const {mkdtempSync,writeFileSync,readFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os'); const {join}=await import('node:path');
 const {initAccount}=await import('../scripts/scoped-window-cli.mjs');
 const {main}=await import('../scripts/scoped-window-proof.mjs');
 const folder=mkdtempSync(join(tmpdir(),'record-v2-plan-')); const file=join(folder,'account.secret');
 const originalFetch=globalThis.fetch;
 try {
  initAccount(file); writeFileSync(join(folder,'scoped-proof.json'),'existing legacy evidence');
  globalThis.fetch=()=>{throw new Error('Offline plan unexpectedly accessed network');};
  const plan=await main(['plan','--deployment','withdrawal-v2'],file);
  assert.equal(plan.transactionSent,false);
  assert.equal(plan.onlyAllowedContract,'0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f');
  assert.equal(plan.evidenceFile,join(folder,'scoped-proof-withdrawal-v2.json'));
  assert.equal(readFileSync(join(folder,'scoped-proof.json'),'utf8'),'existing legacy evidence');
  await assert.rejects(main(['run','--deployment','withdrawal-v2'],file),/No transaction sent/);
 } finally {globalThis.fetch=originalFetch;rmSync(folder,{recursive:true,force:true});}
});
