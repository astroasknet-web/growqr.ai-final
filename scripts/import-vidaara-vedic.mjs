/**
 * Imports Vidaara's Vedic Mathematics course into content/lms/vedic/: the 30 module texts (English and Hindi, Markdown)
 * and the curriculum (levels, modules, 16 Sutras, 13 Sub-Sutras) from config/vedic-curriculum.js, evaluated in a sandbox.
 *
 * usage: node scripts/import-vidaara-vedic.mjs <path to the Vidaara repo>
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/import-vidaara-vedic.mjs <path to the Vidaara repo>");
const out = path.join(process.cwd(), "content", "lms", "vedic");
fs.mkdirSync(path.join(out, "modules"), { recursive: true });

const m = { exports: {} };
vm.runInContext(fs.readFileSync(path.join(src, "config", "vedic-curriculum.js"), "utf8"), vm.createContext({ module: m, exports: m.exports, require: (x) => { throw new Error(`require(${x}) is not allowed`); }, console: { log() {}, warn() {}, error() {} } }), { timeout: 5000 });
const c = m.exports;

let files = 0;
for (const mod of c.MODULES) {
  const en = path.join(src, "data", "content", "vedic-math", "modules", `${mod.slug}.md`);
  const hi = path.join(src, "data", "content", "vedic-math", "modules", `${mod.slug}.hi.md`);
  mod.hasEnglish = fs.existsSync(en);
  mod.hasHindi = fs.existsSync(hi);
  if (mod.hasEnglish) { fs.copyFileSync(en, path.join(out, "modules", `${mod.slug}.md`)); files++; }
  if (mod.hasHindi) { fs.copyFileSync(hi, path.join(out, "modules", `${mod.slug}.hi.md`)); files++; }
}
fs.writeFileSync(path.join(out, "curriculum.json"), JSON.stringify({ sutras: c.SUTRAS, subSutras: c.SUBSUTRAS, levels: c.LEVELS, modules: c.MODULES }));
console.log(`${c.MODULES.length} modules, ${files} text files`);
