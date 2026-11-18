import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import { callPlan, verifyProposal, TEST_TEXT } from '../scripts/scoped-window-proof.mjs';
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
