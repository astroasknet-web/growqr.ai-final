export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { createHash } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createLogger } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import { syncLeadToZoho } from "@/lib/crm/sync";
import { verifyCalSignature } from "@/lib/cal/signature";
import { isDisposableEmail } from "@/lib/cal/disposable";
import { sendBookingNotification } from "@/lib/cal/notify";
import { isKnownSource } from "@/lib/cal";
import {
  parseCalWebhook,
  primaryAttendee,
  readMeetingUrl,
  readResponse,
  rescheduledFromUid,
  TRIGGER_STATUS,
  type CalBookingPayload,
  type HandledTrigger,
} from "@/lib/cal/schema";

/**
 * POST /api/cal/webhook — the Cal.com booking receiver.
 *
 * Contract with Cal: answer 200 to anything we have durably recorded. A 4xx or
 * 5xx makes Cal redeliver, and redelivering something already stored is pure
 * noise — worse, it can turn one malformed payload into an indefinite retry
 * loop. The only non-200 here is 401 for a failed signature, which is exactly
 * the case where we WANT the sender to stop.
 *
 * The response path does the minimum: verify, ledger, join, upsert, 200.
 * Notification and Zoho sync run in after(), off the response, with the
 * 15-minute crm-sync cron as the durability layer behind both — the same
 * fast-path/reconciliation split every other lead source in this repo uses.
 */

const log = createLogger("cal-webhook");

/** Bodies this large are not Cal deliveries; refusing early bounds memory. */
const MAX_BODY_BYTES = 1_000_000;
/**
 * How long a claimed-but-unfinished ledger row is assumed to still be in
 * flight. Past this, a retry is allowed to reprocess it: every downstream step
 * is idempotent, so a duplicate attempt is cheap while a permanently stranded
 * booking is not.
 */
const INFLIGHT_MS = 2 * 60_000;

interface LedgerClaim {
  id: number;
  /** False when another delivery of the same body already did the work. */
  shouldProcess: boolean;
}

/**
 * Claim this delivery. The unique constraint on dedupe_key — sha256 of the raw
 * body — is the entire retry guard, and it lives in the database precisely so
 * that two concurrent deliveries of the same body cannot both pass it, which a
 * read-then-write in this file could not prevent.
 */
async function claimDelivery(params: {
  dedupeKey: string;
  triggerEvent: string;
  calUid: string | null;
  eventAt: Date | null;
  signatureOk: boolean;
  payload: unknown;
}): Promise<LedgerClaim | null> {
  const admin = createAdminClient();

  const { data: inserted, error } = await admin
    .from("cal_webhook_events")
    .insert({
      dedupe_key: params.dedupeKey,
      trigger_event: params.triggerEvent,
      cal_uid: params.calUid,
      event_at: params.eventAt?.toISOString() ?? null,
      signature_ok: params.signatureOk,
      payload: (params.payload ?? {}) as never,
    })
    .select("id")
    .maybeSingle();

  if (inserted) return { id: inserted.id, shouldProcess: true };

  // 23505 = unique_violation: we have seen these exact bytes before.
  if (error?.code !== "23505") {
    log.error("ledger insert failed:", error);
    return null;
  }

  const { data: existing } = await admin
    .from("cal_webhook_events")
    .select("id, processed_at, received_at")
    .eq("dedupe_key", params.dedupeKey)
    .maybeSingle();

  if (!existing) return null;
  if (existing.processed_at) return { id: existing.id, shouldProcess: false };

  const stranded = Date.now() - new Date(existing.received_at).getTime() > INFLIGHT_MS;
  if (stranded) {
    log.warn(`ledger#${existing.id} was claimed but never finished — reprocessing`);
  }
  return { id: existing.id, shouldProcess: stranded };
}

/**
 * Rejoin the two halves of the booking: what Cal collected, and the context we
 * parked in booking_intents before the visitor left our site. A missing intent
 * is normal and harmless (blocked beacon, shared link) — every attribution
 * column simply stays null, and deriveLeadSource() resolves "Website", the same
 * graceful degradation bot_leads already relies on.
 */
async function loadIntent(intentId: string | null) {
  if (!intentId) return null;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("booking_intents")
    .select("*")
    .eq("id", intentId)
    .maybeSingle();

  if (error) {
    log.error(`intent ${intentId} lookup failed:`, error);
    return null;
  }
  if (!data) {
    log.warn(`intent ${intentId} not found — booking keeps null attribution`);
    return null;
  }

  // Observational only: makes "clicked but never booked" measurable.
  await admin
    .from("booking_intents")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", intentId);

  return data;
}

