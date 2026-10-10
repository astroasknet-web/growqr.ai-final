/**
 * Build lib/tests/data/gre-quant.json from the Vidaara GRE question-bank SQL export (INSERT INTO question_bank ... exam='GRE').
 *   node scripts/build-gre-bank.mjs "<path to _gre_gen_prod.sql>"
 * Only well-formed four-option questions are kept. The result is the answer key, so it is read on the server only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/build-gre-bank.mjs <sql file>");
const COLS = "subject grade topic_slug topic_name question_text options correct_index explanation diagram section difficulty exam tags content_hash".split(" ");

/** Parse the first VALUES (...) tuple of one INSERT line: 'strings' with backslash and doubled-quote escapes, NULL, numbers. */
function tuple(l) {
  let p = l.indexOf("VALUES (") + 8;
  const vals = [];
  for (;;) {
    while (l[p] === " ") p++;
    let v;
    if (l[p] === "'") {
      p++;
      let o = "";
      for (;;) {
        const c = l[p];
        if (c === "\\") {
          const n = l[p + 1];
          o += n === "n" ? "\n" : n === "t" ? "\t" : n === "r" ? "\r" : n === "0" ? "\0" : n;
          p += 2;
        } else if (c === "'") {
          if (l[p + 1] === "'") { o += "'"; p += 2; } else { p++; break; }
        } else { o += c; p++; }
      }
      v = o;
    } else {
      let q = p;
      while (l[q] !== "," && l[q] !== ")") q++;
      const t = l.slice(p, q).trim();
      v = t === "NULL" ? null : Number(t);
      p = q;
    }
    vals.push(v);
    while (l[p] === " ") p++;
    if (l[p] === ",") { p++; continue; }
    return vals;
  }
}

const out = [];
for (const l of readFileSync(file, "utf8").split("\n")) {
  if (!l.startsWith("INSERT")) continue;
  const o = Object.fromEntries(COLS.map((c, i) => [c, tuple(l)[i]]));
  let options;
  try { options = JSON.parse(o.options); } catch { continue; }
  if (!Array.isArray(options) || options.length !== 4 || !(o.correct_index >= 0 && o.correct_index < 4) || !o.question_text) continue;
  out.push({ id: out.length + 1, topic: o.topic_slug, topicName: o.topic_name, section: o.section, difficulty: o.difficulty, q: o.question_text, options, correct: o.correct_index, explain: o.explanation ?? "" });
}
const dest = path.resolve(import.meta.dirname, "../lib/tests/data/gre-quant.json");
writeFileSync(dest, JSON.stringify(out));
const by = {};
for (const q of out) by[q.topic] = (by[q.topic] ?? 0) + 1;
console.log(out.length, "questions", by);
