// Bounded live acceptance against a fresh, non-sensitive disposable workspace.
// Never run a public saturation test. No wallet operation or legacy identity spoofing.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
const live=process.argv.includes('--live');
if(!live)throw Error('Pass --live to create one non-sensitive draft in a fresh workspace and leave it in recoverable Trash.');
const base='https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key=randomBytes(32).toString('hex');
mkdirSync('.record-local',{recursive:true,mode:0o700});
const recoveryFile='.record-local/backend-acceptance-'+Date.now()+'.secret';
writeFileSync(recoveryFile,JSON.stringify({origin:base,workspaceKey:key})+'\n',{mode:0o600,flag:'wx'});
const checks=[];
async function request(path,method='GET',body,extra={}){
 const response=await fetch(base+'/api/drafts'+path,{method,headers:{'X-Record-Workspace':key,Origin:base,'Content-Type':'application/json',...extra},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 return response;
}
try{
 assert.equal((await request('/invalid-route')).status,404);checks.push('unknown route refused');
 assert.equal((await request('','POST',{title:'Not saved',terms:'Invalid origin'},{Origin:'https://other.test'})).status,403);checks.push('cross-origin write refused');
 const created=await request('','POST',{title:'Backend acceptance only',terms:'Non-sensitive disposable test. No agreement recorded on Diana.'});
 assert.equal(created.status,201);const draft=await created.json();checks.push('draft created');
 const changed=await request('','POST',{...draft,title:'Backend acceptance revised',terms:'Non-sensitive second revision.'});assert.equal(changed.status,200);const saved=await changed.json();checks.push('draft revised');
 const revisions=await request('/revisions?id='+draft.id);assert.equal(revisions.status,200);assert.equal((await revisions.json()).revisions.length,2);checks.push('both saved revisions retained');
 const shared=await request('/share','POST',saved);assert.equal(shared.status,200);const invite=await shared.json();
 assert.equal((await request('/review','POST',invite)).status,200);checks.push('invitation review works');
 assert.equal((await request('/trash','POST',saved)).status,200);checks.push('own test draft moved to recoverable Trash');
 assert.equal((await request('/review','POST',invite)).status,404);checks.push('Trash revokes invitation');
 const trash=await request('/trash');assert.equal(trash.status,200);assert.ok((await trash.json()).some(d=>d.id===draft.id));checks.push('Trash remains readable');
 console.log(JSON.stringify({testedAt:new Date().toISOString(),origin:base,result:'PASS',checks,requests:10,recoveryFile,scope:'Fresh own disposable workspace only. Recovery key and invitation secrets are never printed. Quota rollback and cross-user saturation tested in isolated SQLite, not by flooding this service. No permanent deletion or wallet transaction.'},null,2));
}catch(error){console.error('Acceptance stopped. Inspect local recovery file before any repeat. '+error.name);process.exitCode=1;}
