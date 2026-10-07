/**
 * Real-API smoke test for the AI answer layer — `npm run ai:smoke`.
 *
 * COSTS REAL TOKENS. Deliberately limited to the fixed 10-question set below
 * (one OpenAI call each, well under the 20-message budget) — do NOT loop this,
 * do NOT add more messages without a reason, and do NOT call it from CI on a
 * schedule. Everything that can be verified for free lives in lib/bot/*.test.ts
 * (deterministic layers, no OpenAI) and lib/ai/answer.test.ts (mocked OpenAI
 * client — grounded/conversational/decline/timeout/hallucination/no-match).
 * This script is the last tier: does the real model, against the real prompt,
 * actually behave the way those mocks assume it does.
 *
 * Calls tryAiAnswer() directly (not the full webhook route) — no Supabase
 * writes, no CRM side effects, just the model call + retrieval + guards, which
 * is exactly the surface this tier needs to verify.
 *
 * For each message, logs: latency, retrieved articles, token usage, final
 * mode, fallback reason. Retrieval accuracy and "no hallucinations" need a
 * human skimming the transcript (guards catch invented numbers/URLs/claims,
 * not subtler misattribution — see lib/ai/guards.ts's own caveat); latency and
 * handoff shape are checked automatically below.
 */
import { loadEnvConfig } from "@next/env";
import { loadAiConfig, AiConfigError } from "../lib/ai/env";
import { tryAiAnswer } from "../lib/ai/answer";

loadEnvConfig(process.cwd());

/** AI_FALLBACK_DESIGN.md §2's production budget; success criterion below. */
const LATENCY_BUDGET_MS = 3_000;

interface SmokeCase {
  question: string;
  solution?: string | null;
  audience?: string | null;
  isLiveMarket: boolean;
  /** What a human should expect, printed alongside the real result — not asserted. */
  expectation: string;
}

// Exactly the 10 messages specified for this tier. Do not add to this list
// casually — every entry here is a real, billed API call.
const CASES: SmokeCase[] = [
  { question: "What does GrowQR do?", isLiveMarket: true, expectation: "grounded, WHAT_IS_GROWQR" },
  { question: "Is pricing available?", isLiveMarket: true, expectation: "declines — pricing is never AI-owned" },
  { question: "Explain simply.", isLiveMarket: true, expectation: "conversational clarifying question" },
  { question: "I'm confused.", isLiveMarket: true, expectation: "conversational — offers help, no fact" },
  { question: "Can someone help me?", isLiveMarket: true, expectation: "conversational — offers to connect" },
  { question: "Do you support recruiters?", isLiveMarket: true, expectation: "grounded, RECRUITERS article" },
  {
    question: "Is it live in the USA?",
    isLiveMarket: false,
    // NOTE (2026-08-03): in the real router this now never reaches the AI at
    // all — lib/bot/market.ts answers it deterministically before the
    // AI-first block. This script calls tryAiAnswer() directly, bypassing
    // that check, so it's still useful as a defense-in-depth probe of the
    // prompt's own rule 4 wording — see lib/ai/answer.test.ts's "visitor
    // country in the prompt" tests for the same thing, free.
    expectation: "conversational — not-live/waitlist for the US specifically",
  },
  { question: "Tell me a joke.", isLiveMarket: true, expectation: "conversational decline, off-topic redirect" },
  { question: "Bye.", isLiveMarket: true, expectation: "conversational or declines — not a content question" },
  { question: "Thanks.", isLiveMarket: true, expectation: "conversational or declines — not a content question" },
];

interface SmokeResult {
  question: string;
  latencyMs: number;
  mode: string | null;
  rawMode: string | null;
  rejection: string | null;
  sourceIds: string[];
  /** Top-k scored KB candidates actually offered to the model this turn — same data logAiOutcome() writes to bot_events. */
  retrievedKb: { id: string; title: string; score: number }[];
  totalTokens: number | null;
  answer: string | null;
}

function fmtMs(ms: number): string {
  return `${ms}ms`;
}

