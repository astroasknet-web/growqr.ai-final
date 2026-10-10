/**
 * Build the native lesson files (lib/market/data/lessons/<key>.json) from the Vidaara course sources.
 *   node scripts/build-lessons.mjs "<path to vidaara>/data"
 * Every course is normalised to one shape: { key, title, modules[], capstone }. A module is one checkpoint, the capstone is the last.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/build-lessons.mjs <vidaara data dir>");
const out = path.resolve(import.meta.dirname, "../lib/market/data/lessons");
mkdirSync(out, { recursive: true });
const rd = (...p) => JSON.parse(readFileSync(path.join(src, ...p), "utf8"));

const quiz = (q) => (q ? { pass: q.pass ?? 60, questions: (q.questions ?? []).map((x) => ({ text: x.text, options: x.options, correct: x.correct, explanation: x.explanation ?? "" })) } : null);
const topic = (t) => ({ title: t.title, slug: t.slug, html: t.html ?? "", keyPoints: t.keyPoints ?? [] });
const mod = (m, extra = {}) => ({
  num: m.num ?? extra.num, slug: m.slug, title: m.title, hours: m.hours ?? 0, level: m.level ?? "", summary: m.summary ?? "", outcome: m.outcome ?? "",
  intro: m.intro ?? "", topics: (m.topics ?? []).map(topic), practical: m.practical ? { title: m.practical.title, intro: m.practical.intro ?? "", steps: m.practical.steps ?? [] } : null, quiz: quiz(m.quiz),
});
const cap = (c) => ({
  slug: "capstone", title: c.title ?? "Final Capstone", summary: c.summary ?? "", intro: c.intro ?? c.project?.intro ?? "",
  steps: c.project?.steps ?? [], projectTitle: c.project?.title ?? "", quiz: quiz(c.quiz),
});

function modular(dir, key) {
  const idx = rd(dir, "index.json");
  const modules = idx.modules.map((m) => mod({ ...m, ...rd(dir, `module-${m.num}.json`) }));
  return { key, title: idx.title, tagline: idx.tagline ?? "", level: idx.level ?? "", hours: idx.hours ?? 0, summary: idx.summary ?? "", modules, capstone: cap({ ...(idx.capstone ?? {}), ...rd(dir, "capstone.json") }) };
}

function htmlcss() {
  const idx = rd("htmlcss", "index.json");
  const modules = idx.lessons.filter((l) => l.slug !== "capstone").map((l, i) => ({ ...mod({ ...l, ...rd("htmlcss", `${l.slug}.json`) }, { num: i + 1 }), track: l.track }));
  return { key: "html-css", title: idx.title, tagline: idx.tagline, level: idx.level, hours: idx.hours, summary: idx.summary, modules, capstone: cap({ ...idx.capstone, ...rd("htmlcss", "capstone.json") }) };
}

const courses = [modular("digital-literacy", "digital-literacy"), modular("data-science-python", "data-science-python"), modular("data-analytics-python", "data-analytics-python"), htmlcss()];
for (const c of courses) {
  writeFileSync(path.join(out, `${c.key}.json`), JSON.stringify(c));
  console.log(c.key, c.modules.length, "modules,", c.modules.reduce((a, m) => a + m.topics.length, 0), "topics");
}
