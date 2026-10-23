import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import catalogue from "@/lib/market/data/courses.json";
import { cleanHtml, gradeQuiz, isNative, nativeCourse } from "@/lib/market/lessons";
import { initialState, learnCourse } from "./activities";
import { runChecks } from "./checks";
import type { Activity, ActivityState } from "./types";
import { decodeSpec, validateSpec } from "./widgets/engine";
import type { WidgetSpec } from "./widgets/types";
import { loadSources, stable } from "../../scripts/author/build-new-courses.mjs";

/**
 * The interactive courses written in scripts/author/courses. For every one: the generated files match the source, the content is complete
 * and safe, every quiz is well formed, and every lab can be finished with its model answer but is not already passed before the student acts.
 */
type Built = {
  slug: string;
  lesson: ReturnType<typeof nativeCourse> & object;
  activities: { skills: Array<{ id: string }>; badges: Array<{ when: { all?: string[]; any?: string[] } }>; activities: Activity[]; landing: { hero: unknown; outcomes: unknown[]; projects: unknown[]; faq: unknown[] } };
  solutions: Record<string, { cells?: Record<string, string>; formats?: Record<string, object>; charts?: object[]; html?: string; deck?: object; answers?: Record<string, string> }>;
  catalogue: Record<string, unknown>;
};
const root = path.resolve(__dirname, "../..");
const sources = (await loadSources()) as Built[];
const RE = /<div class="cw-widget-slot" data-cw-widget="([a-z]+)" data-spec="([A-Za-z0-9+/=]+)"/g;
const words = (html: string): number => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").split(/\s+/).filter(Boolean).length;

function solve(a: Activity, sol: Built["solutions"][string]): ActivityState {
  if (a.kind === "classify") return { kind: "classify", answers: sol.answers ?? {} };
  if (a.kind === "word") return { kind: "word", html: sol.html ?? "" };
  if (a.kind === "slides") return { kind: "slides", deck: sol.deck as never };
  const s = (initialState(a) as { sheet: { cells: Record<string, string>; formats: Record<string, object>; charts: object[] } }).sheet;
  return { kind: "sheet", sheet: { cells: { ...s.cells, ...(sol.cells ?? {}) }, formats: { ...s.formats, ...(sol.formats ?? {}) }, charts: sol.charts ?? s.charts } as never };
}

