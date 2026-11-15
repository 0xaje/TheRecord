import { relayRegistration } from "./registration-relay.js";

export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/diana/")) return relayRegistration(request);
    if (pathname === "/") {
      return new Response(SITE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (pathname === "/verify.js") {
      return new Response(BROWSER_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
    }
    return new Response(null, { status: 404 });
  },
};
