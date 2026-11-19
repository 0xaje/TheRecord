let widgetScript;
async function loadWidget(){
 if(window.turnstile)return;
 if(!widgetScript)widgetScript=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  const timeout=setTimeout(()=>{script.remove();widgetScript=null;reject(new Error('The new-workspace check did not load. Your draft has not been saved.'));},10000);
  script.onload=()=>{clearTimeout(timeout);resolve();};script.onerror=()=>{clearTimeout(timeout);script.remove();widgetScript=null;reject(new Error('The new-workspace check is unavailable. Your draft has not been saved.'));};document.head.append(script);
 });
 await widgetScript;
}
export async function collectAdmissionToken(key){
 const preview=new URLSearchParams(location.search).get('admission-test')==='1';
 const response=await fetch('/api/admission/policy'+(preview?'?preview=1':''),{headers:{Authorization:'Bearer workspace:'+key},signal:AbortSignal.timeout(10000)});
 const policy=await response.json();if(!response.ok)throw new Error(policy.error??'The new-workspace check could not be loaded.');
 if(!policy.sitekey || (!policy.required && !(preview && policy.mode==='preview')))return undefined;
 await loadWidget();
 return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='recovery-dialog';dialog.setAttribute('aria-labelledby','admission-title');
  const heading=document.createElement('h2');heading.id='admission-title';heading.textContent='Check before your first save';
  const explanation=document.createElement('p');explanation.textContent='Cloudflare Turnstile checks browser signals and a fingerprint of your workspace code. Your draft text and recovery code are not sent to it. This does not connect or sign with your wallet.';
  const holder=document.createElement('div'),cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';
  let widgetId,finished=false;
  const finish=(error,token)=>{if(finished)return;finished=true;clearTimeout(timeout);if(widgetId!==undefined){try{window.turnstile.remove(widgetId);}catch{}}if(dialog.open)dialog.close();dialog.remove();error?reject(error):resolve(token);};
  const timeout=setTimeout(()=>finish(new Error('The check timed out. Your draft has not been saved.')),120000);
  cancel.addEventListener('click',()=>finish(new Error('Check cancelled. Your draft has not been saved.')));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(new Error('Check cancelled. Your draft has not been saved.'));});
  dialog.append(heading,explanation,holder,cancel);document.body.append(dialog);dialog.showModal();
  try{widgetId=window.turnstile.render(holder,{sitekey:policy.sitekey,action:policy.action,cData:policy.workspaceBinding,theme:'dark',size:'flexible',callback:token=>finish(null,token),'error-callback':()=>{finish(new Error('The check failed. Your draft has not been saved.'));return true;},'expired-callback':()=>finish(new Error('The check expired. Complete a fresh check.'))});}
  catch{finish(new Error('The check could not open. Your draft has not been saved.'));}
 });
}
