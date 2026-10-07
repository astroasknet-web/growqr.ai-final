/**
 * Minimal OpenAI connectivity probe — VERIFICATION ONLY.
 *
 * Shared by app/api/debug/openai (deployment check) and scripts/ai-health.ts
 * (local check) so both exercise the SAME call path. Two separate probes would
 * let "works locally, fails on Vercel" hide in the difference between them.
 *
 * This is NOT the AI fallback layer (that's lib/ai/answer.ts) and must never
 * be called from the webhook — it measures connectivity/auth/latency with a
 * trivial fixed prompt, not answer quality. See
 * docs/salesiq-bot/AI_FALLBACK_DESIGN.md (STATUS: LIVE, SCOPE-LIMITED).
 */
import OpenAI from "openai";
import { TIMEOUT_MS, type AiConfig } from "@/lib/ai/env";

export interface ProbeUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** Coarse failure class, so a caller can tell "wrong key" from "network down". */
export type ProbeErrorKind =
  | "timeout"
  | "auth"
  | "model_not_found"
  | "rate_limit"
  | "network"
  | "format"
  | "unknown";

export type ProbeResult =
  | {
      success: true;
      model: string;
      latency_ms: number;
      usage: ProbeUsage;
      /** The model's actual reply, for the response-format assertion. */
      sample: string;
    }
  | {
      success: false;
      model: string;
      latency_ms: number;
      error: string;
      kind: ProbeErrorKind;
    };

/** Maps an SDK failure to a cause a human can act on without reading a stack. */
function classify(error: unknown): { kind: ProbeErrorKind; message: string } {
  if (error instanceof Error && error.name === "AbortError") {
    return { kind: "timeout", message: `No response within ${TIMEOUT_MS}ms — aborted.` };
  }

  const status = (error as { status?: number })?.status;
  const raw = error instanceof Error ? error.message : String(error);

  if (status === 401 || status === 403) {
    return { kind: "auth", message: `OpenAI rejected the credential (HTTP ${status}). Check OPENAI_API_KEY.` };
  }
  if (status === 404) {
    return { kind: "model_not_found", message: `Model not found or not available to this account (HTTP 404). Check OPENAI_MODEL.` };
  }
  if (status === 429) {
    return { kind: "rate_limit", message: "Rate limited or out of quota (HTTP 429). Check billing and limits." };
  }
  if (status && status >= 500) {
    return { kind: "network", message: `OpenAI server error (HTTP ${status}).` };
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(raw)) {
    return { kind: "network", message: `Could not reach OpenAI: ${raw}` };
  }
  return { kind: "unknown", message: raw };
}

/**
 * One tiny chat completion, hard-capped at TIMEOUT_MS.
 *
 * NEVER THROWS. Every failure — timeout, auth, bad model, malformed response —
 * comes back as `success: false`. That contract is what lets the debug route
 * return a clean JSON body instead of a 500, and it is the same discipline the
 * real layer will need: the webhook has a 5-second budget and a thrown error
 * would surface to a visitor as a broken bot.
 */
export async function probeOpenAi(config: AiConfig): Promise<ProbeResult> {
  const started = Date.now();
  // Belt and braces: the SDK's own `timeout` bounds the request, and the
  // AbortController bounds the whole operation including retries. The SDK
  // retries by default, so `timeout` alone can still exceed the wall clock.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new OpenAI({ apiKey: config.apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });

    const completion = await client.chat.completions.create(
      {
        model: config.model,
        // Deliberately trivial and deterministic: this measures connectivity,
        // auth, model availability and latency — not model quality. Keeping it
        // ~15 tokens keeps the check effectively free to run often.
        messages: [
          { role: "system", content: "Reply with exactly one word." },
          { role: "user", content: "Say OK." },
        ],
        max_completion_tokens: 5,
        temperature: 0,
      },
      { signal: controller.signal },
    );

    const latency_ms = Date.now() - started;
    const sample = completion.choices?.[0]?.message?.content?.trim() ?? "";

    // Response-format assertion. A 200 with no usable content means something
    // upstream changed shape, and that is a failure worth surfacing loudly
    // rather than reporting success on an empty reply.
    if (!sample) {
      return {
        success: false,
        model: config.model,
        latency_ms,
        error: "Received a response with no message content — unexpected response format.",
        kind: "format",
      };
    }

    return {
      success: true,
      // The model the API says it used, which can differ from what was asked
      // for when an alias is passed. Reporting the resolved id is the point.
      model: completion.model ?? config.model,
      latency_ms,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens ?? 0,
        completion_tokens: completion.usage?.completion_tokens ?? 0,
        total_tokens: completion.usage?.total_tokens ?? 0,
      },
      sample,
    };
  } catch (error) {
    const { kind, message } = classify(error);
    return { success: false, model: config.model, latency_ms: Date.now() - started, error: message, kind };
  } finally {
    clearTimeout(timer);
  }
}
