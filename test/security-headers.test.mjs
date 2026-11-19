import test from 'node:test';import assert from 'node:assert/strict';
import {secureResponse,enforcedPolicy}from'../server/security-headers.js';
import worker from '../dist/server/index.js';
test('security headers preserve status, body, MIME, cursor/download metadata and caching boundaries',async()=>{
 for(const [path,type,cache]of [['/','text/html','no-cache'],['/api/drafts','application/json','no-store'],['/demo/file.txt','text/plain','public, max-age=60']]){
 const response=secureResponse(new Request('https://record.test'+path),new Response('exact bytes',{status:201,headers:{'Content-Type':type,'Cache-Control':'public, max-age=60','X-Next-Draft':'cursor','Content-Disposition':'attachment; filename="original.txt"'}}));
 assert.equal(response.status,201);assert.equal(await response.text(),'exact bytes');assert.equal(response.headers.get('Content-Type'),type);assert.equal(response.headers.get('X-Next-Draft'),'cursor');assert.match(response.headers.get('Content-Disposition'),/original.txt/);assert.equal(response.headers.get('Cache-Control'),cache);
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');assert.equal(response.headers.get('Content-Security-Policy'),enforcedPolicy);assert.equal(response.headers.has('Content-Security-Policy-Report-Only'),false);assert.match(response.headers.get('Strict-Transport-Security'),/max-age/);
 }
 assert.equal(secureResponse(new Request('http://localhost/'),new Response()).headers.has('Strict-Transport-Security'),false);
});
test('built Worker applies headers on HTML, JS, downloads, API errors and missing routes',async()=>{
 for(const path of ['/','/walkthrough','/blog','/verify.js','/demo/agreement-v1.txt','/api/diana/forbidden','/missing']){
 const response=await worker.fetch(new Request('https://record.test'+path),{});
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(response.headers.get('Content-Security-Policy'),enforcedPolicy);
 }
 assert.match(enforcedPolicy,/script-src 'self' https:\/\/challenges.cloudflare.com/);assert.match(enforcedPolicy,/frame-src https:\/\/challenges.cloudflare.com/);assert.match(enforcedPolicy,/https:\/\/evm-testnet.qore.host/);
 assert.equal(enforcedPolicy.includes('unsafe-eval'),false);
 assert.equal(enforcedPolicy.includes("script-src 'self' 'unsafe-inline'"),false);
});
