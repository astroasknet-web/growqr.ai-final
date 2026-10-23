/**
 * Authoring kit for the new interactive courses. A course is written as one source file (scripts/author/courses/<slug>.mjs) using the helpers
 * below; scripts/author/build-new-courses.mjs turns every source into the lesson file, the activities file and the catalogue entry.
 * Nothing here runs in the browser. Every piece of text is escaped; the only markup is **bold**, *italic* and `code`.
 */
import { esc } from "../lib/course-html.mjs";
import { widgetHtml } from "../lib/widget-html.mjs";

export const md = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?![*\w])/g, "$1<em>$2</em>");

export const slugify = (s) => String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/* ---------------------------------------------------------------------------------------------------------------- lesson blocks */
export const p = (t) => `<p>${md(t)}</p>`;
export const def = (term, t) => `<div class="cw-def"><span class="cw-label">Definition</span><p><b>${esc(term)}.</b> ${md(t)}</p></div>`;
export const list = (title, items, numbered = false) => `<div class="cw-box">${title ? `<h3>${esc(title)}</h3>` : ""}<${numbered ? "ol" : "ul"}>${items.map((i) => `<li>${md(i)}</li>`).join("")}</${numbered ? "ol" : "ul"}></div>`;
export const table = (caption, cols, rows) =>
  `<div class="cw-tablewrap" role="region" aria-label="${esc(caption)}" tabindex="0"><table class="cw-table"><caption>${esc(caption)}</caption><thead><tr>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${md(String(c))}</th>` : `<td>${md(String(c))}</td>`)).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
export const formula = (name, expr, note) => `<div class="cw-formula"><span class="cw-label">Formula &middot; ${esc(name)}</span><p class="cw-eq">${esc(expr)}</p>${note ? `<p class="cw-note">${md(note)}</p>` : ""}</div>`;
const callout = (cls, label, t) => `<aside class="cw-callout ${cls}"><span class="cw-label">${label}</span><p>${md(t)}</p></aside>`;
export const tip = (t) => callout("cw-tip", "Tip", t);
export const warn = (t) => callout("cw-warn", "Watch out", t);
export const exam = (t) => callout("cw-exam", "In practice", t);
export const mistakes = (items) => `<div class="cw-mistakes"><h3>Common mistakes</h3><ul>${items.map((m) => `<li>${md(m)}</li>`).join("")}</ul></div>`;
export const example = (title, problem, steps, answer) =>
  `<section class="cw-example" aria-label="Worked example: ${esc(title)}"><header><span class="cw-label">Worked example</span><h3>${esc(title)}</h3></header><p class="cw-problem">${md(problem)}</p><ol class="cw-steps">${steps.map((s) => `<li>${md(s)}</li>`).join("")}</ol><p class="cw-answer"><b>Answer.</b> ${md(answer)}</p></section>`;
export const tryIt = (q, a) => `<details class="cw-qa"><summary>Try it yourself: ${md(q)}</summary><p><b>Model answer.</b> ${md(a)}</p></details>`;

/** A small bar diagram (accessible: it has a text alternative). data is [[label, value], ...]. */
export function bars(caption, data, unit = "") {
  const max = Math.max(...data.map((d) => d[1]), 1);
  const w = 560, rowH = 34, h = data.length * rowH + 16;
  const rows = data.map(([l, v], i) => {
    const y = 8 + i * rowH, bw = Math.max(2, Math.round((v / max) * 330));
    return `<text x="8" y="${y + 20}" font-size="13" fill="#1a1a1a">${esc(l)}</text><rect x="190" y="${y + 4}" width="${bw}" height="22" rx="5" fill="#ff6a2f"/><text x="${190 + bw + 8}" y="${y + 20}" font-size="13" font-weight="600" fill="#1a1a1a">${esc(String(v))}${esc(unit)}</text>`;
  }).join("");
  const alt = data.map(([l, v]) => `${l} ${v}${unit}`).join(", ");
  return `<figure class="cw-fig"><div class="cw-fig-scroll"><svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(caption + ": " + alt)}">${rows}</svg></div><figcaption>${esc(caption)}</figcaption></figure>`;
}

