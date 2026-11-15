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
    BROWSER_JS: JSON.stringify(browser),
  },
});
