import { loadAccount, main as windowCommand, defaultSecret } from './scoped-window-cli.mjs';
import { WINDOW_CONTRACT, verifyWindowReadback } from '../web/scoped-window-data.js';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, encodeFunctionData, parseAbi, decodeEventLog, keccak256, encodeAbiParameters } from 'viem';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const REST = 'https://api-testnet.qore.host';
const EVM = 'https://evm-testnet.qore.host';
const FIRST = '0xe84a1b8c20b1e33fc1d6dd4650af53783f2911ed';
export const TEST_TEXT = 'The Record disposable scoped-window admission test. No private agreement content.\n';
const fingerprint = '0x' + createHash('sha256').update(TEST_TEXT).digest('hex');
const abi = parseAbi(['function create(bytes32 salt,address first,address second,bytes32 fingerprint) returns (bytes32)', 'event Proposed(bytes32 indexed id,uint256 indexed version,bytes32 fingerprint)']);
export function callPlan(address, salt) {
  if (address.toLowerCase() === FIRST || address.toLowerCase() === WINDOW_CONTRACT) throw new Error('Unexpected disposable address.');
  const id = keccak256(encodeAbiParameters([{type:'address'},{type:'address'},{type:'address'},{type:'bytes32'}], [address,FIRST,address,salt]));
  return { id, salt, fingerprint, text: TEST_TEXT, to: WINDOW_CONTRACT,
    data: encodeFunctionData({abi,functionName:'create',args:[salt,FIRST,address,fingerprint]}),
    outsideTarget: address, value: '0', gas: '300000', maxFeePerTransactionWei: '100000000000000000' };
}
export function verifyProposal(receipt, plan) {
  if (receipt.status !== 'success' || receipt.to?.toLowerCase() !== WINDOW_CONTRACT) throw new Error('Permitted transaction did not succeed at The Record.');
  const found = receipt.logs.filter(l => l.address.toLowerCase() === WINDOW_CONTRACT).some(l => {
    try { const e = decodeEventLog({abi,data:l.data,topics:l.topics}); return e.eventName === 'Proposed' && e.args.id === plan.id && e.args.version === 1n && e.args.fingerprint === plan.fingerprint; } catch { return false; }
  });
  if (!found) throw new Error('Expected Proposed event missing.');
}
async function readWindow(address) {
  const r = await fetch(REST + '/qorechain/pqc/v1/evm_window/' + address, {signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error('Window read failed HTTP ' + r.status);
  return r.json();
}
const pause = () => new Promise(r => setTimeout(r,2000));
export async function main(args=process.argv.slice(2)) {
  const command=args[0];
  if (!['plan','run'].includes(command)) throw new Error('Use plan or run --broadcast --confirm-address DISPOSABLE_ADDRESS.');
  const account=await loadAccount();
  const directory=dirname(defaultSecret);
  const proofPath=join(directory,'scoped-proof.json');
  const journalPath=join(directory,'scoped-proof-started.json');
  if (command==='plan') return {nativeAddress:account.cosmos,evmAddress:account.evm,onlyAllowedContract:WINDOW_CONTRACT,blocks:600,maxTransactions:5,windowAllowanceQor:'1',permittedAction:'Create one new public test record; no existing agreement changes and no approval.',outsideAction:'Attempt a zero-value transfer to this same disposable account, outside the target list.',testText:TEST_TEXT,maximumEvmFeePerAttemptQor:'0.1',openingFeeQor:'0.08',evidenceFile:proofPath,transactionSent:false};
  const at=args.indexOf('--confirm-address');
  if (!args.includes('--broadcast') || at<0 || args[at+1]?.toLowerCase()!==account.evm.toLowerCase()) throw new Error('No transaction sent. Explicit broadcast and disposable address confirmation required.');
  if (existsSync(journalPath) || existsSync(proofPath)) throw new Error('A proof run already exists. Do not delete or repeat; inspect its public evidence first.');
  if (existsSync(join(directory,'pending-transaction.json'))) throw new Error('Resolve the pending native transaction with status first.');
  const client=createPublicClient({transport:http(EVM,{retryCount:0,timeout:15000})});
  if (await client.getChainId()!==9800) throw new Error('Wrong EVM network.');
  const status=await windowCommand(['status']);
  if (!status.pqcRegistered || !status.possessionProven || !status.pqcKeyMatches || BigInt(status.balanceUqor)<1000000n) throw new Error('Registered matching proven key and at least 1 test QOR required.');
  const wallet=privateKeyToAccount(account.privateKey);
  if (wallet.address.toLowerCase()!==account.evm.toLowerCase()) throw new Error('Signing address mismatch.');
  const plan=callPlan(account.evm,'0x'+randomBytes(32).toString('hex'));
  const evidence={kind:'the-record-scoped-proof/v1',createdAt:new Date().toISOString(),nativeAddress:account.cosmos,evmAddress:account.evm,plan,complete:false};
  const save=()=>writeFileSync(proofPath,JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
  writeFileSync(journalPath,JSON.stringify({createdAt:evidence.createdAt,nativeAddress:account.cosmos})+'\n',{flag:'wx',mode:0o600});
  save();
  try {
    evidence.openingBroadcast=await windowCommand(['open','--broadcast','--confirm-address',account.evm]); save();
    let committed;
    for(let attempt=0;attempt<30;attempt++) { const s=await windowCommand(['status']); if(s.pending?.committed) {committed=s.pending;break;} await pause(); }
    if (!committed || committed.code!==0 || !committed.windowLive) throw new Error('Opening not confirmed live. Stop; inspect status and evidence, do not rerun.');
    evidence.opening=committed; save();
    const live=async()=>{const w=await readWindow(account.cosmos);if(!verifyWindowReadback(w,committed.opening))throw new Error('Expected scoped window is not live.');return w;};
    evidence.beforePermitted=await live(); save();
    const sign=async(to,data,gas)=>{
      const [nonce,gasPrice]=await Promise.all([client.getTransactionCount({address:account.evm,blockTag:'pending'}),client.getGasPrice()]);
      if(gasPrice<=0n || gasPrice*gas>100000000000000000n)throw new Error('Gas fee exceeds reviewed 0.1 test QOR cap.');
      return wallet.signTransaction({chainId:9800,type:'legacy',nonce,to,data,value:0n,gas,gasPrice});
    };
    // Journal hashes BEFORE broadcast. Never print private keys, signed raw bytes, or auto-retry a send.
    const raw=await sign(WINDOW_CONTRACT,plan.data,300000n);
    const allowedHash=keccak256(raw);
    evidence.permitted={hash:allowedHash,submitted:false};save();
    const returned=await client.request({method:'eth_sendRawTransaction',params:[raw]});
    evidence.permitted.submitted=true; save();
    if(returned.toLowerCase()!==allowedHash)throw new Error('Unexpected permitted transaction hash.');
    const receipt=await client.waitForTransactionReceipt({hash:allowedHash,timeout:60000,retryCount:0});
    verifyProposal(receipt,plan);
    evidence.permitted={hash:allowedHash,status:receipt.status,block:receipt.blockNumber.toString(),agreementId:plan.id,fingerprint:plan.fingerprint,proposedEventVerified:true}; save();
    evidence.beforeOutside=await live();save();
    const outsideRaw=await sign(account.evm,'0x',21000n);
    evidence.outside={hash:keccak256(outsideRaw),target:account.evm,submitted:false};save();
    const response=await fetch(EVM,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_sendRawTransaction',params:[outsideRaw]}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Outside broadcast outcome unknown: HTTP '+response.status);
    const result=await response.json();
    if(result.result){evidence.outside.acceptedHash=result.result;save();throw new Error('Outside-target transaction was ACCEPTED. Scope test did not pass.');}
    if(!result.error || typeof result.error.message!=='string')throw new Error('Outside broadcast outcome unconfirmed.');
    evidence.outside.rpcError={code:result.error.code,message:result.error.message.slice(0,6000)};
    evidence.afterOutside=await live();
    evidence.outside.rejected=true;
    // Keep classification conservative: unrelated nonce/gas/fee failures are not scope proof.
    evidence.outside.targetRestrictionConfirmed=/(target|recipient|destination)/i.test(result.error.message) && /(not allowed|not permitted|outside|restrict|scope|allowlist|allow.list|unauthori[sz]ed)/i.test(result.error.message);
    evidence.complete=evidence.outside.targetRestrictionConfirmed;
    save();
    return {...evidence,evidenceFile:proofPath,instruction:evidence.complete?'Retain this evidence. Window expires automatically; no approvals were performed.':'Rejection saved but target scope needs manual diagnosis. Do not repeat.'};
  } catch(error) {
    evidence.stopped=true;evidence.stopReason='Run stopped; inspect printed error and the public evidence before any further send.';save();
    // Avoid third-party error objects that might embed raw signing inputs.
    if(error?.name==='Error') throw new Error(error.message+' Evidence: '+proofPath);
    throw new Error('Run stopped during RPC/signing. Outcome may be unknown; retain evidence at '+proofPath+' and do not repeat.');
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
