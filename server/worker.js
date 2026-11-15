import { relayRegistration } from "./registration-relay.js";
import { privateAgreements } from "./private-agreements.js";

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/drafts" || pathname.startsWith("/api/drafts/")) return privateAgreements(request, env.DB);
    if (pathname.startsWith("/api/diana/")) return relayRegistration(request);
    if (pathname === "/") {
      return new Response(SITE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "no-referrer" } });
    }
    if (pathname === "/verify.js") {
      return new Response(BROWSER_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
    }
    return new Response(null, { status: 404 });
  },
};
