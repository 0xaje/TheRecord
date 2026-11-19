import {randomBytes,createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {mkdirSync,writeFileSync,readFileSync,lstatSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const defaultFile=join(homedir(),'.local/share/the-record-operations/operator.secret');
const publicOrigin='https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
export async function main(args=process.argv.slice(2),filename=defaultFile,origin=publicOrigin){
 const command=args[0];
 if(!['init','status','initialize','probe'].includes(command))throw Error('Use init, status, probe --confirm-no-save, or initialize --confirm-budget 67108864.');
 if(command==='init'){
  mkdirSync(dirname(filename),{recursive:true,mode:0o700});
  writeFileSync(filename,JSON.stringify({kind:'the-record-operator/v1',token:randomBytes(32).toString('hex')})+'\n',{mode:0o600,flag:'wx'});
 }
 const info=lstatSync(filename);
 if(!info.isFile() || info.isSymbolicLink() || (info.mode&0o077))throw Error('Operator file must be a regular private 0600 file. Never paste its contents.');
 const saved=JSON.parse(readFileSync(filename,'utf8'));
 if(saved.kind!=='the-record-operator/v1'|| !/^[a-f0-9]{64}$/.test(saved.token))throw Error('Invalid operator file.');
 if(command==='init')return {operatorFile:filename,environmentKey:'RECORD_OPERATIONS_TOKEN_SHA256',publicTokenSha256:createHash('sha256').update(saved.token).digest('hex'),note:'Share only this public hash for runtime configuration. Never share operator.secret. No request sent.'};
 const at=args.indexOf('--confirm-budget');
 if(command==='initialize' && (at<0 || args[at+1]!=='67108864'))throw Error('Review inventory first, then pass --confirm-budget 67108864.');
 if(command==='probe' && !args.includes('--confirm-no-save'))throw Error('Pass --confirm-no-save for the invalid-token provider diagnostic.');
 const response=await fetch(origin+'/api/operations/capacity'+(command==='initialize'?'/initialize':command==='probe'?'/provider-probe':''),{
  method:['initialize','probe'].includes(command)?'POST':'GET',redirect:'error',
  headers:{Authorization:'Bearer '+saved.token,Origin:origin,...(command==='initialize'?{'X-Record-Operation':'initialize-64MiB'}:command==='probe'?{'X-Record-Operation':'probe-no-save'}:{})},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Operator request returned HTTP '+response.status+'. No automatic retry; inspect status before initializing again.');
 return response.json();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
