/**
 * Converts Vidaara's school content (data/content/class-1 ... class-12) into compact, normalised JSON under content/lms/school/.
 * Chapters keep their topics (concept, visual, examples, recap, quiz), the chapter test (online_test) and the Olympiad test
 * (imo_test). Test questions are normalised to { q, options[], correct (index), explanation }.
 *
 * usage: node scripts/import-vidaara-school.mjs <path to the Vidaara repo>
 */
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/import-vidaara-school.mjs <path to the Vidaara repo>");
const from = path.join(src, "data", "content");
const out = path.join(process.cwd(), "content", "lms", "school");
const safe = (s) => typeof s === "string" && /^[a-z0-9-]+$/.test(s);
const str = (v) => (typeof v === "string" ? v : "");

function question(q) {
  if (!q || typeof q !== "object") return null;
  const stem = str(q.text) || str(q.question) || str(q.q);
  let options = q.options;
  let correct = q.correct;
  if (options && !Array.isArray(options) && typeof options === "object") {
    const keys = Object.keys(options).sort();
    if (typeof correct === "string") correct = keys.indexOf(correct);
    options = keys.map((k) => options[k]);
  }
  if (typeof correct === "string" && /^[A-Za-z]$/.test(correct)) correct = correct.toUpperCase().charCodeAt(0) - 65;
  if (!stem || !Array.isArray(options) || options.length < 2 || !Number.isInteger(correct) || correct < 0 || correct >= options.length) return null;
  const o = { q: stem, options: options.map(String), correct, explanation: str(q.explanation) };
  if (q.section) o.section = String(q.section);
  if (q.difficulty) o.difficulty = String(q.difficulty);
  if (q.diagram) o.diagram = str(q.diagram);
  return o;
}
const questions = (a) => (Array.isArray(a) ? a.map(question).filter(Boolean) : []);
function test(t) {
  if (!t || typeof t !== "object") return null;
  const qs = questions(t.questions);
  if (!qs.length) return null;
  return { title: str(t.title), minutes: Number(t.time_limit_minutes ?? t.time_minutes) || Math.max(10, Math.ceil(qs.length * 1.5)), questions: qs };
}

function topic(t) {
  const quiz = [...questions(t.quiz), ...questions(t.check && t.check.questions)];
  const o = {
    title: str(t.title), concept: str(t.concept), visual: str(t.visual) || null,
    examples: (Array.isArray(t.examples) ? t.examples : []).map((e, i) => ({ number: e.number ?? i + 1, problem: str(e.problem), solution: str(e.solution), answer: e.answer == null ? undefined : String(e.answer) })),
    recap: Array.isArray(t.recap) ? t.recap.map(String) : [],
    quiz,
  };
  if (Array.isArray(t.sections) && t.sections.length) o.sections = t.sections.map((s) => ({ type: str(s.type), heading: str(s.heading), content: str(s.content), items: Array.isArray(s.items) ? s.items.map(String) : undefined, points: Array.isArray(s.points) ? s.points.map(String) : undefined }));
  if (t.wonder) o.wonder = { text: str(t.wonder), qa: Array.isArray(t.wonder_qa) ? t.wonder_qa.map((x) => ({ q: str(x.q), a: str(x.a) })) : [] };
  return o;
}

const ENGLISH = ["outcomes", "intro", "real_life", "rule_box", "vocabulary", "common_mistakes", "practice", "reading", "speaking", "writing", "micro_quiz", "challenge", "mindmap", "revision"];

let chapters = 0, bytesIn = 0, bytesOut = 0;
const classes = fs.readdirSync(from).filter((d) => /^class-\d+$/.test(d)).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
for (const cls of classes) {
  for (const subject of fs.readdirSync(path.join(from, cls))) {
    if (!safe(subject)) continue;
    const dir = path.join(from, cls, subject);
    const idxFile = path.join(dir, "index.json");
    if (!fs.existsSync(idxFile)) continue;
    const idx = JSON.parse(fs.readFileSync(idxFile, "utf8"));
    const odir = path.join(out, cls, subject);
    fs.mkdirSync(odir, { recursive: true });
    const list = [];
    for (const c of idx.chapters ?? []) {
      if (!safe(c.slug) || !c.file || !/^[a-z0-9.-]+\.json$/.test(c.file)) continue;
      const f = path.join(dir, c.file);
      if (!fs.existsSync(f)) continue;
      const raw = JSON.parse(fs.readFileSync(f, "utf8"));
      bytesIn += fs.statSync(f).size;
      const topics = (raw.topics ?? []).map(topic);
      const tests = {};
      const online = test(raw.online_test); if (online) tests.online = online;
      const imo = test(raw.imo_test); if (imo) tests.imo = imo;
      const doc = {
        number: raw.chapter_number ?? c.chapter_number ?? c.number ?? list.length + 1,
        title: str(raw.chapter_title) || str(raw.title) || c.title, slug: c.slug, color: str(raw.color) || str(c.color), level: str(raw.level), estTime: str(raw.est_time),
        description: str((raw.seo && (raw.seo.meta_description || raw.seo.description)) || ""),
        topics, tests,
      };
      const eng = {};
      for (const k of ENGLISH) if (raw[k] != null) eng[k] = raw[k];
      if (Object.keys(eng).length) doc.english = eng;
      const json = JSON.stringify(doc);
      fs.writeFileSync(path.join(odir, `${c.slug}.json`), json);
      bytesOut += json.length;
      chapters++;
      list.push({ number: doc.number, title: doc.title, slug: c.slug, color: doc.color, topics: topics.map((t) => t.title), online: online ? online.questions.length : 0, imo: imo ? imo.questions.length : 0 });
    }
    list.sort((a, b) => Number(a.number) - Number(b.number));
    const index = { class: cls, subject, label: str(idx.subject_label) || subject, description: str(idx.seo && (idx.seo.meta_description || idx.seo.description)), chapters: list };
    if (idx.full_test) index.fullTest = idx.full_test;
    fs.writeFileSync(path.join(odir, "index.json"), JSON.stringify(index));
  }
}
console.log(`${chapters} chapters, ${(bytesIn / 1e6).toFixed(1)} MB in, ${(bytesOut / 1e6).toFixed(1)} MB out`);
