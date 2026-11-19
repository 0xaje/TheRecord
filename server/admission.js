export class AdmissionError extends Error {constructor(message,status=403,code){super(message);this.status=status;this.code=code;}}
export const admissionMode=env=>!env.RECORD_ADMISSION_MODE || env.RECORD_ADMISSION_MODE==='off'?'off':['preview','enforce'].includes(env.RECORD_ADMISSION_MODE)?env.RECORD_ADMISSION_MODE:'invalid';
const action='new-workspace';
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
function config(env,hostname){
 const valid=env.RECORD_TURNSTILE_HOSTNAME===hostname && typeof env.RECORD_TURNSTILE_SITE_KEY==='string' && typeof env.RECORD_TURNSTILE_SECRET==='string'
  && env.RECORD_TURNSTILE_SITE_KEY.length>10 && env.RECORD_TURNSTILE_SECRET.length>10 && !/^[123]x0{10,}/.test(env.RECORD_TURNSTILE_SITE_KEY) && !/^[123]x0{10,}/.test(env.RECORD_TURNSTILE_SECRET);
 if(!valid)throw new AdmissionError('The new-workspace check is not configured. Existing drafts remain available.',503);
 return env.RECORD_TURNSTILE_SITE_KEY;
}
async function existing(db,owner){
 return !!(await db.prepare('SELECT 1 FROM drafts WHERE owner=? LIMIT 1').bind(owner).first()) || !!(await db.prepare('SELECT 1 FROM workspace_admissions WHERE owner=? AND expires_at>?').bind(owner,Date.now()).first());
}
export async function admissionPolicy(request,env){
 const mode=admissionMode(env);const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
 if(mode==='off')return Response.json({mode,required:false},{headers});
 const key=request.headers.get('X-Record-Workspace');
 if(!/^[a-f0-9]{64}$/.test(key??''))return Response.json({error:'Open your workspace before checking admission.'},{status:400,headers});
 try{
  const binding=await sha(key),owner='workspace:'+binding;
  const forcePreview=mode==='preview' && new URL(request.url).searchParams.get('preview')==='1';
  if(await existing(env.DB,owner) && !forcePreview)return Response.json({mode,required:false},{headers});
  if(mode==='invalid')throw new AdmissionError('Invalid admission mode.',503);
  const sitekey=config(env,new URL(request.url).hostname);
  return Response.json({mode,required:mode==='enforce',sitekey,workspaceBinding:binding,action},{headers});
 }catch{return Response.json({error:'The new-workspace check is unavailable. Existing drafts remain available.'},{status:503,headers});}
}
export async function admitNewWorkspace(request,db,env,owner,token,fetcher=fetch){
 const mode=admissionMode(env);
 if(!owner || mode==='off' || (mode==='preview' && !token))return;
 if(await existing(db,owner) && !(mode==='preview' && token))return;
 if(mode==='invalid')throw new AdmissionError('The new-workspace check is not configured. Existing drafts remain available.',503);
 const hostname=new URL(request.url).hostname;config(env,hostname);
 if(typeof token!=='string'||token.length<1||token.length>2048)throw new AdmissionError('Complete the new-workspace check before saving.');
 const binding=owner.slice('workspace:'.length);
 const provider=await requestSiteverify(env,token,fetcher);
 if(!provider.ok){
  console.error('admission_provider_failure',JSON.stringify({code:provider.code,stage:provider.stage,httpStatus:provider.httpStatus??null}));
  throw new AdmissionError('The new-workspace check could not be confirmed. No draft was saved. Check reference: '+provider.code+'.',503,provider.code);
 }
 const verified=provider.data;
 const timestamp=Date.parse(verified.challenge_ts),age=Date.now()-timestamp;
 if(verified.success!==true || verified.hostname!==hostname || verified.action!==action || verified.cdata!==binding || !Number.isFinite(timestamp) || age< -30000 || age>300000)
  throw new AdmissionError('The new-workspace check expired or did not match. Complete a fresh check.');
 const tokenHash=await sha(token);
 try{
  await db.prepare('DELETE FROM workspace_admissions WHERE owner IN (SELECT owner FROM workspace_admissions WHERE expires_at<? LIMIT 100)').bind(Date.now()).run();
  // Unique token_hash closes Siteverify's documented concurrent redemption convergence gap.
  await db.prepare('INSERT INTO workspace_admissions(owner,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(owner) DO NOTHING').bind(owner,tokenHash,Date.now()+7*86400000).run();
 }catch{throw new AdmissionError('The new-workspace check was already used or admission is at capacity. Complete a fresh check later.',409);}
}

export async function requestSiteverify(env,token,fetcher=fetch){
 let stage='fetch',httpStatus,responseFormat;
 try{
  const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.RECORD_TURNSTILE_SECRET,response:token}),signal:AbortSignal.timeout(10000)});
  httpStatus=response.status;stage='http';const type=response.headers.get('Content-Type')??'';responseFormat=type.startsWith('application/json')?'json':type.startsWith('text/html')?'html':'other';
  if(!response.ok)return{ok:false,code:'AP-HTTP-'+httpStatus,stage,httpStatus,responseFormat};
  stage='body';const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  for(;;){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return{ok:false,code:'AP-SIZE',stage,httpStatus};}text+=decoder.decode(value,{stream:true});}
  stage='json';const data=JSON.parse(text+decoder.decode());
  if(!data || typeof data!=='object' || Array.isArray(data) || typeof data.success!=='boolean')return{ok:false,code:'AP-SHAPE',stage,httpStatus};
  return{ok:true,data,httpStatus};
 }catch(error){
  const code=stage==='fetch'?(['TimeoutError','AbortError'].includes(error?.name)?'AP-TIMEOUT':'AP-CONNECTION'):stage==='body'?'AP-BODY':'AP-JSON';
  return{ok:false,code,stage,errorType:['Error','TypeError','SyntaxError','TimeoutError','AbortError'].includes(error?.name)?error.name:'Other',...(httpStatus===undefined?{}:{httpStatus}),...(responseFormat?{responseFormat}:{})};
 }
}
export async function admissionProviderProbe(request,env,fetcher=fetch){
 // Deliberately invalid token; this never proves bot protection or creates admission/draft rows.
 config(env,new URL(request.url).hostname);
 const result=await requestSiteverify(env,'the-record-invalid-diagnostic-token',fetcher);
 if(!result.ok)return{connectionConfirmed:false,provider:result,admissionGranted:false,draftSaved:false};
 const allowed=new Set(['missing-input-secret','invalid-input-secret','missing-input-response','invalid-input-response','bad-request','timeout-or-duplicate','internal-error']);
 const codes=Array.isArray(result.data['error-codes'])?result.data['error-codes'].filter(c=>allowed.has(c)):[];
 return{connectionConfirmed:true,httpStatus:result.httpStatus,invalidTokenRejected:result.data.success===false,providerCodes:codes,admissionGranted:false,draftSaved:false,scope:'Invalid-token diagnostic only. A completed real challenge is still required.'};
}
