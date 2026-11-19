import { requestSiteverify } from './admission.js';
import { boundedText } from './bounded-stream.js';

const action = 'diana-relay';
const duration = 15 * 60000;
const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (error, status, extra = {}) => Response.json({ error, ...extra }, { status, headers });
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
const keyFrom = request => request.headers.get('Authorization')?.match(/^Bearer relay:([a-f0-9]{64})$/)?.[1];
const limited = () => Response.json({ error: 'Diana access is busy. Wait a minute before trying again.', code: 'RELAY_LIMIT', broadcastSubmitted: false }, { status: 429, headers: { ...headers, 'Retry-After': '60' } });

// Fixed service scopes only. Session scopes live in their separately bounded table.
async function serviceBudget(db, kind, maximum, now) {
  const window = Math.floor(now / 60000) * 60000;
  return !!await db.prepare(`INSERT INTO request_limits(scope,window_start,hits) VALUES(?,?,1)
    ON CONFLICT(scope) DO UPDATE SET hits=CASE WHEN window_start=excluded.window_start THEN hits+1 ELSE 1 END,
      window_start=excluded.window_start
    WHERE window_start!=excluded.window_start OR hits<? RETURNING hits`)
    .bind('relay:'+kind, window, maximum).first();
}
function configuration(env, request) {
  return env.DB && env.RECORD_TURNSTILE_HOSTNAME === new URL(request.url).hostname
    && typeof env.RECORD_TURNSTILE_SITE_KEY === 'string' && env.RECORD_TURNSTILE_SITE_KEY.length > 10
    && typeof env.RECORD_TURNSTILE_SECRET === 'string' && env.RECORD_TURNSTILE_SECRET.length > 10
    && !/^[123]x0{10,}/.test(env.RECORD_TURNSTILE_SITE_KEY) && !/^[123]x0{10,}/.test(env.RECORD_TURNSTILE_SECRET);
}

export async function relayAccess(request, env, { fetcher = fetch, now = Date.now() } = {}) {
  const path = new URL(request.url).pathname;
  const policy = path === '/api/relay/policy' && request.method === 'GET';
  if (!policy && !(path === '/api/relay/session' && request.method === 'POST')) return reply('Page not found.', 404);
  const key = keyFrom(request);
  if (!key) return reply('Start a fresh browser check for Diana access.', 401, { code: 'RELAY_CHECK_REQUIRED' });
  if (!policy && request.headers.get('Origin') !== new URL(request.url).origin) return reply('Same-origin request required.', 403);
  if (!configuration(env, request)) return reply('Diana browser access is temporarily unavailable.', 503);
  try {
    const binding = await hash(key);
    const existing = await env.DB.prepare('SELECT expires_at FROM relay_sessions WHERE binding=? AND expires_at>?').bind(binding, now).first();
    if (existing) return Response.json({ required: false, expiresAt: existing.expires_at }, { headers });
    if (policy) return Response.json({ required: true, sitekey: env.RECORD_TURNSTILE_SITE_KEY, action, binding }, { headers });
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply('Expected a JSON browser check.', 415);
    let token;
    try { token = JSON.parse(await boundedText(request.body, 4096, 10000)).token; }
    catch { return reply('Browser check unavailable or too large.', 400); }
    if (typeof token !== 'string' || !token.length || token.length > 2048) return reply('Complete a fresh browser check.', 403);
    // Bound provider calls too; caller-supplied IP/forwarding headers are never an identity.
    if (!await serviceBudget(env.DB, 'checks', 30, now)) return limited();
    const result = await requestSiteverify(env, token, fetcher);
    if (!result.ok) return reply('The browser check could not be confirmed. Please try again later.', 503);
    const data = result.data, age = now - Date.parse(data.challenge_ts);
    if (data.success !== true || data.hostname !== new URL(request.url).hostname || data.action !== action
      || data.cdata !== binding || !Number.isFinite(age) || age < -30000 || age > 300000) return reply('Complete a fresh browser check for Diana access.', 403);
    await env.DB.prepare('DELETE FROM relay_sessions WHERE binding IN (SELECT binding FROM relay_sessions WHERE expires_at<=? LIMIT 100)').bind(now).run();
    try {
      // UNIQUE proof_hash rejects concurrent replay even before provider reuse converges.
      await env.DB.prepare('INSERT INTO relay_sessions(binding,proof_hash,expires_at) VALUES(?,?,?)').bind(binding, await hash(token), now + duration).run();
    } catch { return reply('The check was already used or access is at capacity. Complete a fresh check later.', 409); }
    return Response.json({ required: false, expiresAt: now + duration }, { headers });
  } catch { return reply('Diana browser access is temporarily unavailable.', 503); }
}

export async function authorizeRelay(request, env, kind, now = Date.now()) {
  const key = keyFrom(request);
  if (!key) return reply('Complete the browser check before using Diana access.', 401, { code: 'RELAY_CHECK_REQUIRED', broadcastSubmitted: false });
  if (!env.DB) return reply('Diana access is temporarily unavailable.', 503, { broadcastSubmitted: false });
  try {
    const binding = await hash(key), window = Math.floor(now / 60000) * 60000;
    // Atomic update: racing requests cannot exceed a session budget.
    const send = kind === 'broadcast';
    const column = send ? 'send' : 'read', maximum = send ? 3 : 120;
    const row = await env.DB.prepare(`UPDATE relay_sessions SET ${column}_window=?,
      ${column}_hits=CASE WHEN ${column}_window=? THEN ${column}_hits+1 ELSE 1 END
      ${send ? ',send_total=send_total+1' : ''}
      WHERE binding=? AND expires_at>? AND (${column}_window!=? OR ${column}_hits<?)
      ${send ? 'AND send_total<12' : ''} RETURNING binding`)
      .bind(window, window, binding, now, window, maximum).first();
    if (!row) {
      const active = await env.DB.prepare('SELECT expires_at FROM relay_sessions WHERE binding=? AND expires_at>?').bind(binding, now).first();
      return active ? limited() : reply('Diana browser access expired. Complete a fresh check.', 401, { code: 'RELAY_CHECK_REQUIRED', broadcastSubmitted: false });
    }
    if (!await serviceBudget(env.DB, kind, send ? 30 : 600, now)) return limited();
    return null;
  } catch { return reply('Diana access is temporarily unavailable.', 503, { broadcastSubmitted: false }); }
}
