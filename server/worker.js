import { admissionPolicy } from "./admission.js";
import { capacityOperations } from "./capacity.js";
import { relayRegistration } from "./registration-relay.js";
import { privateAgreements } from "./private-agreements.js";

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/admission/policy" && request.method === "GET") return admissionPolicy(request, env);
    if (pathname.startsWith("/api/operations/")) return capacityOperations(request, env);
    if (pathname === "/api/drafts" || pathname.startsWith("/api/drafts/")) return privateAgreements(request, env.DB, env);
    if (pathname.startsWith("/api/diana/")) return relayRegistration(request);
    const sampleFiles = {
      "/demo/agreement-v1.txt": "The Record test agreement: deliver one draft by Friday.\n",
      "/demo/agreement-v2.txt": "The Record test agreement: deliver one draft by Monday.\n",
    };
    if (Object.hasOwn(sampleFiles, pathname)) {
      return new Response(sampleFiles[pathname], { headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + pathname.split("/").pop() + '"',
      } });
    }
    const images = { ...STORY_ASSETS, "/demo/original-match.png": ORIGINAL_MATCH_IMAGE, "/demo/changed-mismatch.png": CHANGED_MISMATCH_IMAGE };
    if (Object.hasOwn(images, pathname)) {
      return new Response(Uint8Array.from(atob(images[pathname]), char => char.charCodeAt(0)), {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
      });
    }
    if (["/", "/history", "/history/", "/walkthrough", "/walkthrough/", "/blog", "/blog/", "/credits", "/credits/"].includes(pathname)) {
      return new Response(SITE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "no-referrer" } });
    }
    if (pathname === "/verify.js") {
      return new Response(BROWSER_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
    }
    return new Response(null, { status: 404 });
  },
};