/** UUID shape check, so a junk hidden-field value never reaches a uuid column. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildBookingRow(params: {
  trigger: HandledTrigger;
  payload: CalBookingPayload;
  eventAt: Date;
  intent: Awaited<ReturnType<typeof loadIntent>>;
}) {
  const { trigger, payload, eventAt, intent } = params;
  const attendee = primaryAttendee(payload);
  const status = TRIGGER_STATUS[trigger];
  const email = attendee.email.trim().toLowerCase();

  // The hidden `source` question is the one attribution signal that does not
  // depend on the beacon having landed, so it is read from the payload first
  // and only falls back to the intent row.
  const responseSource = readResponse(payload, "source");
  const source = isKnownSource(responseSource) ? responseSource : (intent?.source ?? null);
  if (responseSource && !isKnownSource(responseSource)) {
    // Loud on purpose: an unrecognised slug means BOOKING_SOURCES and the Cal
    // dashboard have drifted apart, which would otherwise show up months later
    // as a silent hole in the funnel report.
    log.warn(`unknown booking source "${responseSource}" on ${payload.uid}`);
  }

  return {
    last_trigger_event: trigger,
    status,
    email,
    attendee_name: attendee.name?.trim() || email.split("@")[0] || email,
    attendee_timezone: attendee.timeZone ?? null,
    company: readResponse(payload, "company"),
    team_size: readResponse(payload, "teamSize") ?? readResponse(payload, "team_size"),
    title: payload.title ?? null,
    start_time: payload.startTime,
    end_time: payload.endTime ?? null,
    meeting_url: readMeetingUrl(payload),
    cal_booking_id: payload.bookingId ?? null,
    cal_event_type_id: payload.eventTypeId ?? null,
    rescheduled_from_uid: rescheduledFromUid(payload),
    // booked_at is Cal's own creation time on the FIRST event; the SQL function
    // never overwrites it afterwards, so a reschedule cannot destroy the
    // original time-to-book measurement.
    booked_at: eventAt.toISOString(),
    rescheduled_at: trigger === "BOOKING_RESCHEDULED" ? eventAt.toISOString() : null,
    cancelled_at: trigger === "BOOKING_CANCELLED" ? eventAt.toISOString() : null,
    cancellation_reason: payload.cancellationReason ?? null,
    is_disposable_email: isDisposableEmail(email),
    responses: payload.responses ?? payload.userFieldsResponses ?? null,
    raw_payload: payload,
    intent_id: intent?.id ?? null,
    source,
    country_code: intent?.country_code ?? null,
    utm_source: intent?.utm_source ?? null,
    utm_medium: intent?.utm_medium ?? null,
    utm_campaign: intent?.utm_campaign ?? null,
    utm_term: intent?.utm_term ?? null,
    utm_content: intent?.utm_content ?? null,
    gclid: intent?.gclid ?? null,
    landing_page: intent?.landing_page ?? null,
    referrer: intent?.referrer ?? null,
    page_path: intent?.page_path ?? null,
  };
}

async function finishLedger(id: number, error?: string) {
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("cal_webhook_events")
    .update({ processed_at: new Date().toISOString(), error: error ?? null })
    .eq("id", id);
  if (updateError) log.error(`ledger#${id} completion write failed:`, updateError);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (rawBody.length > MAX_BODY_BYTES) {
    log.error(`rejected oversized body (${rawBody.length} bytes)`);
    return NextResponse.json({ status: "ignored", reason: "too_large" });
  }

  const signature = req.headers.get("x-cal-signature-256");
  const verdict = verifyCalSignature(rawBody, signature, process.env.CAL_WEBHOOK_SECRET);

  if (!verdict.ok) {
    // Only UNSIGNED traffic is rate limited. A genuine Cal delivery always
    // carries a valid signature and is therefore never throttled, while a
    // flood of forged requests can't turn the ledger into unbounded storage.
    const limit = await rateLimit(req, { key: "cal-webhook-unsigned", limit: 10, windowMs: 60_000 });
    log.error(`signature rejected (${verdict.reason}) — throttled=${!limit.ok}`);
    if (limit.ok) {
      // Recorded even though rejected: a forged or misconfigured sender should
      // be visible in the data, not merely bounced at the door.
      await claimDelivery({
        dedupeKey: createHash("sha256").update(rawBody).digest("hex"),
        triggerEvent: "UNVERIFIED",
        calUid: null,
        eventAt: null,
        signatureOk: false,
        payload: { rejected: verdict.reason, bodyLength: rawBody.length },
      });
    }
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.error("signed body was not valid JSON");
    return NextResponse.json({ status: "ignored", reason: "invalid_json" });
  }

  const parsed = parseCalWebhook(body);
  const dedupeKey = createHash("sha256").update(rawBody).digest("hex");
  const calUid = parsed.kind === "booking" ? parsed.payload.uid : null;

  const claim = await claimDelivery({
    dedupeKey,
    triggerEvent: parsed.trigger,
    calUid,
    eventAt: parsed.eventAt,
    signatureOk: true,
    payload: body,
  });

  if (!claim) {
    // The ledger is the only thing standing between a retry and duplicate work,
    // so if it is unavailable the safe move is to let Cal retry later. This is
    // the one path that deliberately returns 5xx.
    return NextResponse.json({ error: "ledger_unavailable" }, { status: 503 });
  }
  if (!claim.shouldProcess) {
    log.info(`duplicate delivery ${dedupeKey.slice(0, 12)}… ignored`);
    return NextResponse.json({ status: "duplicate" });
  }

  if (parsed.kind === "ignored") {
    log.info(`ignored ${parsed.trigger}: ${parsed.reason}`);
    await finishLedger(claim.id, parsed.reason);
    return NextResponse.json({ status: "ignored", reason: parsed.reason });
  }

  const { trigger, payload, eventAt } = parsed;

  const rawIntent = readResponse(payload, "intent");
  const intent = await loadIntent(rawIntent && UUID_RE.test(rawIntent) ? rawIntent : null);

  const admin = createAdminClient();
  const { data: applied, error: applyError } = await admin
    .rpc("apply_cal_booking", {
      p_cal_uid: payload.uid,
      p_event_at: eventAt.toISOString(),
      p_booking: buildBookingRow({ trigger, payload, eventAt, intent }) as never,
      // Cal mints a NEW uid on reschedule (confirmed live 2026-08-04) and names
      // the previous one here. Passing it lets the function move the existing
      // row onto the new uid instead of inserting a duplicate that would
      // double-count, strand the old booking as still 'booked', and create a
      // second follow-up Task in Zoho.
      p_supersedes: rescheduledFromUid(payload) ?? undefined,
    })
    .maybeSingle();

  if (applyError || !applied?.booking_id) {
    log.error(`apply_cal_booking failed for ${payload.uid}:`, applyError);
    await finishLedger(claim.id, applyError?.message ?? "apply_failed");
    // The delivery is durably recorded in the ledger with its full payload, so
    // a 200 loses nothing: the booking can be replayed from there.
    return NextResponse.json({ status: "error", reason: "apply_failed" });
  }

  const bookingId = applied.booking_id;

  if (!applied.applied) {
    // The ordering guard refused it: this event is older than what the row
    // already holds (a retried CREATED arriving after a CANCELLED, typically).
    log.info(`${payload.uid} ${trigger} superseded by newer state — not applied`);
    await finishLedger(claim.id, "superseded");
    return NextResponse.json({ status: "superseded" });
  }

  log.info(
    `${payload.uid} ${trigger} applied (booking=${bookingId}, events=${applied.events_count}, new=${applied.is_new})`,
  );

  after(async () => {
    // Notification first, and independent of the CRM: being told a call was
    // booked must not depend on Zoho being reachable or CRM_SYNC_ENABLED being
    // on. Its own retry lane lives in the crm-sync cron.
    try {
      await sendBookingNotification(bookingId);
    } catch (error) {
      log.error(`${bookingId} notification failed:`, error);
    }

    try {
      await syncLeadToZoho("call_bookings", bookingId);
    } catch (error) {
      log.error(`${bookingId} crm sync hook failed:`, error);
    }

    await finishLedger(claim.id);
  });

  return NextResponse.json({ status: "ok" });
}

/** Liveness check, so a deploy can be confirmed before pointing Cal at it. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    route: "cal/webhook",
    secretConfigured: Boolean(process.env.CAL_WEBHOOK_SECRET),
  });
}
