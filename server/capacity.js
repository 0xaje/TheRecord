const limit = 2000;
const tables = [
  ['drafts','drafts','length(CAST(title AS BLOB)) + length(CAST(terms AS BLOB))'],
  ['revisions','draft_revisions','length(CAST(title AS BLOB)) + length(CAST(terms AS BLOB))'],
  ['shares','shares','length(CAST(title AS BLOB)) + length(CAST(terms AS BLOB))'],
  ['feedback','review_feedback','length(CAST(note AS BLOB))'],
];
// A bounded aggregate only: document text never crosses the database boundary.
export const INVENTORY_SQL = 'SELECT ' + tables.flatMap(([name,table,bytes])=>[
  `(SELECT COUNT(*) FROM (SELECT 1 FROM ${table} LIMIT ${limit+1})) AS ${name}_count`,
  `(SELECT COALESCE(SUM(bytes),0) FROM (SELECT ${bytes} AS bytes FROM ${table} LIMIT ${limit+1})) AS ${name}_bytes`,
]).concat(['request_limits','invite_codes'].map(table=>`(SELECT COUNT(*) FROM (SELECT 1 FROM ${table} LIMIT 4097)) AS ${table}_count`)).join(', ');
const payloadNames=tables.map(([name])=>name);
export const INITIALIZE_SQL = `INSERT INTO service_capacity(id,limit_bytes,used_bytes,drafts_count,revisions_count,shares_count,feedback_count,initialized_at)
  SELECT 1, ?, ${payloadNames.map(n=>n+'_bytes').join('+')}, ${payloadNames.map(n=>n+'_count').join(',')}, ?
  FROM (${INVENTORY_SQL}) WHERE ${payloadNames.map(n=>n+'_count <= '+limit).join(' AND ')}
  AND NOT EXISTS(SELECT 1 FROM service_capacity WHERE id=1) RETURNING *`;
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export async function capacityOperations(request,env) {
  const path=new URL(request.url).pathname;
  if (!(request.method==='GET' && path==='/api/operations/capacity') && !(request.method==='POST' && path==='/api/operations/capacity/initialize')) return response({error:'Page not found.'},404);
  const expected=env.RECORD_OPERATIONS_TOKEN_SHA256;
  const supplied=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if(!/^[a-f0-9]{64}$/.test(expected??'') || !supplied) return response({error:'Operator authorization required.'},401);
  const actual=await hash(supplied);let mismatch=0;
  for(let i=0;i<64;i++)mismatch|=actual.charCodeAt(i)^expected.charCodeAt(i);
  if(mismatch)return response({error:'Operator authorization required.'},401);
  if(!env.DB)return response({error:'Usage service unavailable.'},503);
  try {
    if(request.method==='POST') {
      if(request.headers.get('Origin')!==new URL(request.url).origin || request.headers.get('X-Record-Operation')!=='initialize-64MiB')return response({error:'Explicit same-origin initialization required.'},403);
      // One SQLite statement snapshots existing text and initializes metering atomically.
      // Concurrent writes are serialized by SQLite; existing counters are never reset.
      const initialized=await env.DB.prepare(INITIALIZE_SQL).bind(67108864,Date.now()).first();
      if(!initialized) {
        const prior=await env.DB.prepare('SELECT id FROM service_capacity WHERE id=1').bind().first();
        return response({error:prior?'Usage is already initialized; no reset performed.':'Inventory exceeds the bounded initialization limit; operator review required.'},409);
      }
    }
    // Meter and aggregate are read in one SQLite snapshot, avoiding false drift during writes.
    const fields=['limit_bytes','used_bytes','drafts_count','revisions_count','shares_count','feedback_count','initialized_at'];
    const row=await env.DB.prepare(`SELECT i.*, ${fields.map(f=>'c.'+f+' AS capacity_'+f).join(', ')} FROM (${INVENTORY_SQL}) i LEFT JOIN service_capacity c ON c.id=1`).bind().first();
    const capacity=row.capacity_initialized_at===null?null:Object.fromEntries(fields.map(f=>[f,row['capacity_'+f]]));
    const inventory=Object.fromEntries(Object.entries(row).filter(([key])=>!key.startsWith('capacity_')));
    const exhaustive=payloadNames.every(n=>inventory[n+'_count']<=limit);
    const scannedBytes=payloadNames.reduce((sum,n)=>sum+Number(inventory[n+'_bytes']),0);
    const reconciled=capacity && exhaustive ? scannedBytes===capacity.used_bytes && payloadNames.every(n=>capacity[n+'_count']===inventory[n+'_count']) : null;
    return response({checkedAt:new Date().toISOString(),initialized:!!capacity,capacity,inventory,inventoryExhaustive:exhaustive,counterCountsExhaustive:inventory.request_limits_count<=4096 && inventory.invite_codes_count<=4096,reconciled,
      status:!capacity?'initialization-required':reconciled===false?'accounting-mismatch':!exhaustive?'inventory-incomplete':capacity.used_bytes>=capacity.limit_bytes?'full':capacity.used_bytes>=capacity.limit_bytes*.9?'review':capacity.used_bytes>=capacity.limit_bytes*.8?'warning':'normal',
      measurement:'UTF-8 application text in drafts, saved revisions, invitation snapshots and feedback. Excludes database pages/indexes/metadata, counter records, invite_codes, backups and provider billing.',
      antiBotGateEnabled:false,providerMonitoringVerified:false});
  } catch {return response({error:'Usage service temporarily unavailable.'},503);}
}
