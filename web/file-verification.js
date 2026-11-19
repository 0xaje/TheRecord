import { encodeFunctionData, parseAbi } from "viem";
import { versionPresentation } from "./deployments.js";
const abi = parseAbi(["function getVersionState(bytes32,uint256) view returns (bytes32,uint8,bool,bool)"]);
export class VerificationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const failure = (code, message) => new VerificationError(code, message);
const networkMessage = "Diana could not be reached. No file comparison was completed. Check your connection and try again.";
const responseMessage = "Diana returned an unreadable or inconsistent record. This file has not been verified. Try again later.";
async function deadline(run, timeoutMs, error) {
  const controller = new AbortController(); let timer;
  try {
    return await Promise.race([run(controller.signal), new Promise((_,reject) => {
      timer = setTimeout(() => { controller.abort(); reject(error); },timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
export function createVerificationRpc({fetcher=(...args)=>fetch(...args),timeoutMs=15000}={}) {
  return async (method,params) => deadline(async signal => {
    let response;
    try {
      response = await fetcher("https://evm-testnet.qore.host", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}), signal,
      });
    } catch { throw failure("network",networkMessage); }
    if(!response.ok)throw failure("network",networkMessage);
    try {
      const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text="";
      const cancel=()=>{void reader.cancel().catch(()=>{});};
      signal.addEventListener("abort",cancel,{once:true});
      try {
        for(;;){const{done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>65536)throw Error();text+=decoder.decode(value,{stream:true});}
        const data=JSON.parse(text+decoder.decode());
        if(!data || data.error || data.result==null)throw Error();
        return data.result;
      } finally { signal.removeEventListener("abort",cancel);void reader.cancel().catch(()=>{}); }
    } catch { throw failure("response",responseMessage); }
  },timeoutMs,failure("network","Diana took too long to respond. No file comparison was completed. Try again later."));
}
export async function verifyAgreementFile({deployment,id,version,file,rpc=createVerificationRpc(),fileTimeoutMs=15000}) {
  if(!deployment)throw failure("input","Unknown agreement contract. Open a verified agreement link.");
  if(typeof id!=="string"||!/^0x[0-9a-fA-F]{64}$/.test(id))throw failure("input","Enter a valid agreement ID: 0x followed by 64 hexadecimal characters.");
  if(typeof version!=="string"||! /^[1-9][0-9]{0,77}$/.test(version))throw failure("input","Enter a whole version number greater than zero.");
  const number=BigInt(version);
  if(number>2n**256n-1n)throw failure("input","Enter a smaller version number.");
  if(!file||typeof file.arrayBuffer!=="function")throw failure("file","Choose the agreement file before verifying.");
  const chain=await rpc("eth_chainId",[]);
  if(typeof chain!=="string"||!/^0x[0-9a-f]+$/i.test(chain))throw failure("response",responseMessage);
  if(BigInt(chain)!==9800n)throw failure("network","The lookup returned a different network. Verification requires QoreChain Diana Testnet. This file has not been verified.");
  const data=deployment.withdrawals
    ?encodeFunctionData({abi,functionName:"getVersionState",args:[id,number]})
    :"0xaf904a06"+id.slice(2)+number.toString(16).padStart(64,"0");
  const record=await rpc("eth_call",[{to:deployment.address,data},"latest"]);
  if(typeof record!=="string"||!(deployment.withdrawals?/^0x[0-9a-f]{256}$/i:/^0x[0-9a-f]{192}$/i).test(record))throw failure("response",responseMessage);
  const fingerprint=record.slice(2,66).toLowerCase();
  if(fingerprint==="0".repeat(64))throw failure("not-found","Agreement version not found. Check the agreement ID, version and contract link.");
  const approvals=BigInt("0x"+record.slice(66,130)),finalized=BigInt("0x"+record.slice(130,194)),withdrawn=deployment.withdrawals?BigInt("0x"+record.slice(194,258)):0n;
  if(approvals>3n||finalized!==(approvals===3n?1n:0n)||withdrawn>1n||(withdrawn===1n&&finalized===1n))throw failure("response",responseMessage);
  let local;
  try {
    local=await deadline(async()=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await file.arrayBuffer())),b=>b.toString(16).padStart(2,"0")).join(""),fileTimeoutMs,failure("file","Reading this file took too long. Select it again before retrying."));
  } catch(error) {
    if(error instanceof VerificationError)throw error;
    throw failure("file","This file could not be read. Select a locally available copy and try again.");
  }
  const matches=local===fingerprint;
  return {id,version:number,fingerprint,matches,withdrawn:withdrawn===1n,...versionPresentation({matches,approvals:Number(approvals),finalized:finalized===1n,withdrawn:withdrawn===1n})};
}
export function verificationErrorMessage(error) {
  return error instanceof VerificationError?error.message:"Verification could not be completed. This file has not been verified. Try again later.";
}
