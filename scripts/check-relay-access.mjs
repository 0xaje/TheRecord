// Bounded public checks only. Never signs, submits a transaction, or creates an admission.
import {createHash,randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const origin='https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key=randomBytes(32).toString('hex'),authorization='Bearer relay:'+key;
const route='/api/diana/cosmos/base/tendermint/v1beta1/node_info';
const results=[];
async function check(name,path,options,expected){
 const response=await fetch(origin+path,{...options,signal:AbortSignal.timeout(20000)});
 const text=await response.text();
 const pass=Array.isArray(expected)?expected.includes(response.status):response.status===expected;
 results.push({name,status:response.status,expected,pass});
 if(!pass)throw Error(name+' failed: HTTP '+response.status);
 return {response,text};
}
await check('unverified read refused',route,{},401);
await check('spoofed forwarding identity refused by app or hosting edge',route,{headers:{'X-Forwarded-For':'192.0.2.1','CF-Connecting-IP':'192.0.2.1','oai-authenticated-user-id':'relay-synthetic-test'}},[401,403]);
await check('unverified random session refused',route,{headers:{Authorization:authorization}},401);
await check('unverified broadcast refused before parsing/forwarding','/api/diana/cosmos/tx/v1beta1/txs',{method:'POST',headers:{Origin:origin,Authorization:authorization,'Content-Type':'application/json'},body:'{}'},401);
await check('wrong-origin broadcast refused','/api/diana/cosmos/tx/v1beta1/txs',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},body:'{}'},403);
await check('non-allowlisted route refused','/api/diana/not-allowed',{},404);
const policy=JSON.parse((await check('public configuration available','/api/relay/policy',{headers:{Authorization:authorization}},200)).text);
if(policy.action!=='diana-relay'||policy.binding!==createHash('sha256').update(key).digest('hex')||policy.required!==true||!policy.sitekey)throw Error('Invalid relay policy');
results.push({name:'policy binds the random credential and purpose',pass:true});
await check('invalid provider proof refused','/api/relay/session',{method:'POST',headers:{Origin:origin,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({token:'the-record-invalid-relay-diagnostic-token'})},403);
await check('rejected proof cannot authorize access',route,{headers:{Authorization:authorization}},401);
const bundle=(await check('published browser bundle available','/verify.js',{},200)).text;
const digest=value=>createHash('sha256').update(value).digest('hex');
const expectedHash=digest(readFileSync('dist/verify.js'));const actualHash=digest(bundle);
if(expectedHash!==actualHash)throw Error('Published browser bundle differs');
results.push({name:'published browser bundle matches checked source',pass:true,sha256:actualHash});
const landing=await check('landing remains available','/',{},200);
if(!landing.text.includes('check-relay-access'))throw Error('Browser check control absent');
await check('public demo download remains available','/demo/agreement-v1.txt',{},200);
const output={checkedAt:new Date().toISOString(),origin,results,broadcastsSubmitted:0,validHumanChecksCompleted:0,scope:'Bounded refusal, invalid-provider-proof, public UI and build-parity checks only. Positive human/browser acceptance remains separate.'};
const at=process.argv.indexOf('--output');if(at>=0)writeFileSync(process.argv[at+1],JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
