import { collectBrowserCheck } from './admission.js';
// Memory only. Refresh/expiry requires a new provider check; no IP-derived identity.
let access, pending;
const timeout = () => AbortSignal.timeout(15000);
async function checkedJson(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Diana browser access is unavailable.');
  return data;
}
export async function ensureRelaySession() {
  if (access && access.expiresAt > Date.now() + 30000) return access.key;
  if (pending) return pending;
  pending = (async () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const headers = { Authorization: 'Bearer relay:' + key };
    const policy = await checkedJson(await fetch('/api/relay/policy', { headers, signal: timeout() }));
    const token = await collectBrowserCheck(policy, {
      title: 'Check before using Diana access',
      explanation: 'Complete this browser check to reduce automated requests. Access lasts 15 minutes. Cloudflare receives browser signals and a random session fingerprint. Your signing file and recovery code are not sent to it. This check does not sign or submit a transaction.',
    });
    const result = await checkedJson(await fetch('/api/relay/session', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }), signal: timeout(),
    }));
    if (!Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) throw new Error('Diana browser access could not be confirmed.');
    access = { key, expiresAt: result.expiresAt };
    return key;
  })();
  try { return await pending; } finally { pending = null; }
}
export async function relayFetch(path, options = {}) {
  const key = await ensureRelaySession();
  const headers = new Headers(options.headers);
  headers.set('Authorization', 'Bearer relay:' + key);
  const response = await fetch('/api/diana' + path, { ...options, headers, signal: options.signal ?? timeout() });
  if (response.status === 401) access = null;
  // Never retry automatically, especially after a potentially submitted broadcast.
  return response;
}
