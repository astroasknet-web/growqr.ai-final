import { describe, expect, it } from "vitest";
import { GOLDEN_CASES, type GoldenCase } from "@/lib/bot/golden-set";
import { detectAct } from "@/lib/bot/smalltalk";
import { detectIntent, isStrongHumanRequest } from "@/lib/bot/intents";
import { findAnswer, ALIASES } from "@/lib/bot/answers";
import snapshot from "@/lib/bot/kb-snapshot.json";

/**
 * The measurement harness for bot quality.
 *
 * Two rules, and the second is the one that makes this worth having:
 *
 *   1. A case marked passing may NEVER regress. This is the safety net that
 *      lets the scoring rewrite happen at all.
 *   2. A case marked `passing: false` that starts passing FAILS the suite,
 *      demanding promotion. Without this the file would rot: gaps would get
 *      quietly fixed, the flag would stay false, and the pass rate would stop
 *      meaning anything.
 */

type Outcome =
  | { kind: "act"; value: string }
  | { kind: "intent"; value: string }
  | { kind: "article"; value: string }
  | { kind: "fallback"; value: "true" };

/**
 * Mirrors routeMessage's precedence for the deterministic layers this harness
 * can exercise without a network call: conversational act → keyword intent
 * (change_email/human_request/demo_request/pricing only, since 2026-08-03 —
 * see lib/bot/intents.ts) → Answer Hub → fallback. Deliberately does NOT
 * include the AI-first layer that now sits between keyword intent and the
 * Answer Hub in the real router — that call hits OpenAI, which does not
 * belong in a unit test — so a case that expects `fallback` here may well be
 * answered by AI in production; this harness only measures the deterministic
 * floor.
 *
 * Deliberately NOT a call to routeMessage: that writes to Supabase on the
 * fallback path (logUnanswered) and schedules after() hooks, neither of which
 * belongs in a unit test. Kept in step with the router by the precedence test
 * at the bottom of this file.
 */
function classify(testCase: GoldenCase): Outcome {
  const context = testCase.page ? { solution: testCase.page } : {};

  const act = detectAct(testCase.text);
  if (act) return { kind: "act", value: act };

  const intent = detectIntent(testCase.text);
  if (intent !== "fallback") return { kind: "intent", value: intent };

  const answer = findAnswer(testCase.text, context);
  if (answer) return { kind: "article", value: answer.articleId };

  return { kind: "fallback", value: "true" };
}

function expectedOutcome(testCase: GoldenCase): Outcome {
  const { expect: e } = testCase;
  if ("act" in e) return { kind: "act", value: e.act };
  if ("intent" in e) return { kind: "intent", value: e.intent };
  if ("article" in e) return { kind: "article", value: e.article };
  return { kind: "fallback", value: "true" };
}

const matches = (a: Outcome, b: Outcome) => a.kind === b.kind && a.value === b.value;

const titleOf = (id: string) =>
  (snapshot.articles as Array<{ id: string; title: string }>).find((a) => a.id === id)?.title ?? id;

const describeOutcome = (o: Outcome) =>
  o.kind === "article" ? `article "${titleOf(o.value)}"` : `${o.kind} ${o.value}`;

describe("golden set", () => {
  const expectedToPass = GOLDEN_CASES.filter((c) => c.passing !== false);
  const knownGaps = GOLDEN_CASES.filter((c) => c.passing === false);

  it("has a meaningful number of cases", () => {
    // The set is a measurement instrument; too few cases and the pass rate is
    // noise rather than signal.
    expect(GOLDEN_CASES.length).toBeGreaterThanOrEqual(150);
  });

  it("has no duplicate phrasings", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const c of GOLDEN_CASES) {
      const key = `${c.page ?? ""}::${c.text.toLowerCase()}`;
      if (seen.has(key)) duplicates.push(c.text);
      seen.add(key);
    }
    expect(duplicates).toEqual([]);
  });

  it("every article id in the set exists in the KB snapshot", () => {
    const ids = new Set((snapshot.articles as Array<{ id: string }>).map((a) => a.id));
    const unknown = GOLDEN_CASES.flatMap((c) =>
      "article" in c.expect && !ids.has(c.expect.article) ? [`${c.text} → ${c.expect.article}`] : [],
    );
    expect(unknown).toEqual([]);
  });

  describe("no regressions", () => {
    it.each(expectedToPass.map((c) => [c.text, c] as const))(
      "%s",
      (_text, testCase) => {
        const got = classify(testCase);
        const want = expectedOutcome(testCase);
        expect(
          matches(got, want),
          `expected ${describeOutcome(want)}, got ${describeOutcome(got)}`,
        ).toBe(true);
      },
    );
  });

  it("known gaps are still gaps (promote them when fixed)", () => {
    const nowPassing = knownGaps.filter((c) => matches(classify(c), expectedOutcome(c)));
    expect(
      nowPassing.map((c) => c.text),
      "these now produce the right answer — remove `passing: false` from lib/bot/golden-set.ts " +
        "so the pass rate reflects the improvement",
    ).toEqual([]);
  });

  it("reports the current pass rate", () => {
    const passing = GOLDEN_CASES.filter((c) => matches(classify(c), expectedOutcome(c)));
    const rate = (passing.length / GOLDEN_CASES.length) * 100;
    // eslint-disable-next-line no-console
    console.log(
      `\n  golden set: ${passing.length}/${GOLDEN_CASES.length} (${rate.toFixed(1)}%), ` +
        `${knownGaps.length} known gaps\n`,
    );
    expect(rate).toBeGreaterThan(0);
  });
});

