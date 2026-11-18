// Real historical Diana eth_call checks. No wallets, keys or broadcasts.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {BaseError,ContractFunctionRevertedError,createPublicClient,decodeFunctionData,http,parseAbi} from 'viem';
const client=createPublicClient({transport:http(process.env.DIANA_RPC_URL??'https://evm-testnet.qore.host',{timeout:20000,retryCount:0})});
const address='0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f';
const id='0x2152af51be0fa909eb937df619ee19e62f7ad49f4e8ea84f92a7273d9977cd7b';
const abi=parseAbi(['function approve(bytes32,uint256,address,bytes)','function withdraw(bytes32,uint256,bytes)','function getVersionState(bytes32,uint256) view returns(bytes32,uint8,bool,bool)','error InvalidApproval()','error InvalidVersion()','error InvalidAgreement()']);
assert.equal(await client.getChainId(),9800);
const hashes={oldApproval:'0xc9ba6c589f633389b2beed378833726b5b432eb7ec5d8be0a7448aaa6225a581',withdrawal:'0x7b41df12ed1e2dee4ddc680b13cc35cbece6c48d3af7102074838b3f2f2b465e',freshApproval:'0x372faa2a576cfd57dc06d272139254b5e8d52e50e2e942ff3e1db7013b383d7d',finalization:'0xab11d9e3409fd974af93039a7d30abee1f409027c183cdbb1e61ad8c32086960'};
const transactions={};for(const [name,hash] of Object.entries(hashes)){
 const [tx,r]=await Promise.all([client.getTransaction({hash}),client.getTransactionReceipt({hash})]);
 assert.equal(tx.to.toLowerCase(),address);assert.equal(r.status,'success');
 transactions[name]={tx,receipt:r,decoded:decodeFunctionData({abi,data:tx.input})};
}
const old=transactions.oldApproval,withdrawal=transactions.withdrawal,fresh=transactions.freshApproval,final=transactions.finalization;
for(const t of [old,fresh,withdrawal])assert.equal(t.decoded.args[0],id);
assert.equal(old.decoded.functionName,'approve');assert.equal(fresh.decoded.functionName,'approve');assert.equal(withdrawal.decoded.functionName,'withdraw');
assert.equal(old.decoded.args[1],2n);assert.equal(withdrawal.decoded.args[1],2n);assert.equal(fresh.decoded.args[1],3n);
const at=async version=>client.readContract({address,abi,functionName:'getVersionState',args:[id,version],blockNumber:fresh.receipt.blockNumber-1n});
const beforeStates=await Promise.all([1n,2n,3n].map(at));
assert.equal(beforeStates[0][2],true);assert.equal(beforeStates[1][3],true);assert.equal(beforeStates[2][1],0);assert.equal(beforeStates[1][0],beforeStates[2][0]);
const checks=[];
async function check(label,functionName,args,account,blockNumber,errorName){
 const call=()=>client.simulateContract({address,abi,functionName,args,account,blockNumber});
 if(errorName)await assert.rejects(call,error=>error instanceof BaseError&&error.walk(cause=>cause instanceof ContractFunctionRevertedError)?.data?.errorName===errorName);
 else await call();
 checks.push({label,block:String(blockNumber),expected:errorName??'accepted',result:'PASS'});console.log('PASS:',label,String(blockNumber));
}
const beforeOld=old.receipt.blockNumber-1n,beforeWithdraw=withdrawal.receipt.blockNumber-1n,beforeFresh=fresh.receipt.blockNumber-1n;
// Positive controls at the same historical state are essential: RPC/key failures are not successful security checks.
await check('valid original version2 approval','approve',old.decoded.args,old.tx.from,beforeOld);
await check('valid withdrawal with proposer PQ signature','withdraw',withdrawal.decoded.args,withdrawal.tx.from,beforeWithdraw);
await check('valid fresh version3 approval','approve',fresh.decoded.args,fresh.tx.from,beforeFresh);
const other='0xebfd0c31bc2ac2529c5c51ae7bc2c3337f79b44a';
const oldReused=[...old.decoded.args];oldReused[1]=3n;
const withdrawalAsApproval=[...old.decoded.args];withdrawalAsApproval[3]=withdrawal.decoded.args[2];
const approvalAsWithdrawal=[id,2n,old.decoded.args[3]];
const damaged=withdrawal.decoded.args[2];const altered=damaged.slice(0,2)+(damaged[2]==='0'?'1':'0')+damaged.slice(3);
await check('version2 signature rejected for version3 despite identical file hash','approve',oldReused,old.tx.from,beforeFresh,'InvalidApproval');
await check('approval signature cannot authorize withdrawal','withdraw',approvalAsWithdrawal,withdrawal.tx.from,beforeWithdraw,'InvalidApproval');
await check('withdrawal signature cannot authorize approval','approve',withdrawalAsApproval,old.tx.from,beforeOld,'InvalidApproval');
await check('altered full-length withdrawal signature rejected','withdraw',[id,2n,altered],withdrawal.tx.from,beforeWithdraw,'InvalidApproval');
await check('other designated signer cannot withdraw','withdraw',withdrawal.decoded.args,other,beforeWithdraw,'InvalidAgreement');
await check('second withdrawal rejected','withdraw',withdrawal.decoded.args,withdrawal.tx.from,withdrawal.receipt.blockNumber,'InvalidVersion');
await check('withdrawn latest version cannot receive approval','approve',old.decoded.args,old.tx.from,withdrawal.receipt.blockNumber,'InvalidVersion');
await check('delayed withdrawal cannot target superseded version2','withdraw',withdrawal.decoded.args,withdrawal.tx.from,beforeFresh,'InvalidVersion');
await check('duplicate fresh approval rejected','approve',fresh.decoded.args,fresh.tx.from,fresh.receipt.blockNumber,'InvalidApproval');
await check('finalized correction cannot be withdrawn','withdraw',[id,3n,withdrawal.decoded.args[2]],withdrawal.tx.from,final.receipt.blockNumber,'InvalidVersion');
await check('original finalized version cannot be withdrawn','withdraw',[id,1n,withdrawal.decoded.args[2]],withdrawal.tx.from,final.receipt.blockNumber,'InvalidVersion');
const artifact=JSON.parse(readFileSync('deploy/withdrawal-v2-artifact.json','utf8'));
const result={checkedAt:new Date().toISOString(),chainId:9800,address,agreementId:id,sourceSha256:artifact.sourceSha256,transactions:hashes,checks,passed:checks.length,scope:'Read-only historical calls against real deployed Diana contract and PQ precompiles using publicly recorded signatures. No new transactions, mocked precompiles, keys or signatures generated. Not an independent security certification.'};
writeFileSync('docs/withdrawal/security-regression.json',JSON.stringify(result,null,2)+'\n');
