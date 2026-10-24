import { describe, expect, it } from "vitest";
import { evaluate, parseDecimal, rat, eq } from "./expr";
import { ORACLES } from "./engine-oracles";
import { mark, parseResponse } from "./mark";
import { DEFAULT_CTX, ctxFor } from "./personalise";
import { SKILLS, buildQuestion, skill } from "./skills";
import type { Question } from "./types";

/**
 * Every generator, at every difficulty, over many seeds. For each question:
 *  - the answer equals the exact value of the question's expression (independent calculator), or the skill's oracle recomputes it from the plain numbers;
 *  - the question is deterministic, has a prompt, working, a positive time allowance, and the right answer is accepted by the marker;
 *  - choice questions contain the answer exactly once, with no duplicate options.
 */
const SEEDS = 80;
const answerRat = (a: string) => parseResponse(a);

function verify(q: Question): void {
  const where = `${q.skill} d=${q.d} seed=${q.seed}: ${q.prompt}`;
  expect(q.prompt.length, where).toBeGreaterThan(3);
  expect(q.working.length, where).toBeGreaterThan(0);
  expect(q.allowedMs, where).toBeGreaterThan(1000);
  expect(q.size, where).toBeGreaterThan(0);
  expect(q.prompt, where).not.toMatch(/NaN|undefined|Infinity|\[object/);
  expect(q.answer, where).not.toMatch(/NaN|undefined|Infinity/);
  if (q.kind === "choice") {
    expect(q.options, where).toBeTruthy();
    expect(new Set(q.options).size, `${where} duplicate options ${q.options}`).toBe(q.options!.length);
    expect(q.options!.filter((o) => o === q.answer).length, where).toBe(1);
  } else {
    const a = answerRat(q.answer);
    expect(a, `${where} answer not numeric: ${q.answer}`).not.toBeNull();
  }
  const via = typeof q.params.via === "string" ? q.params.via : q.skill;
  if (q.expr) {
    const want = evaluate(q.expr);
    const got = q.kind === "choice" ? answerRat(q.answer.replace(/,/g, "")) : answerRat(q.answer);
    expect(got && eq(got, want), `${where} | expr ${q.expr} = ${want.n}/${want.d} but answer ${q.answer}`).toBe(true);
  } else {
    const oracle = ORACLES[via];
    expect(oracle, `${where}: no expr and no oracle for ${via}`).toBeTruthy();
    const res = oracle(q.params, q);
    if (typeof res === "boolean") expect(res, `${where} | oracle rejected answer ${q.answer} params ${JSON.stringify(q.params)}`).toBe(true);
    else expect(q.answer.replace(/,/g, ""), `${where} | oracle says ${res} params ${JSON.stringify(q.params)}`).toBe(res);
  }
  if (q.lowest) {
    const m = /^(-?\d+)(?:\/(\d+))?$/.exec(q.answer);
    expect(m, `${where}: lowest-terms answer must be a/b or a whole number: ${q.answer}`).not.toBeNull();
    if (m?.[2]) {
      const g = (a: number, b: number): number => (b ? g(b, a % b) : Math.abs(a));
      expect(g(Number(m[1]), Number(m[2])), `${where}: ${q.answer} is not in lowest terms`).toBe(1);
      expect(Number(m[2]), where).toBeGreaterThan(1);
    }
  }
  // the marker accepts the canonical answer
  const typed = q.kind === "choice" ? q.answer : q.answer;
  expect(mark(q, typed).correct, `${where}: marker rejects its own answer ${typed}`).toBe(true);
}

describe("exact calculator", () => {
  it("evaluates with precedence, brackets, powers and decimals", () => {
    expect(eq(evaluate("2+3*4"), rat(14n))).toBe(true);
    expect(eq(evaluate("(2+3)*4"), rat(20n))).toBe(true);
    expect(eq(evaluate("2^10"), rat(1024n))).toBe(true);
    expect(eq(evaluate("-2^2"), rat(-4n))).toBe(true);
    expect(eq(evaluate("0.1+0.2"), parseDecimal("0.3")!)).toBe(true);
    expect(eq(evaluate("1/3+1/6"), rat(1n, 2n))).toBe(true);
    expect(eq(evaluate("7-2-1"), rat(4n))).toBe(true);
    expect(eq(evaluate("2^-2"), rat(1n, 4n))).toBe(true);
  });
  it("rejects nonsense", () => {
    expect(() => evaluate("2+")).toThrow();
    expect(() => evaluate("(2")).toThrow();
    expect(() => evaluate("1/0")).toThrow();
  });
});

describe("marking", () => {
  const q = (answer: string, extra: Partial<Question> = {}) => ({ kind: "number" as const, answer, ...extra });
  it("accepts equivalent ways of writing the same number", () => {
    expect(mark(q("1234"), "1,234").correct).toBe(true);
    expect(mark(q("0.5"), ".5").correct).toBe(true);
    expect(mark(q("0.5"), "1/2").correct).toBe(true);
    expect(mark(q("1.5"), "1 1/2").correct).toBe(true);
    expect(mark(q("25", { unit: "%" }), "25%").correct).toBe(true);
    expect(mark(q("25"), "₹25").correct).toBe(true);
    expect(mark(q("-3"), "−3").correct).toBe(true);
    expect(mark(q("60", { unit: "km/h" }), "60 km/h").correct).toBe(true);
  });
  it("rejects wrong, empty and non-numeric responses", () => {
    expect(mark(q("12"), "13").correct).toBe(false);
    expect(mark(q("12"), "").parsed).toBe(false);
    expect(mark(q("12"), "twelve").parsed).toBe(false);
    expect(mark(q("12"), "1/0").parsed).toBe(false);
    expect(mark(q("12"), "12abc").correct).toBe(false);
  });
  it("uses tolerance for estimates only", () => {
    expect(mark(q("100", { tol: 5 }), "104").correct).toBe(true);
    expect(mark(q("100", { tol: 5 }), "106").correct).toBe(false);
    expect(mark(q("100"), "100.01").correct).toBe(false);
  });
  it("requires lowest terms when asked", () => {
    expect(mark(q("3/4", { lowest: true }), "3/4").correct).toBe(true);
    expect(mark(q("3/4", { lowest: true }), "6/8").correct).toBe(false);
    expect(mark(q("3/4", { lowest: true }), "0.75").correct).toBe(false);
    expect(mark(q("2", { lowest: true }), "2").correct).toBe(true);
  });
  it("marks choices by their exact text, ignoring case and spaces at the ends", () => {
    expect(mark({ kind: "choice", answer: "Larger" }, " larger ").correct).toBe(true);
    expect(mark({ kind: "choice", answer: "Larger" }, "Smaller").correct).toBe(false);
  });
});

describe("registry", () => {
  it("has unique skill ids, valid levels and sane time allowances", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SKILLS) {
      expect(s.level).toBeGreaterThanOrEqual(1);
      expect(s.level).toBeLessThanOrEqual(15);
      expect(s.ms[0]).toBeLessThanOrEqual(s.ms[1]);
      expect(s.target).toBeGreaterThanOrEqual(1);
      expect(s.target).toBeLessThanOrEqual(10);
      expect(skill(s.id)).toBe(s);
    }
  });
  it("throws on an unknown skill", () => {
    expect(() => buildQuestion("nope", 1, 1, DEFAULT_CTX)).toThrow();
  });
});

