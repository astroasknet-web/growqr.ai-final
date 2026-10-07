/**
 * Portal-only deployments (SITE_MODE=portal) do not serve the marketing pages, so their videos and photo galleries are dead weight in the
 * deploy branch. Keeps only what the portal pages, e-mails, passports and the browser (icons, manifest) use.
 *
 *   node scripts/prune-public.mjs <public dir>
 */
import fs from "node:fs";
import path from "node:path";

const KEEP = new Set([
  "qrscore", "studio", "badges", "custom-icons", "internship", "partner-logos", "sublogos", "shared",
  "android-chrome-192x192.png", "android-chrome-512x512.png", "apple-touch-icon.png", "favicon-16x16.png", "favicon-32x32.png", "favicon.ico", "site.webmanifest",
  "crm-file.js", "growqr-logo.png", "growqr.png", "logo.png", "onlylogo.png", "emailogo.png", "og-image.png", "growqrcode.png", "passport-context.jsonld",
]);

const dir = path.resolve(process.argv[2] ?? "public");
let removed = 0;
for (const name of fs.readdirSync(dir)) {
  if (KEEP.has(name)) continue;
  fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  removed++;
}
console.log(`pruned ${removed} entries from ${dir}`);
