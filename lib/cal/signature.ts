import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verification of Cal.com's `x-cal-signature-256` webhook signature.
 *
 * Cal signs the COMPLETE raw request body with HMAC-SHA256 using the secret
 * configured on that webhook, and sends the digest hex-encoded. Unlike
 * lib/bot/signature.ts — which has to probe algorithm variants because Zoho
 * documents the mechanism but never the digest or encoding — Cal documents
 * both, so this is a single deterministic check with no fallbacks.
 *
 * hex/HMAC-SHA256 was confirmed against a real delivery by the Phase 0 capture
 * route, which probed hex AND base64 and logged which matched. That route has
 * since been deleted (it was unauthenticated and accepted anything by design).
 * If Cal ever switches to base64, the fix is the one word on the digest line
 * below — not a fallback chain, which would only make a wrong guess look like
 * a working one.
 */

export interface CalSignatureResult {
  ok: boolean;
  /** Why verification failed or could not be attempted — logged, never returned to the caller. */
  reason?: "no_secret_configured" | "no_signature_header" | "mismatch";
}

/**
 * @param rawBody the request body EXACTLY as received. Re-serialising parsed
 *   JSON changes key order and whitespace, which changes the digest and fails
 *   every signature — the single most common way this integration breaks.
 */
export function verifyCalSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): CalSignatureResult {
  // Fail closed. An unset secret must never mean "skip the check" — that would
  // turn a misconfigured deploy into an open, unauthenticated write endpoint.
  // Same posture as CRON_SECRET in app/api/cron/crm-sync/route.ts.
  if (!secret) return { ok: false, reason: "no_secret_configured" };
  if (!signature) return { ok: false, reason: "no_signature_header" };

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  // timingSafeEqual throws on length mismatch, so the lengths are compared
  // first. That comparison leaks only the length of a digest whose length is
  // fixed and public, so it costs nothing.
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return { ok: false, reason: "mismatch" };

  return timingSafeEqual(received, computed) ? { ok: true } : { ok: false, reason: "mismatch" };
}
