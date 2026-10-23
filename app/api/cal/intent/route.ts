export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/data/server";
import { createLogger } from "@/lib/log";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { sanitizeAttribution } from "@/lib/forms/schemas";
import { BOOKING_SOURCES } from "@/lib/cal";

/**
 * POST /api/cal/intent — the outbound half of the attribution bridge.
 *
 * Called by CalButton with sendBeacon immediately before the Cal tab opens, so
 * the UTM snapshot, the page the click happened on, and the modal's
 * solution/agent context are parked here under a uuid the visitor carries to
 * Cal as a hidden field. /api/cal/webhook reads them back out.
 *
 * THIS IS A PUBLIC, UNAUTHENTICATED ENDPOINT — unlike the webhook, which is
 * HMAC-signed. It is therefore the actual spam surface of this feature and is
 * rate limited accordingly. It is also write-only and returns nothing about
 * existing rows, so a scripted caller can pollute their own intent ids and
 * nothing else: an intent only ever becomes real data if a matching booking
 * later arrives from Cal, signed.
 */

const log = createLogger("cal-intent");

/** Attribution is context, never a gate — an oversized body is dropped, not stored. */
const MAX_BODY_BYTES = 4_096;

const bodySchema = z.object({
  // Generated client-side (crypto.randomUUID) so the button never waits on a
  // round trip before window.open() — an awaited fetch would cost the user
  // gesture and get the tab popup-blocked in Safari.
  intentId: z.uuid(),
  source: z.enum(BOOKING_SOURCES),
  solution: z.string().max(120).nullish(),
  agent: z.string().max(120).nullish(),
  attribution: z.unknown().optional(),
});

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

/** Server truth, same precedence as lib/forms/handler.ts — never form data. */
function countryFromRequest(req: NextRequest): string | null {
  const raw =
    process.env.FORCE_COUNTRY ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("x-country");
  const code = raw?.trim().toUpperCase() ?? "";
  return COUNTRY_CODE_REGEX.test(code) ? code : null;
}

export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "cal-intent", limit: 20, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    log.warn(`rejected oversized intent body (${raw.length} bytes)`);
    return NextResponse.json({ status: "ignored" });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "ignored" });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    // Loud, because the most likely cause is BOOKING_SOURCES drifting out of
    // step with a caller — a silent 400 here would show up months later as
    // bookings with no attribution and no explanation.
    log.warn("rejected intent:", parsed.error.issues[0]?.message ?? "invalid");
    return NextResponse.json({ status: "ignored" });
  }

  const { intentId, source, solution, agent } = parsed.data;
  const attribution = sanitizeAttribution(parsed.data.attribution);

  const admin = createAdminClient();
  const { error } = await admin.from("booking_intents").insert({
    id: intentId,
    source,
    solution: solution ?? null,
    agent: agent ?? null,
    page_path: attribution.page_path,
    country_code: countryFromRequest(req),
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    gclid: attribution.gclid,
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
  });

  if (error) {
    // 23505 = the same uuid twice (a double-click, or the beacon retried).
    // Harmless and expected: the first write already holds the context.
    if (error.code !== "23505") log.error("intent insert failed:", error);
    return NextResponse.json({ status: "ignored" });
  }

  return NextResponse.json({ status: "ok" });
}