/** A flow of boxes with arrows (a process or a cycle laid out in a row). */
export function flow(caption, steps) {
  const w = 150, g = 26, h = 70, n = steps.length;
  const W = n * w + (n - 1) * g + 20;
  const boxes = steps.map((s, i) => {
    const x = 10 + i * (w + g);
    const lines = String(s).match(/.{1,17}(\s|$)/g) ?? [String(s)];
    return `<rect x="${x}" y="14" width="${w}" height="${h}" rx="12" fill="${i % 2 ? "#f5f5f2" : "#ffeadb"}" stroke="${i % 2 ? "#525252" : "#ff6a2f"}" stroke-width="2"/><text x="${x + 14}" y="38" font-size="15" font-weight="700" fill="#9c3a11">${i + 1}</text>${lines.slice(0, 3).map((l, k) => `<text x="${x + w / 2 + 8}" y="${38 + k * 16}" text-anchor="middle" font-size="13" fill="#1a1a1a">${esc(l.trim())}</text>`).join("")}${i < n - 1 ? `<path d="M${x + w + 2} ${14 + h / 2} L${x + w + g - 4} ${14 + h / 2}" stroke="#525252" stroke-width="2" marker-end="url(#a${i})"/><defs><marker id="a${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#525252"/></marker></defs>` : ""}`;
  }).join("");
  return `<figure class="cw-fig"><div class="cw-fig-scroll"><svg viewBox="0 0 ${W} ${h + 28}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(caption + ": " + steps.join(", then "))}">${boxes}</svg></div><figcaption>${esc(caption)}</figcaption></figure>`;
}

/** Interactive widgets (see lib/learn/widgets/types.ts). */
export const explorer = (spec) => widgetHtml({ type: "explorer", ...spec });
export const flashcards = (id, title, cards) => widgetHtml({ type: "flashcards", id, title, cards: cards.map(([front, back]) => ({ front, back })) });
/** Move the correct option to a chosen position (swap), so answers are spread over A to D instead of piling up on one letter. */
function place(options, correct, target) {
  const o = [...options];
  [o[correct], o[target]] = [o[target], o[correct]];
  return [o, target];
}
let spin = 0;
const quizWidget = (id, qs) => widgetHtml({ type: "quiz", id, title: "Check what you just learned", questions: qs.map(([q, options, answer, explain]) => { const [o, a] = place(options, answer, (spin++ + 1) % 4); return { q, options: o, answer: a, explain }; }) });

/** One lesson (topic). blocks are html strings from the helpers above; check is [[question, [4 options], answerIndex, explanation], ...]. */
export function topic({ title, slug, blocks, points, check }) {
  const s = slug ?? slugify(title);
  const parts = [...blocks];
  if (check?.length) parts.push(quizWidget(`${s}-check`.slice(0, 60), check));
  parts.push(widgetHtml({ type: "complete", id: s }));
  return { title, slug: s, html: parts.join("\n"), keyPoints: (points ?? []).map(md) };
}

let qspin = 0;
const quizOf = (qs, pass = 70) => ({ pass, questions: qs.map(([text, options, correct, explanation]) => { const [o, a] = place(options, correct, qspin++ % 4); return { text: md(text), options: o.map(md), correct: a, explanation: md(explanation) }; }) });

export function module_({ num, slug, title, hours, level, summary, outcome, intro, topics, practical, quiz, terms }) {
  const ts = [...topics];
  if (terms?.length) {
    const last = ts[ts.length - 1];
    ts[ts.length - 1] = { ...last, html: last.html.replace(/(<div class="cw-widget-slot" data-cw-widget="complete")/, `${flashcards(`${slug}-terms`.slice(0, 60), "Key terms: flip and sort", terms)}\n$1`) };
  }
  return {
    num, slug: slug ?? slugify(title), title, hours, level, summary, outcome, intro: `<p>${md(intro)}</p>`, topics: ts,
    practical: practical ? { title: practical.title, intro: md(practical.intro), steps: practical.steps.map(md) } : null,
    quiz: quizOf(quiz),
  };
}

export function capstone({ title, summary, intro, steps, projectTitle, quiz }) {
  return { slug: "capstone", title, summary, intro: `<p>${md(intro)}</p>`, steps: steps.map(md), projectTitle, quiz: quizOf(quiz, 70) };
}

/* ---------------------------------------------------------------------------------------------------------------- activities */
/** A check: ck(id, label, hint, explain, spec). */
export const ck = (id, label, hint, explain, spec) => ({ id, label, hint, explain, spec });

export const S = {
  value: (ref, equals) => ({ k: "sheet.value", ref, equals }),
  result: (ref, equals, tolerance) => ({ k: "sheet.result", ref, equals, ...(tolerance !== undefined ? { tolerance } : {}) }),
  formula: (ref, o = {}) => ({ k: "sheet.formula", ref, ...o }),
  filled: (range, min) => ({ k: "sheet.filled", range, ...(min !== undefined ? { min } : {}) }),
  chart: (o = {}) => ({ k: "sheet.chart", ...o }),
  sorted: (range, dir) => ({ k: "sheet.sorted", range, dir }),
  format: (ref, what) => ({ k: "sheet.format", ref, what }),
  noerrors: () => ({ k: "sheet.noerrors" }),
};
export const W = {
  heading: (min, level) => ({ k: "doc.heading", min, ...(level ? { level } : {}) }),
  paragraphs: (min, minWords) => ({ k: "doc.paragraphs", min, ...(minWords ? { minWords } : {}) }),
  list: (minItems, type) => ({ k: "doc.list", minItems, ...(type ? { type } : {}) }),
  table: (rows, cols) => ({ k: "doc.table", rows, cols }),
  format: (what) => ({ k: "doc.format", what }),
  contains: (text) => ({ k: "doc.contains", text }),
  words: (min, max) => ({ k: "doc.words", ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) }),
  pattern: (re, what, flags = "i") => ({ k: "doc.pattern", re, flags, what }),
  order: (texts) => ({ k: "doc.order", texts }),
};
export const D = {
  count: (min, max) => ({ k: "slides.count", min, ...(max ? { max } : {}) }),
  titles: () => ({ k: "slides.titles" }),
  contains: (text) => ({ k: "slides.contains", text }),
  readable: (maxBullets, maxWords) => ({ k: "slides.readable", maxBullets, maxWords }),
  layouts: (min) => ({ k: "slides.layouts", min }),
  shapes: (min) => ({ k: "slides.shapes", min }),
  theme: () => ({ k: "slides.theme", notDefault: true }),
  titleFirst: (text) => ({ k: "slides.title-first", ...(text ? { text } : {}) }),
};