describe("alias hygiene", () => {
  // The alias layer short-circuits scoring, so a careless entry silently
  // overrides a better answer. These are the rules kb-aliases.json documents
  // for itself, enforced.

  it("every alias key is a real article id", () => {
    const ids = new Set((snapshot.articles as Array<{ id: string }>).map((a) => a.id));
    const unknown = [...new Set(ALIASES.map((a) => a.id))].filter((id) => !ids.has(id));
    expect(unknown, "stale alias keys — prune them or restore the article").toEqual([]);
  });

  it("no phrase is claimed by two different articles", () => {
    const owners = new Map<string, string[]>();
    for (const { id, phrase } of ALIASES) {
      owners.set(phrase, [...(owners.get(phrase) ?? []), id]);
    }
    const conflicts = [...owners.entries()]
      .filter(([, ids]) => new Set(ids).size > 1)
      .map(([phrase]) => phrase);
    expect(conflicts, "an ambiguous alias makes the answer depend on file order").toEqual([]);
  });

  it("single-word aliases are distinctive, never generic", () => {
    // A one-word alias only matches a whole message, but it still outranks
    // every scored article, so it must be a proper noun or product term.
    const generic = ALIASES.filter(
      ({ phrase }) =>
        !phrase.includes(" ") &&
        !/^(rq|q-|vera|nova|mira|scout|sage|kai|lyra)/.test(phrase),
    ).map((a) => a.phrase);
    expect(generic).toEqual([]);
  });

  it("an alias never hijacks a longer, more specific question", () => {
    // Regression: "who are your customers" matched the alias "who are you" by
    // plain substring and answered with the product definition.
    expect(findAnswer("who are your customers")).toBeNull();
    // And the specific RQ question must beat the bare "rq" alias.
    expect(findAnswer("how to improve rq")?.articleId).toBe("227090000000032005");
  });
});

describe("live-bug guards", () => {
  // Both of these shipped to production. They get their own named tests so a
  // regression reads as the bug it is, not as an anonymous golden-set row.

  it("a question about the AI agents never escalates to a human", () => {
    for (const q of [
      "what agents do you have",
      "list your ai agents",
      "tell me about your agents",
      "ai agent features",
      "how many agents are there",
      "what does vera do",
      // Regression 2026-08-02: live-confirmed — a bare "agents" (no qualifier
      // word) escalated straight to a human instead of reaching the AI/KB
      // layer, because bare "agent" was in the human_request keyword list and
      // the PRODUCT_AGENT veto only covers a QUALIFIED "what/list/your agents"
      // phrasing, not this one. Fixed by removing the bare keyword entirely.
      "agents",
      "agent",
    ]) {
      expect(detectIntent(q), `"${q}" must not be human_request`).not.toBe("human_request");
    }
  });

  it("still escalates a genuine ask for a person", () => {
    for (const q of [
      "talk to a human",
      "talk to an agent",
      "customer support",
      "i want a real person",
      "talk to our team",
    ]) {
      expect(detectIntent(q), `"${q}" must reach a human`).toBe("human_request");
    }
  });

  it("a weak human-request signal never auto-forwards", () => {
    // Live-confirmed 2026-08-02: "need help about the pricing" auto-forwarded
    // to a human with no chip and no chance to decline, because "need help"
    // sits in the human_request keyword list alongside genuine "talk to a
    // human" phrasing. detectIntent still classifies these as human_request
    // (nothing else claims the keyword), but routeMessage must only forward
    // for a STRONG signal — this asserts the weak ones stay non-strong so the
    // router offers the handoff chip instead of forcing it.
    for (const q of [
      "need help about the pricing",
      "i need help",
      "need help",
      "support",
      "human",
      "confused",
      "that was wrong",
      "not helpful",
    ]) {
      expect(detectIntent(q), `"${q}" must still classify as human_request`).toBe("human_request");
      expect(isStrongHumanRequest(q), `"${q}" must NOT auto-forward`).toBe(false);
    }
  });

  it("a genuine ask for a person is a strong signal and auto-forwards", () => {
    for (const q of ["talk to a human", "talk to an agent", "customer support", "i want a real person"]) {
      expect(isStrongHumanRequest(q), `"${q}" must auto-forward`).toBe(true);
    }
  });

  it("a farewell is never treated as content", () => {
    for (const q of ["bye", "goodbye", "see you later", "thanks bye", "that's all"]) {
      expect(detectAct(q), `"${q}" must be a farewell`).toBe("farewell");
    }
  });

  it("an act never swallows a real question", () => {
    // The whole risk of the smalltalk layer: "thanks, what is growqr" must
    // reach the KB, not the acknowledgement branch.
    for (const q of [
      "thanks, what is growqr",
      "hi, how much does it cost",
      "ok but what is the refund policy",
      "hello, book a demo",
    ]) {
      expect(detectAct(q), `"${q}" carries a real question`).toBeNull();
    }
  });
});

describe("no em dash reaches a visitor", () => {
  it("no KB article contains one", () => {
    const offenders = (snapshot.articles as Array<{ title: string; text: string }>)
      .filter((a) => a.title.includes("—") || a.text.includes("—"))
      .map((a) => a.title);
    expect(offenders).toEqual([]);
  });
});
