import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/log";
import { AiConfigError, configLog, loadAiConfig } from "@/lib/ai/env";
import { probeOpenAi } from "@/lib/ai/probe";

/**
 * Diagnostic route — verifies OpenAI connectivity, credentials, model
 * selection and latency from the deployed environment.
 *
 * It exists because "works on my machine" is not evidence that Vercel has the
 * same environment variables: local reads .env.local, production reads the
 * Vercel project settings, and only this route exercises the second one.
 * Keep this even now that the AI layer (lib/ai/answer.ts) is live — it's the
 * only way to confirm OPENAI_API_KEY/BOT_AI_ENABLED actually made it into
 * Vercel before trusting the webhook's behaviour there.
 *
 * ⚠ THIS IS NOT THE AI FALLBACK LAYER. It shares no code with the webhook, is
 * never called by it, and BOT_AI_ENABLED has no effect on behaviour here — the
 * flag is only *reported*, so this route can confirm it is wired without
 * depending on live traffic to prove it. See
 * docs/salesiq-bot/AI_FALLBACK_DESIGN.md (STATUS: LIVE, SCOPE-LIMITED).
 *
 * AUTH: every call costs money, so this is not open. Locally it is free to hit.
 * In production it requires `Authorization: Bearer <CRON_SECRET>` — the same
 * contract as the cron routes — and fails closed when CRON_SECRET is unset.
 *
 * See docs/salesiq-bot/AI_HEALTHCHECK.md for usage.
 */

const log = createLogger("debug-openai");

// The probe makes a live network call; caching a connectivity check would make
// it worthless.
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  // Local/preview development: no secret needed, no production data reachable.
  if (process.env.NODE_ENV !== "production") return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    log.error("CRON_SECRET is not set — refusing to run in production");
    return false;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Step 1 — fail fast on configuration, before spending a single token.
  let config;
  try {
    config = loadAiConfig();
  } catch (error) {
    if (error instanceof AiConfigError) {
      log.error("configuration invalid", { problems: error.problems });
      return NextResponse.json(
        {
          success: false,
          stage: "config",
          error: "Environment is not configured for OpenAI.",
          problems: error.problems,
        },
        { status: 500 },
      );
    }
    throw error;
  }

  // Step 2 — the required structured log line. Never contains the key itself.
  log.info("openai config", {
    ...configLog(config),
    modelSource: config.modelSource,
    aiEnabledSource: config.aiEnabledSource,
  });

  // Step 3 — the probe. Cannot throw; timeout and every API failure come back
  // as a structured result, so this route never 500s on a live-call failure.
  const result = await probeOpenAi(config);

  if (!result.success) {
    log.error(`probe failed (${result.kind}) in ${result.latency_ms}ms: ${result.error}`);
    return NextResponse.json(
      {
        success: false,
        stage: "openai_call",
        kind: result.kind,
        error: result.error,
        model: result.model,
        latency_ms: result.latency_ms,
        aiEnabled: config.aiEnabled,
      },
      // 200: the diagnostic itself ran correctly and is reporting a finding.
      // A non-2xx here would be indistinguishable from the route being broken,
      // which is the one thing a health check must never be ambiguous about.
      { status: 200 },
    );
  }

  log.info(`probe ok: model=${result.model} latency=${result.latency_ms}ms tokens=${result.usage.total_tokens}`);

  return NextResponse.json({
    success: true,
    model: result.model,
    latency_ms: result.latency_ms,
    usage: result.usage,
    // Context beyond the requested shape, for confirming deployment wiring.
    config: {
      modelRequested: config.model,
      modelSource: config.modelSource,
      aiEnabled: config.aiEnabled,
      aiEnabledSource: config.aiEnabledSource,
    },
  });
}
