import { readFileSync } from "node:fs";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import * as diffMod from "./diff";
import * as docx from "./docx";
import * as jobMatch from "./job-match";
import * as renderer from "./renderer";
import * as rd from "./resume-data";
import * as scorer from "./scorer";
import * as templates from "./templates";

/**
 * Parity tests: the TypeScript Resume Studio must produce the SAME output as the original PHP classes on the same inputs.
 * Golden data comes from `php scripts/studio-golden.php`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = JSON.parse(readFileSync(path.join(__dirname, "__golden__", "studio.json"), "utf8")) as any;

function diff(a: unknown, b: unknown, at: string, out: string[]): void {
  if (out.length >= 8) return;
  const empty = (v: unknown) => (Array.isArray(v) && v.length === 0) || (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);
  if (empty(a) && empty(b)) return;
  if (typeof a === "number" && typeof b === "number") {
    if (Math.abs(a - b) > 1e-9) out.push(`${at}: ts=${a} php=${b}`);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push(`${at}: length ts=${a.length} php=${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], `${at}[${i}]`, out);
    return;
  }
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${at}.${k}`, out);
    return;
  }
  if (a !== b) out.push(`${at}: ts=${JSON.stringify(a)} php=${JSON.stringify(b)}`);
}

function same(ts: unknown, php: unknown, label: string): void {
  const out: string[] = [];
  diff(JSON.parse(JSON.stringify(ts)), php, label, out);
  expect(out, out.join("\n")).toEqual([]);
}

describe("templates", () => {
  it("builds the same 45-template catalogue", () => {
    expect(Object.keys(templates.all())).toHaveLength(45);
    same(templates.all(), g.templates, "templates");
  });
  it("recommends the same templates", () => {
    for (const c of g.recommend) expect(templates.recommend(c.prefs, c.rq, c.pro), JSON.stringify(c.prefs)).toEqual(c.picks);
  });
  it("ranks popular templates the same way", () => {
    for (const c of g.popular) expect(templates.popular(c.usage, c.exclude)).toEqual(c.picks);
  });
});

describe("resume data", () => {
  it("normalizes browser input identically", () => {
    for (const c of g.normalize) same(rd.normalize(c.in), c.out, `normalize:${c.label}`);
  });
  it("formats and parses dates identically", () => {
    for (const c of g.dates.fmtMonth) expect(rd.fmtMonth(c.in[0], c.in[1])).toBe(c.out);
    for (const c of g.dates.fmtDob) expect(rd.fmtDob(c.in[0], c.in[1])).toBe(c.out);
    for (const c of g.dates.parseRange) expect(rd.parseRange(c.in), c.in).toEqual(c.out);
  });
  it("imports a scored profile identically", () => {
    expect(g.fromProfile.length).toBeGreaterThan(4);
    for (const c of g.fromProfile) {
      same(rd.fromProfile(c.rq, c.user, c.text), c.out, `fromProfile:${c.name}`);
      same(rd.fromProfile(c.rq, c.user, ""), c.out_notext, `fromProfile(no text):${c.name}`);
    }
    same(rd.fromProfile(null, { name: "Only Name", email: "o@x.com" }), g.fromProfileNull, "fromProfile(null)");
  });
  it("builds the sample resume identically", () => same(rd.sample(), g.cases.sample, "sample"));
  it("produces the same plain text and word counts", () => {
    for (const c of g.text) {
      const t = rd.toText(g.cases[c.case], c.region);
      expect(t, `${c.case}/${c.region}`).toBe(c.text);
      expect(rd.wordCount(t)).toBe(c.words);
    }
  });
});

describe("renderer", () => {
  it("renders every template identically", () => {
    for (const c of g.render) {
      const t = templates.get(c.template)!;
      expect(renderer.html(g.cases[c.case], t), `${c.case}/${c.template}`).toBe(c.html);
      expect(renderer.html(g.cases[c.case], t, true), `${c.case}/${c.template} thumb`).toBe(c.thumb);
      expect(renderer.atsNotes(g.cases[c.case], t)).toEqual(c.ats);
    }
  });
  it("escapes markup in user text", () => {
    const html = renderer.html(g.cases.rich, templates.get("chrono-classic")!);
    expect(html).not.toContain("<b>O");
    expect(html).toContain("&lt;b&gt;O&#039;Neil&lt;/b&gt;");
  });
});

describe("word export", () => {
  it("writes the same document.xml", () => {
    for (const c of g.docx) expect(docx.documentXml(g.cases[c.case], templates.get(c.template)!), `${c.case}/${c.template}`).toBe(c.document);
  });
  it("builds a valid zip with the three parts", () => {
    const files = unzipSync(docx.build(g.cases.sample, templates.get("us-classic")!));
    expect(Object.keys(files).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "word/document.xml"]);
    expect(strFromU8(files["word/document.xml"])).toContain("Alex Morgan");
  });
});

describe("scoring", () => {
  it("scores the same as PHP on the same text", () => {
    for (const c of g.scorer) {
      const data = c.data ?? g.cases[c.case];
      const { result: _r, ...s } = scorer.run(data, templates.get(c.template)!);
      const { case: _c, template: _t, data: _d, ...php } = c;
      same(s, php, `scorer:${c.case}/${c.template}`);
    }
  });
});

describe("job match", () => {
  it("analyses job descriptions identically", () => {
    for (const [i, c] of g.jobmatch.entries()) same(jobMatch.analyze(c.jd, c.resume, c.years), c.out, `jobmatch[${i}]`);
  });
});

describe("diff", () => {
  it("diffs identically", () => {
    for (const [i, c] of g.diff.entries()) {
      const d = diffMod.lines(c.a, c.b);
      same(d, c.lines, `diff[${i}]`);
      same(diffMod.stats(d), c.stats, `diff[${i}].stats`);
    }
  });
});
