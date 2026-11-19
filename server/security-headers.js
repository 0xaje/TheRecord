// Keep Sites embedding available while excluding arbitrary framing origins.
export const enforcedPolicy = "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com";
export const candidatePolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://evm-testnet.qore.host https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "form-action 'self'",
  "frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
].join("; ");
export function secureResponse(request, response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Content-Security-Policy", enforcedPolicy);
  // Not enforcement. Browser console warnings are inspected during compatibility QA.
  // No violation-report endpoint: avoid collecting private URLs/document data.
  headers.set("Content-Security-Policy-Report-Only", candidatePolicy);
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=15552000");
  if (new URL(request.url).pathname.startsWith("/api/")) headers.set("Cache-Control", "no-store");
  else if (headers.get("Content-Type")?.startsWith("text/html")) headers.set("Cache-Control", "no-cache");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
