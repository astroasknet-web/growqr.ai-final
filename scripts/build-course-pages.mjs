/**
 * Convert a Vidaara standard course (the assembled JSON from the course tools) into a native GrowQR course.
 *
 *   node scripts/build-course-pages.mjs <course.json> [slug]
 *
 * Writes:
 *   lib/market/data/lessons/<slug>.json      the lesson player data (modules, quizzes, capstone, landing block)
 *   content/course-sources/<course id>.json  a copy of the source, so the conversion can be repeated
 * and upserts the catalogue entry in lib/market/data/courses.json (the catalogue is loaded into Postgres when the server starts).
 * After the first run for a new slug, register it in lib/market/lessons.ts (NATIVE map).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { buildNativeCourse, slugify } from "./lib/course-html.mjs";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/build-course-pages.mjs <course.json> [slug]");
const root = path.resolve(import.meta.dirname, "..");
const c = JSON.parse(readFileSync(src, "utf8"));
const slug = process.argv[3] ?? `${slugify(c.course.programme)}-${slugify(c.course.title)}`;

// Guard: the diagrams quote figures from the worked examples. Fail loudly if the source changes and they no longer match.
const blob = JSON.stringify(c);
for (const n of ["5,60,000", "6,35,750", "1,83,750", "95,800", "21,400", "48,500", "2,70,000", "1,75,000", "2,55,000"]) {
  if (!blob.includes(n)) throw new Error(`Figure ${n} is quoted by a diagram but is missing from the course source; update scripts/lib/course-html.mjs`);
}

const nc = buildNativeCourse(c, slug);
mkdirSync(path.join(root, "lib/market/data/lessons"), { recursive: true });
writeFileSync(path.join(root, "lib/market/data/lessons", `${slug}.json`), JSON.stringify(nc));
mkdirSync(path.join(root, "content/course-sources"), { recursive: true });
{ const dest = path.join(root, "content/course-sources", `${c.course.id}.json`); if (path.resolve(src) !== path.resolve(dest)) copyFileSync(src, dest); }

// Catalogue entry.
const catFile = path.join(root, "lib/market/data/courses.json");
const cat = JSON.parse(readFileSync(catFile, "utf8"));
cat.categories.university ??= { name: "University Programmes (BBA, BCA, MCA, MBA)", c1: "#1E3A8A", c2: "#93C5FD" };
const entry = {
  slug, title: nc.title, modules: nc.modules.length, hours: `~${nc.hours} hrs`, badge: `${c.course.programme} ${c.course.title}`, cat: "university",
  level: "B", levelLabel: "Beginner", tags: ["College", "Fresher"], weeks: "~12 weeks", pace: "6 hrs/wk",
  prereq: c.prerequisites[0] ?? "None", bestFor: c.who_is_it_for[0] ?? "", brief: c.course.subtitle,
  learn: c.units.map((u) => u.title), handsOn: "Software lab, practice numericals and a 48-question final assessment",
  outcome: c.learning_outcomes[0].text, icon: "calculator",
};
const at = cat.courses.findIndex((x) => x.slug === slug);
if (at >= 0) cat.courses[at] = entry; else cat.courses.push(entry);
writeFileSync(catFile, JSON.stringify(cat, null, 1) + "\n");

const topics = nc.modules.reduce((a, m) => a + m.topics.length, 0);
console.log(`${slug}: ${nc.modules.length} modules, ${topics} lessons, ${nc.landing.stats.quizQuestions} quiz questions, catalogue now ${cat.courses.length} courses`);
