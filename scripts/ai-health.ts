/**
 * OpenAI health check — `npm run ai:health`.
 *
 * Verifies, in order, and stops at the first hard failure:
 *
 *   1. OPENAI_API_KEY exists and is plausible
 *   2. OPENAI_MODEL resolves (env or the documented default)
 *   3. BOT_AI_ENABLED is present and readable
 *   4. the OpenAI connection actually works
 *   5. latency is inside the webhook budget
 *   6. the response has the expected shape
 *
 * Exits 0 on pass, 1 on failure, so it can gate a deploy.
 *
 * Reads .env.local via @next/env, the same loader scripts/export-kb-snapshot.ts
 * uses, so local runs see exactly what `next dev` sees. To check a DEPLOYED
 * environment instead, curl the debug route — this script cannot see Vercel's
 * environment variables. See docs/salesiq-bot/AI_HEALTHCHECK.md.
 */
import { loadEnvConfig } from "@next/env";
import { AiConfigError, DEFAULT_MODEL, TIMEOUT_MS, configLog, loadAiConfig } from "../lib/ai/env";
import { probeOpenAi } from "../lib/ai/probe";

loadEnvConfig(process.cwd());

/**
 * Advisory latency ceiling. AI_FALLBACK_DESIGN.md §2 budgets 2,200ms for the
 * real call inside a 5s webhook cap; a cold probe over a slow link can exceed
 * that without the configuration being wrong, so this WARNS rather than fails.
 * Only a hard timeout (TIMEOUT_MS) is a failure.
 */
const LATENCY_WARN_MS = 2_200;

const pass = (msg: string) => console.log(`  ✓ ${msg}`);
const warn = (msg: string) => console.log(`  ⚠ ${msg}`);

function fail(msg: string, hint?: string): never {
  console.error(`  ✗ ${msg}`);
  if (hint) console.error(`\n    ${hint}`);
  console.error("\n✗ ai:health FAILED\n");
  process.exit(1);
}

async function main(): Promise<void> {
  console.log("\nOpenAI health check\n");

  // ── 1-3. Configuration ────────────────────────────────────────────────────
  let config;
  try {
    config = loadAiConfig();
  } catch (error) {
    if (error instanceof AiConfigError) {
      for (const problem of error.problems) console.error(`  ✗ ${problem}`);
      fail(
        "environment is not configured",
        "Set the missing values in .env.local — see docs/salesiq-bot/AI_HEALTHCHECK.md.",
      );
    }
    throw error;
  }

  pass(`OPENAI_API_KEY present (${config.apiKey.length} chars, not printed)`);
  pass(
    config.modelSource === "env"
      ? `OPENAI_MODEL = ${config.model}`
      : `OPENAI_MODEL unset — using default ${DEFAULT_MODEL}`,
  );
  if (config.aiEnabledSource === "unset") {
    warn("BOT_AI_ENABLED is unset — treated as false (AI fallback stays off)");
  } else {
    pass(`BOT_AI_ENABLED = ${config.aiEnabled}`);
  }

  // The AI layer is deferred by decision, so ENABLED is the surprising state.
  // Say so here rather than letting it be discovered in production.
  if (config.aiEnabled) {
    warn(
      "BOT_AI_ENABLED is true, but the AI fallback layer is NOT implemented " +
        "(AI_FALLBACK_DESIGN.md is DEFERRED). The flag currently does nothing.",
    );
  }

  console.log("\n  structured log:", JSON.stringify(configLog(config)));

  // ── 4-6. Live call ────────────────────────────────────────────────────────
  console.log(`\n  calling OpenAI (timeout ${TIMEOUT_MS}ms)…\n`);
  const result = await probeOpenAi(config);

  if (!result.success) {
    console.error(`  ✗ connection failed after ${result.latency_ms}ms [${result.kind}]`);
    const hints: Record<string, string> = {
      auth: "The key was rejected. Confirm OPENAI_API_KEY is current and not revoked.",
      model_not_found: `"${config.model}" is not available to this account. Check the model id and your account's access.`,
      rate_limit: "Rate limited or out of credit. Check billing at platform.openai.com.",
      timeout: `No response within ${TIMEOUT_MS}ms. Check network egress.`,
      network: "Could not reach the API. Check connectivity and any proxy.",
      format: "Connected, but the response shape was unexpected — the SDK or API may have changed.",
    };
    fail(result.error, hints[result.kind]);
  }

  pass(`connection OK — responded in ${result.latency_ms}ms`);
  pass(`model resolved to ${result.model}`);
  pass(`response format OK (content present: "${result.sample}")`);
  pass(
    `usage: ${result.usage.prompt_tokens} in + ${result.usage.completion_tokens} out = ${result.usage.total_tokens} tokens`,
  );

  if (result.latency_ms > LATENCY_WARN_MS) {
    warn(
      `${result.latency_ms}ms exceeds the ${LATENCY_WARN_MS}ms production budget ` +
        "(AI_FALLBACK_DESIGN.md §2). Fine for a cold probe; investigate if it persists.",
    );
  } else {
    pass(`latency within the ${LATENCY_WARN_MS}ms production budget`);
  }

  // If the model differs from what was requested, say so — an alias silently
  // resolving elsewhere is exactly the kind of thing this check exists to catch.
  if (result.model !== config.model) {
    warn(`requested "${config.model}", served by "${result.model}" — alias resolution, not an error`);
  }

  console.log("\n✓ ai:health PASSED\n");
}

main().catch((error) => {
  console.error("\n✗ ai:health crashed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
