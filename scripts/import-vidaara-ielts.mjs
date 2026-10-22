/**
 * Imports Vidaara's IELTS lessons, Writing practice tests and Speaking practice tests into content/lms/ielts/.
 * The course structure (config/ielts-course.js) is evaluated in a sandbox with stubs for fs and path.
 * Reading and Listening practice tests already live in GrowQR (/practice-tests), so they are not copied.
 *
 * usage: node scripts/import-vidaara-ielts.mjs <path to the Vidaara repo>
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/import-vidaara-ielts.mjs <path to the Vidaara repo>");
const data = path.join(src, "data", "ielts");
const out = path.join(process.cwd(), "content", "lms", "ielts");
const safe = (s) => /^[a-z0-9-]+$/.test(s);

// 1. Course structure
const m = { exports: {} };
const stubs = { fs: { readFileSync() { throw new Error("no fs"); } }, path: { join: (...a) => a.join("/") } };
vm.runInContext(fs.readFileSync(path.join(src, "config", "ielts-course.js"), "utf8"), vm.createContext({ module: m, exports: m.exports, __dirname: "/x", process: { env: {} }, require: (x) => { if (!stubs[x]) throw new Error(`require(${x}) is not allowed`); return stubs[x]; }, console: { log() {}, warn() {}, error() {} } }), { timeout: 5000 });
const c = m.exports;
fs.mkdirSync(path.join(out, "lessons"), { recursive: true });
fs.writeFileSync(path.join(out, "course.json"), JSON.stringify({ sections: c.SECTIONS, modules: c.MODULES }));

// 2. Lessons
let lessons = 0;
for (const l of c.ALL_LESSONS) {
  if (!safe(l.slug)) continue;
  const f = path.join(data, `${l.slug}.json`);
  if (!fs.existsSync(f)) continue;
  fs.writeFileSync(path.join(out, "lessons", `${l.slug}.json`), JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8"))));
  lessons++;
}

// 3. Writing and Speaking tests
function copyTests(dir, to) {
  const od = path.join(out, to);
  fs.mkdirSync(od, { recursive: true });
  const list = [];
  for (const f of fs.readdirSync(path.join(data, dir)).filter((x) => x.endsWith(".json")).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(data, dir, f), "utf8"));
    if (!safe(j.slug)) continue;
    fs.writeFileSync(path.join(od, `${j.slug}.json`), JSON.stringify(j));
    list.push({ id: j.id, slug: j.slug, title: j.title, level: j.level, topics: j.topics ?? [] });
  }
  list.sort((a, b) => a.id - b.id);
  fs.writeFileSync(path.join(od, "index.json"), JSON.stringify(list));
  return list.length;
}
const w = copyTests("writing-tests", "writing");
const s = copyTests("speaking-tests", "speaking");
console.log(`${lessons} lessons, ${w} writing tests, ${s} speaking tests`);
