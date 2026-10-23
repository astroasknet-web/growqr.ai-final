/**
 * Converts Vidaara's chapter-study modules (config/*-course.js + config/*-study/*.js) into JSON under content/lms/study/<course>/.
 * The source files are evaluated in a sandbox with no require(), no file or network access.
 *
 * usage: node scripts/import-vidaara-study.mjs <path to the Vidaara repo>
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/import-vidaara-study.mjs <path to the Vidaara repo>");
const cfg = path.join(src, "config");
const out = path.join(process.cwd(), "content", "lms", "study");

const COURSES = [
  { key: "cat-quant", course: "cat-quant-course", dir: "cat-study", title: "CAT Quantitative Aptitude", kind: "MBA entrance", blurb: "The full CAT QA syllabus in 6 modules and 57 chapters, with formulas, shortcuts, solved examples, practice problems and flashcards." },
  { key: "sat-math", course: "sat-math-course", dir: "sat-study", title: "SAT Math", kind: "Study abroad (undergraduate)", blurb: "The Digital SAT Math syllabus chapter by chapter, with worked examples and practice problems." },
  { key: "gre-quant", course: "gre-quant-course", dir: "gre-study", title: "GRE Quantitative Reasoning", kind: "Study abroad (graduate)", blurb: "The GRE Quant syllabus in 5 modules and 31 chapters, with solved examples and practice problems." },
  { key: "ssc-quant", course: "ssc-quant-course", dir: "ssc-study", title: "SSC CGL: Quantitative Aptitude", kind: "Government jobs", blurb: "SSC CGL quantitative aptitude, topic by topic." },
  { key: "ssc-reasoning", course: "ssc-reasoning-course", dir: "ssc-reasoning-study", title: "SSC CGL: General Intelligence & Reasoning", kind: "Government jobs", blurb: "SSC CGL reasoning, topic by topic." },
  { key: "ssc-english", course: "ssc-english-course", dir: "ssc-english-study", title: "SSC CGL: English", kind: "Government jobs", blurb: "SSC CGL English language, topic by topic." },
  { key: "ssc-gk", course: "ssc-ga-course", dir: "ssc-ga-study", title: "SSC CGL: General Awareness", kind: "Government jobs", blurb: "SSC CGL general awareness, topic by topic." },
  { key: "ctet", course: "ctet-course", dir: "ctet-study", title: "CTET (Teacher Eligibility Test)", kind: "Teaching", blurb: "CTET preparation in 7 modules and 52 chapters." },
];

function load(file) {
  const m = { exports: {} };
  const ctx = vm.createContext({ module: m, exports: m.exports, require: (x) => { throw new Error(`require(${x}) is not allowed`); }, console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { timeout: 5000, filename: file });
  return m.exports;
}
const safe = (s) => /^[a-z0-9-]+$/.test(s);

let files = 0, skipped = [];
for (const c of COURSES) {
  const meta = load(path.join(cfg, `${c.course}.js`));
  const dir = path.join(out, c.key);
  fs.mkdirSync(dir, { recursive: true });
  const modules = meta.MODULES.map((m) => ({ number: m.number, title: m.title, summary: m.summary ?? "", chapters: m.chapters.filter((ch) => safe(ch.slug)).map((ch) => ({ number: ch.number, slug: ch.slug, title: ch.title, topics: ch.topics ?? [] })) }));
  const present = [];
  for (const m of modules) {
    for (const ch of m.chapters) {
      const f = path.join(cfg, c.dir, `${ch.slug}.js`);
      if (!fs.existsSync(f)) { skipped.push(`${c.key}/${ch.slug}`); continue; }
      const s = load(f);
      const doc = {
        slug: ch.slug, title: s.chapterTitle ?? ch.title, domain: s.domainLabel ?? "", difficulty: s.difficulty ?? "", weightage: s.weightage ?? "", intro: s.intro ?? "",
        formulas: s.formulas ?? [], topics: (s.topics ?? []).map((t) => ({ slug: t.slug, name: t.name, details: t.details ?? "", solved: t.solved ?? [], unsolved: t.unsolved ?? [] })),
        shortcuts: s.shortcuts ?? [], mistakes: s.mistakes ?? [], pyq: s.pyq ?? "", flashcards: s.flashcards ?? [], summary: s.summary ?? "",
      };
      fs.writeFileSync(path.join(dir, `${ch.slug}.json`), JSON.stringify(doc));
      present.push(ch.slug);
      files++;
    }
  }
  const keep = new Set(present);
  const idx = { key: c.key, title: c.title, kind: c.kind, blurb: c.blurb, modules: modules.map((m) => ({ ...m, chapters: m.chapters.filter((ch) => keep.has(ch.slug)) })).filter((m) => m.chapters.length) };
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(idx));
  console.log(`${c.key}: ${present.length} chapters`);
}
console.log(`written ${files} chapter files`, skipped.length ? `skipped (no study file): ${skipped.join(", ")}` : "");