async function runCase(c: SmokeCase): Promise<SmokeResult> {
  const outcome = await tryAiAnswer({
    question: c.question,
    solution: c.solution ?? null,
    audience: c.audience ?? null,
    isLiveMarket: c.isLiveMarket,
    conversationId: `ai-smoke-${Date.now()}`,
  });

  return {
    question: c.question,
    latencyMs: outcome.latencyMs,
    mode: outcome.mode,
    rawMode: outcome.rawMode ?? null,
    rejection: outcome.rejection,
    sourceIds: outcome.sourceIds,
    retrievedKb: outcome.retrievedKb ?? [],
    totalTokens: outcome.usage?.total_tokens ?? null,
    answer: outcome.answer,
  };
}

async function main(): Promise<void> {
  console.log(`\nAI smoke test — ${CASES.length} real OpenAI calls\n`);

  try {
    loadAiConfig();
  } catch (error) {
    if (error instanceof AiConfigError) {
      console.error("✗ AI is not configured:", error.problems.join("; "));
      console.error("  Run `npm run ai:health` first.");
      process.exit(1);
    }
    throw error;
  }

  if (process.env.BOT_AI_ENABLED !== "true") {
    console.error("✗ BOT_AI_ENABLED is not \"true\" — set it in .env.local to run this smoke test.");
    process.exit(1);
  }

  const results: SmokeResult[] = [];

  // Sequential, not parallel: keeps latency numbers meaningful (no queuing
  // against each other) and keeps the call rate polite.
  for (const c of CASES) {
    process.stdout.write(`  → "${c.question}" … `);
    const result = await runCase(c);
    results.push(result);
    console.log(fmtMs(result.latencyMs));
  }

  console.log("\n── Transcript (review for hallucinations / retrieval accuracy) ──\n");
  for (const r of results) {
    const top5 = r.retrievedKb
      .map((a) => `${a.title} (${a.score})`)
      .join(", ");
    console.log(`Q: ${r.question}`);
    console.log(
      `   latency=${fmtMs(r.latencyMs)} mode=${r.mode ?? "-"} raw_mode=${r.rawMode ?? "-"} ` +
        `fallback_reason=${r.rejection ?? "-"}`,
    );
    console.log(`   cited=[${r.sourceIds.join(", ") || "none"}] tokens=${r.totalTokens ?? "-"}`);
    console.log(`   top_5_articles=[${top5 || "none"}]`);
    console.log(`   answer: ${r.answer ?? "(handed off — no answer served)"}`);
    console.log("");
  }

  const answered = results.filter((r) => r.answer !== null);
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
  const maxLatency = Math.max(...results.map((r) => r.latencyMs));
  const handoffs = results.filter((r) => r.answer === null);

  console.log("── Summary ──\n");
  console.log(`  Answered: ${answered.length}/${results.length}`);
  console.log(`  Handed off: ${handoffs.length}/${results.length}${handoffs.length ? ` (${handoffs.map((h) => `"${h.question}"→${h.rejection}`).join(", ")})` : ""}`);
  console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms  Max: ${maxLatency}ms  (budget: ${LATENCY_BUDGET_MS}ms)`);
  console.log(
    avgLatency <= LATENCY_BUDGET_MS
      ? "  ✓ average latency within budget"
      : `  ✗ average latency EXCEEDS the ${LATENCY_BUDGET_MS}ms budget`,
  );

  console.log("\n  Needs a human look (not auto-checked):");
  console.log("   - Retrieval accuracy > 90%: compare `retrieved=[...]` above against each `expectation`.");
  console.log("   - No hallucinations: guards already blocked invented numbers/URLs/claims;");
  console.log("     skim `answer:` lines for a fluent-but-wrong paraphrase, which guards can't catch.");
  console.log("   - Correct handoff behavior: confirm each handoff above is one that SHOULD hand off.\n");

  console.log("  Expectations for this run:");
  for (const c of CASES) console.log(`   - "${c.question}" → ${c.expectation}`);
  console.log("");
}

main().catch((error) => {
  console.error("\n✗ ai:smoke crashed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