describe("question generators", () => {
  for (const s of SKILLS) {
    it(`${s.id}: ${SEEDS} seeds x 10 difficulties are correct, deterministic and well formed`, () => {
      for (let d = 1; d <= 10; d++) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const q = buildQuestion(s.id, d, seed * 7919 + d, DEFAULT_CTX);
          verify(q);
          const again = buildQuestion(s.id, d, seed * 7919 + d, DEFAULT_CTX);
          expect(again).toEqual(q);
        }
      }
    });
    it(`${s.id}: gets harder with difficulty and varies with the seed`, () => {
      const avg = (d: number) => { let t = 0; for (let seed = 1; seed <= 80; seed++) t += buildQuestion(s.id, d, seed, DEFAULT_CTX).size; return t / 80; };
      expect(avg(10), `${s.id} size at d=10 must not be below d=1`).toBeGreaterThanOrEqual(avg(1));
      const prompts = new Set<string>();
      for (let seed = 1; seed <= 60; seed++) { const q = buildQuestion(s.id, 5, seed, DEFAULT_CTX); prompts.add(q.prompt + (q.options ? q.options.join("|") : "")); }
      expect(prompts.size, `${s.id} repeats too much at d=5`).toBeGreaterThanOrEqual(8);
    });
  }
});

describe("personalisation", () => {
  it("changes wording and currency only, never the numbers or the answer", () => {
    const applied = SKILLS.filter((s) => s.level === 10);
    for (const s of applied) {
      for (let seed = 1; seed <= 30; seed++) {
        const a = buildQuestion(s.id, 6, seed, ctxFor("IN", "12-15"));
        const b = buildQuestion(s.id, 6, seed, ctxFor("GB", "19-plus"));
        expect(b.answer, s.id).toBe(a.answer);
        expect(b.params, s.id).toEqual(a.params);
      }
    }
  });
});