describe("new interactive courses", () => {
  it("has courses to check", () => expect(sources.length).toBeGreaterThan(0));
  it("every slug is unique and in the catalogue", () => {
    expect(new Set(sources.map((s) => s.slug)).size).toBe(sources.length);
    for (const s of sources) expect(catalogue.courses.some((c) => c.slug === s.slug), s.slug).toBe(true);
  });

  for (const c of sources) {
    describe(c.slug, () => {
      const nc = c.lesson as unknown as NonNullable<ReturnType<typeof nativeCourse>>;

      it("the generated files and the catalogue are up to date with the source", () => {
        expect(readFileSync(path.join(root, "lib/market/data/lessons", `${c.slug}.json`), "utf8")).toBe(stable(c.lesson));
        expect(readFileSync(path.join(root, "lib/learn/data", `${c.slug}.activities.json`), "utf8")).toBe(stable(c.activities));
        const row = catalogue.courses.find((x) => x.slug === c.slug) as Record<string, unknown>;
        for (const [k, v] of Object.entries(c.catalogue)) expect(row[k], `${c.slug}.${k}`).toEqual(v);
        expect(row.modules).toBe(nc.modules.length);
        expect(isNative(c.slug)).toBe(true);
        expect(nativeCourse(c.slug)!.modules.length).toBe(nc.modules.length);
        expect(learnCourse(c.slug)!.activities.length).toBe(c.activities.activities.length);
      });

      it("is a full course: depth, structure and honest length", () => {
        expect(nc.modules.length).toBe(6);
        let total = 0;
        for (const m of nc.modules) {
          expect(m.topics.length, `${m.slug} lessons`).toBeGreaterThanOrEqual(3);
          expect(m.summary.length, m.slug).toBeGreaterThan(30);
          expect(m.outcome.length, m.slug).toBeGreaterThan(30);
          expect(m.practical?.steps.length ?? 0, `${m.slug} practical`).toBeGreaterThanOrEqual(3);
          total += words(m.intro);
          for (const t of m.topics) {
            expect(t.keyPoints.length, `${m.slug}/${t.slug} key points`).toBeGreaterThanOrEqual(2);
            total += words(t.html);
          }
        }
        expect(total, `${c.slug} lesson words`).toBeGreaterThanOrEqual(3600);
        const text = JSON.stringify(c.lesson);
        for (const bad of ["TODO", "lorem", "undefined", "[object", "NaN"]) expect(text.includes(bad), bad).toBe(false);
      });

      it("every quiz is well formed and graded from the stored key", () => {
        const positions = new Set<number>();
        const all = [...nc.modules.map((m) => ({ id: m.slug, q: m.quiz!, min: 6 })), { id: "capstone", q: nc.capstone.quiz!, min: 10 }];
        for (const { id, q, min } of all) {
          expect(q.pass).toBe(70);
          expect(q.questions.length, `${id} questions`).toBeGreaterThanOrEqual(min);
          for (const [i, x] of q.questions.entries()) {
            expect(x.options.length, `${id} q${i + 1} options`).toBe(4);
            expect(new Set(x.options).size, `${id} q${i + 1} distinct options`).toBe(4);
            expect(x.correct >= 0 && x.correct < 4, `${id} q${i + 1} key`).toBe(true);
            expect(x.explanation.length, `${id} q${i + 1} explanation`).toBeGreaterThan(10);
            positions.add(x.correct);
          }
          expect(gradeQuiz(q, q.questions.map((x) => x.correct)).passed, `${id} model answers pass`).toBe(true);
          expect(gradeQuiz(q, q.questions.map((x) => (x.correct + 1) % 4)).passed, `${id} wrong answers fail`).toBe(false);
        }
        expect(positions.size, "correct answers use every position").toBe(4);
      });

      it("lesson HTML is already safe and every widget validates", () => {
        const ids = new Set<string>();
        for (const m of nc.modules) {
          expect(cleanHtml(m.intro)).toBe(m.intro);
          for (const t of m.topics) {
            expect(cleanHtml(t.html), `${t.slug} html`).toBe(t.html);
            const specs = [...t.html.matchAll(RE)].map((x) => ({ type: x[1], spec: decodeSpec(x[2]) as WidgetSpec }));
            expect(specs.some((s) => s.type === "complete"), `${t.slug}: complete button`).toBe(true);
            for (const s of specs) {
              expect(validateSpec(s.spec), `${t.slug} / ${s.spec.id}`).toEqual([]);
              if (s.type !== "complete") { expect(ids.has(s.spec.id), `duplicate widget id ${s.spec.id}`).toBe(false); ids.add(s.spec.id); }
            }
          }
        }
        expect(cleanHtml(nc.capstone.intro)).toBe(nc.capstone.intro);
      });

      it("the labs are well formed and point at real modules", () => {
        const acts = c.activities.activities;
        const mods = new Set<string>([...nc.modules.map((m) => m.slug), "capstone"]);
        expect(acts.length, "labs").toBeGreaterThanOrEqual(8);
        expect(new Set(acts.map((a) => a.id)).size).toBe(acts.length);
        const kinds = new Set(acts.map((a) => a.kind));
        expect([...kinds].some((k) => k !== "classify"), "at least one hands-on lab, not only sorting").toBe(true);
        for (const a of acts) {
          expect(mods.has(a.module), `${a.id} -> ${a.module}`).toBe(true);
          expect(a.checks.length, a.id).toBeGreaterThan(0);
          expect(new Set(a.checks.map((x) => x.id)).size, `${a.id} check ids`).toBe(a.checks.length);
          expect(a.steps.length, a.id).toBeGreaterThan(0);
          expect(c.activities.skills.some((s) => a.skills.includes(s.id)), `${a.id} skill`).toBe(true);
          const prefix = { word: "doc.", sheet: "sheet.", slides: "slides.", classify: "classify." }[a.kind];
          for (const x of a.checks) {
            expect(x.spec.k.startsWith(prefix), `${a.id}/${x.id}`).toBe(true);
            expect(x.hint.length, `${a.id}/${x.id} hint`).toBeGreaterThan(5);
            expect(x.explain.length, `${a.id}/${x.id} explain`).toBeGreaterThan(5);
          }
        }
        for (const m of nc.modules) expect(acts.some((a) => a.module === m.slug && a.required), `${m.slug} has a required lab`).toBe(true);
        expect(acts.some((a) => a.module === "capstone" && a.required), "capstone lab").toBe(true);
        const ids = new Set(acts.map((a) => a.id));
        for (const b of c.activities.badges) for (const id of [...(b.when.all ?? []), ...(b.when.any ?? [])]) expect(ids.has(id), `badge -> ${id}`).toBe(true);
        expect(c.activities.landing.outcomes.length).toBeGreaterThanOrEqual(4);
        expect(c.activities.landing.faq.length).toBeGreaterThanOrEqual(3);
      });

      it("every lab can be finished with its model answer", () => {
        const problems: string[] = [];
        for (const a of c.activities.activities) {
          const r = runChecks(a, solve(a, c.solutions[a.id]));
          for (const x of r.results) if (!x.passed) problems.push(`${a.id}/${x.id}: ${x.message}`);
        }
        expect(problems).toEqual([]);
      });

      it("no lab is already passed (or more than half passed) before the student acts", () => {
        for (const a of c.activities.activities) {
          const r = runChecks(a, initialState(a));
          expect(r.allPassed, a.id).toBe(false);
          expect(r.passed / r.total, `${a.id} starts ${r.passed}/${r.total}`).toBeLessThanOrEqual(0.5);
        }
      });
    });
  }
});
