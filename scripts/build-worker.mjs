import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const [html, browser] = await Promise.all([
  readFile("dist/index.html", "utf8"),
  readFile("dist/verify.js", "utf8"),
]);

await build({
  entryPoints: ["server/worker.js"],
  bundle: true,
  preserveSymlinks: true,
  platform: "browser",
  format: "esm",
  outfile: "dist/server/index.js",
  define: {
    SITE_HTML: JSON.stringify(html),
    STORY_ASSETS: JSON.stringify(Object.fromEntries(await Promise.all(["client", "freelancer", "document", "save", "revisions", "chain"].map(async name => [
      "/assets/" + name + ".png",
      (await readFile("web/assets/" + name + ".png")).toString("base64"),
    ])))) ,
    ORIGINAL_MATCH_IMAGE: JSON.stringify((await readFile("docs/evidence/demo-original-match.png")).toString("base64")),
    CHANGED_MISMATCH_IMAGE: JSON.stringify((await readFile("docs/evidence/demo-changed-mismatch.png")).toString("base64")),
    BROWSER_JS: JSON.stringify(browser),
  },
});