const base = (o, kind) => ({
  id: o.id, kind, module: o.module, title: o.title, level: o.level ?? "beginner", minutes: o.minutes ?? 10, xp: o.xp ?? 40, skills: o.skills, required: o.required ?? false,
  objective: o.objective, scenario: o.scenario, steps: o.steps, checks: o.checks,
});

/** Spreadsheet lab. cells is the starting data; solution.cells/formats/charts are merged on top by the model answer used in tests. */
export function sheetLab(o) {
  return {
    activity: { ...base(o, "sheet"), view: o.view ?? { cols: 7, rows: 12 }, initial: { sheet: { cells: o.cells ?? {}, formats: {}, charts: [] } } },
    solution: o.solution,
  };
}
export function wordLab(o) {
  return { activity: { ...base(o, "word"), initial: { html: o.html ?? "<p><br></p>" } }, solution: { html: o.solution } };
}
let sid = 0;
const slide = (layout, title, body = "", body2 = "") => ({ id: `d${++sid}`, layout, title, body, body2, shapes: [] });
export const sl = { title: (t, b) => slide("title", t, b), bullets: (t, b) => slide("title-content", t, b), two: (t, a, b) => slide("two-column", t, a, b), section: (t) => slide("section", t) };
/** Give a slide n shapes (rectangles and arrows) for the model answer of a diagram task. */
export const withShapes = (s, n) => ({ ...s, shapes: Array.from({ length: n }, (_, i) => ({ id: `h${i}`, kind: i % 2 ? "arrow" : "rect", x: 40 + i * 90, y: 300, w: 80, h: 40, fill: "#2563eb" })) });
export function slidesLab(o) {
  return {
    activity: { ...base(o, "slides"), initial: { deck: o.initialDeck ?? { theme: "clean", slides: [{ id: "a1", layout: "title", title: "", body: "", body2: "", shapes: [] }] } } },
    solution: { deck: { theme: o.solutionTheme ?? "ocean", slides: o.solution.map((s) => ({ ...s })) } },
  };
}
/** Sort-and-decide. categories [[id,label]], items [[text, categoryId, why]]. */
export function classifyLab(o) {
  const items = o.items.map(([text, answer, why], i) => ({ id: `i${i + 1}`, text, answer, why }));
  return {
    activity: {
      ...base({ ...o, checks: items.map((it, i) => ck(it.id, `Item ${i + 1} is in the right group`, "Ask what this item is mainly about, or which group it would cause trouble in.", it.why, { k: "classify.item", item: it.id })) }, "classify"),
      classify: { categories: o.categories.map(([id, label]) => ({ id, label })), items },
    },
    solution: { answers: Object.fromEntries(items.map((it) => [it.id, it.answer])) },
  };
}

/* ---------------------------------------------------------------------------------------------------------------- the course */
export function course(c) {
  const modules = c.modules.map((m, i) => ({ ...m, num: i + 1 }));
  const slugs = new Set();
  for (const m of modules) {
    if (slugs.has(m.slug)) throw new Error(`${c.slug}: duplicate module slug ${m.slug}`);
    slugs.add(m.slug);
  }
  const labs = c.labs;
  return {
    slug: c.slug,
    lesson: { key: c.slug, title: c.title, tagline: c.tagline, level: c.level, hours: c.hours, summary: c.summary, modules, capstone: c.capstone },
    activities: {
      course: c.slug, slug: c.slug, skills: c.skills, levels: c.levels ?? [{ min: 0, title: "Beginner" }, { min: 120, title: "Practitioner" }, { min: 300, title: "Skilled" }, { min: 520, title: "Proficient" }, { min: 760, title: "Professional" }],
      badges: c.badges, landing: c.landing, activities: labs.map((l) => l.activity),
    },
    solutions: Object.fromEntries(labs.map((l) => [l.activity.id, l.solution])),
    catalogue: c.catalogue,
  };
}
