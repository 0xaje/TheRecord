import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const [html, browser] = await Promise.all([
  readFile("dist/index.html", "utf8"),
  readFile("dist/verify.js", "utf8"),
]);

await build({
  entryPoints: ["server/worker.js"],
  bundle: true,
  platform: "browser",
  format: "esm",
  outfile: "dist/server/index.js",
  define: {
    SITE_HTML: JSON.stringify(html),
    ORIGINAL_MATCH_IMAGE: JSON.stringify((await readFile("docs/evidence/demo-original-match.png")).toString("base64")),
    CHANGED_MISMATCH_IMAGE: JSON.stringify((await readFile("docs/evidence/demo-changed-mismatch.png")).toString("base64")),
    BROWSER_JS: JSON.stringify(browser),
  },
});
