// Minimal local DOM/provider fixtures test concurrency and no automatic rebroadcast.
import test from 'node:test';
import assert from 'node:assert/strict';
test('concurrent browser reads share one challenge; access headers stay local and rejected broadcasts never retry',async()=>{
 const original={fetch:globalThis.fetch,window:globalThis.window,document:globalThis.document};
 let renders=0,policies=0,grants=0,upstreams=0,key;
 const node=()=>({open:false,append(){},setAttribute(){},addEventListener(){},remove(){},showModal(){this.open=true;},close(){this.open=false;}});
 globalThis.document={createElement:node,body:node()};
 globalThis.window={turnstile:{render(holder,options){renders++;assert.equal(options.action,'diana-relay');queueMicrotask(()=>options.callback('local-proof'));return 1;},remove(){}}};
 globalThis.fetch=async(url,options)=>{
  const auth=new Headers(options.headers).get('Authorization');assert.match(auth,/^Bearer relay:[a-f0-9]{64}$/);
  if(url==='/api/relay/policy'){policies++;key=auth;return Response.json({required:true,sitekey:'local-sitekey',action:'diana-relay',binding:'binding-fixture'});}
  assert.equal(auth,key);
  if(url==='/api/relay/session'){grants++;assert.deepEqual(JSON.parse(options.body),{token:'local-proof'});return Response.json({expiresAt:Date.now()+900000});}
  upstreams++;assert.equal(new Headers(options.headers).has('X-Forwarded-For'),false);
  return options.method==='POST'?Response.json({broadcastSubmitted:false},{status:429}):Response.json({ok:true});
 };
 try{
  const {relayFetch}=await import('../web/relay-access.js?browser-test');
  const results=await Promise.all([relayFetch('/read'),relayFetch('/read')]);assert.equal(results[0].status,200);assert.equal(results[1].status,200);
  assert.deepEqual([policies,grants,renders,upstreams],[1,1,1,2]);
  const rejected=await relayFetch('/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(rejected.status,429);assert.equal(upstreams,3);assert.equal(grants,1);
 }finally{globalThis.fetch=original.fetch;globalThis.window=original.window;globalThis.document=original.document;}
});
