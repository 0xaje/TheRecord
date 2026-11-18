// Owner-operated, disposable Diana account only. plan/status never broadcast.
import {loadAccount,defaultSecret} from './scoped-window-cli.mjs';
import {EthNativeSigner,openEvmWindowMsg} from '@qorechain/sdk';
import {createPublicClient,http,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const REST='https://api-testnet.qore.host',RPC='https://evm-testnet.qore.host';
const fetchTimed=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(15000)});
const json=async path=>{const r=await fetchTimed(REST+path);if(!r.ok)throw Error('Diana read HTTP '+r.status);return r.json();};
const pause=()=>new Promise(r=>setTimeout(r,2000));
export async function main(args=process.argv.slice(2),filename=defaultSecret) {
 const file=join(dirname(filename),'withdrawal-deployment.json');
 const command=args[0];if(!['plan','run','status'].includes(command))throw Error('Use plan, status or run --broadcast --confirm-address DISPOSABLE_ADDRESS.');
 const artifact=JSON.parse(readFileSync(new URL('../deploy/withdrawal-v2-artifact.json',import.meta.url),'utf8'));
 const source=readFileSync(new URL('../contracts/TheRecordV2.sol',import.meta.url));
 if(createHash('sha256').update(source).digest('hex')!==artifact.sourceSha256)throw Error('Contract source differs from artifact. Rebuild before deployment.');
 const account=await loadAccount(filename);
 const client=createPublicClient({transport:http(RPC,{retryCount:0,timeout:15000})});
 const plan={nativeAddress:account.cosmos,evmAddress:account.evm,contract:artifact.contract,sourceSha256:artifact.sourceSha256,creationCodeHash:keccak256(artifact.bytecode),
  action:'Deploy a NEW contract. Existing agreement contract/records stay unchanged.',
  window:{blocks:60,maxTransactions:1,allowanceQor:'1',allowedTargets:[],reason:'Contract creation cannot use a target address before deployment. One transaction only; replaces previous window.'},
  openingFeeQor:'0.08',maximumDeploymentFeeQor:'1',evidenceFile:file,transactionSent:false};
 if(command==='plan')return plan;
 if(await client.getChainId()!==9800||(await json('/cosmos/base/tendermint/v1beta1/node_info')).default_node_info?.network!=='qorechain-diana')throw Error('Wrong network.');
 if(command==='status') {
  if(!existsSync(file))return {...plan,status:'No deployment journal yet.'};
  const evidence=JSON.parse(readFileSync(file,'utf8'));
  if(evidence.sourceSha256!==artifact.sourceSha256)throw Error('Journal source differs from current artifact. Retain original artifacts for review.');
  if(evidence.evmAddress!==account.evm)throw Error('Journal account mismatch.');
  if(evidence.nativeHash){try{evidence.nativeReceipt=(await json('/cosmos/tx/v1beta1/txs/'+evidence.nativeHash)).tx_response;}catch{evidence.nativeReceipt='Not confirmed; keep hash and do not repeat.';}}
  if(evidence.evmHash){const receipt=await client.getTransactionReceipt({hash:evidence.evmHash}).catch(()=>null);if(receipt){evidence.deployment={status:receipt.status,address:receipt.contractAddress,block:String(receipt.blockNumber)};if(receipt.status==='success'&&receipt.contractAddress)evidence.runtimeMatches=(await client.getCode({address:receipt.contractAddress}))?.toLowerCase()===artifact.runtime.toLowerCase();}}
  return {...evidence,transactionSent:false};
 }
 const index=args.indexOf('--confirm-address');
 if(!args.includes('--broadcast')||index<0||args[index+1]?.toLowerCase()!==account.evm.toLowerCase())throw Error('Review plan first. Explicit broadcast and matching disposable address required.');
 if(existsSync(file)||existsSync(join(dirname(filename),'pending-transaction.json')))throw Error('Prior journal/pending transaction exists. Run status; do not repeat.');
 // Require actual registered-key matching through the existing checked CLI.
 const {main:windowStatus}=await import('./scoped-window-cli.mjs');
 const status=await windowStatus(['status'],filename);
 if(!status.pqcRegistered||!status.possessionProven||!status.pqcKeyMatches||BigInt(status.balanceUqor)<2000000n)throw Error('Matching proven key and at least 2 disposable test QOR required.');
 const raw=await json('/cosmos/auth/v1beta1/accounts/'+account.cosmos);const base=raw.account?.base_account??raw.account;
 if(base.address!==account.cosmos)throw Error('Account mismatch.');
 const evidence={...plan,transactionSent:true,complete:false};
 const save=()=>writeFileSync(file,JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
 // No signed raw bytes or secrets are stored/printed.
 writeFileSync(file,JSON.stringify(evidence)+'\n',{flag:'wx',mode:0o600});
 try {
  const signer=new EthNativeSigner(account,{signMode:'hybrid',rest:REST,fetch:fetchTimed});
  const signed=signer.sign({chainId:'qorechain-diana',accountNumber:BigInt(base.account_number),sequence:BigInt(base.sequence),
   messages:[openEvmWindowMsg({sender:account.cosmos,blocks:60,maxTxs:1,maxValue:'1000000',allowedTargets:[]})],fee:{amount:[{denom:'uqor',amount:'80000'}],gas:'400000'},memo:'The Record V2 disposable deployment',signBytesVersion:await signer.resolveSignBytesVersion('qorechain-diana')});
  evidence.nativeHash=createHash('sha256').update(signed.txRawBytes).digest('hex').toUpperCase();save();
  const response=await fetchTimed(REST+'/cosmos/tx/v1beta1/txs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tx_bytes:Buffer.from(signed.txRawBytes).toString('base64'),mode:'BROADCAST_MODE_SYNC'})});
  if(!response.ok)throw Error('Opening outcome unknown; use status.');
  const accepted=(await response.json()).tx_response;
  if(Number(accepted?.code)!==0||accepted.txhash?.toUpperCase()!==evidence.nativeHash)throw Error('Opening not accepted. Retain journal and inspect status.');
  let committed;
  for(let i=0;i<20;i++){try{const data=await json('/cosmos/tx/v1beta1/txs/'+evidence.nativeHash);if(BigInt(data.tx_response?.height??0)>0n){committed=data;break;}}catch{}await pause();}
  const m=committed?.tx?.body?.messages?.[0];
  if(Number(committed?.tx_response?.code)!==0||m?.sender!==account.cosmos||m?.['@type']!=='/qorechain.pqc.v1.MsgOpenEVMWindow'||String(m.max_txs)!=='1'||String(m.blocks)!=='60'||String(m.max_value)!=='1000000'||m.allowed_targets?.length||!committed.tx.body.extension_options?.some(e=>e['@type']==='/qorechain.pqc.v1.PQCHybridSignature'))throw Error('One-transaction opening not verified. Stop and use status.');
  evidence.opening={hash:evidence.nativeHash,block:committed.tx_response.height,committed:true};save();
  const current=await json('/qorechain/pqc/v1/evm_window/'+account.cosmos);
  if(!current.live||String(current.opened_height)!==String(committed.tx_response.height)||String(current.remaining_txs)!=='1'||current.allowed_targets?.length)throw Error('Deployment window is not live or was replaced.');
  const wallet=privateKeyToAccount(account.privateKey);if(wallet.address.toLowerCase()!==account.evm.toLowerCase())throw Error('Signing address mismatch.');
  const [nonce,gasPrice]=await Promise.all([client.getTransactionCount({address:account.evm,blockTag:'pending'}),client.getGasPrice()]);
  const gas=3000000n;if(gasPrice<=0n||gasPrice*gas>1000000000000000000n)throw Error('Deployment fee exceeds reviewed 1 QOR cap.');
  const transaction=await wallet.signTransaction({chainId:9800,type:'legacy',nonce,data:artifact.bytecode,value:0n,gas,gasPrice});
  evidence.evmHash=keccak256(transaction);save();
  const sent=await client.request({method:'eth_sendRawTransaction',params:[transaction]});
  if(sent.toLowerCase()!==evidence.evmHash)throw Error('Deployment acceptance hash mismatch.');
  const receipt=await client.waitForTransactionReceipt({hash:evidence.evmHash,timeout:60000,retryCount:0});
  evidence.deployment={status:receipt.status,address:receipt.contractAddress,block:String(receipt.blockNumber)};save();
  if(receipt.status!=='success'||!receipt.contractAddress)throw Error('Deployment did not succeed.');
  evidence.runtimeMatches=(await client.getCode({address:receipt.contractAddress}))?.toLowerCase()===artifact.runtime.toLowerCase();
  evidence.afterWindow=await json('/qorechain/pqc/v1/evm_window/'+account.cosmos);
  evidence.complete=evidence.runtimeMatches;save();
  if(!evidence.complete)throw Error('Deployed runtime differs from compiled source. Do not activate.');
  return {...evidence,instruction:'Share only this public output. Website activation and real withdrawal/two-signer correction proof are still pending.'};
 } catch {evidence.stopped=true;save();throw Error('Deployment stopped; outcome may be unknown. Run status and retain '+file+'. Do not rerun or delete the journal.');}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(v=>console.log(JSON.stringify(v,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
