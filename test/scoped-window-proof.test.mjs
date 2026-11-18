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
