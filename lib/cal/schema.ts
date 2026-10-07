import { z } from "zod";

/**
 * The Cal.com webhook contract, as this repo consumes it.
 *
 * Everything here is deliberately permissive about fields we don't use and
 * strict only about the handful the pipeline actually depends on. Cal ships
 * changes to its payload regularly and a schema that rejects an unfamiliar key
 * would turn a harmless addition on their side into dropped bookings on ours.
 *
 * Two shapes exist. Booking events wrap their data in `payload`; MEETING_STARTED
 * and MEETING_ENDED are FLAT, with booking fields at the top level. We don't
 * subscribe to the flat ones, but the parser must not explode if one arrives —
 * a mis-clicked trigger in the dashboard should be a no-op, not a 500 that
 * makes Cal retry forever.
 */

/** The triggers this pipeline acts on. Anything else is recorded and ignored. */
export const HANDLED_TRIGGERS = [
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
] as const;

export type HandledTrigger = (typeof HANDLED_TRIGGERS)[number];

export const isHandledTrigger = (value: string): value is HandledTrigger =>
  HANDLED_TRIGGERS.includes(value as HandledTrigger);

/** Booking lifecycle → the status column's closed vocabulary (migration 0016). */
export const TRIGGER_STATUS: Record<HandledTrigger, "booked" | "rescheduled" | "cancelled"> = {
  BOOKING_CREATED: "booked",
  BOOKING_RESCHEDULED: "rescheduled",
  BOOKING_CANCELLED: "cancelled",
};

const attendeeSchema = z.object({
  email: z.string().min(1),
  name: z.string().nullish(),
  timeZone: z.string().nullish(),
});

/**
 * A booking-question answer, deliberately typed as `unknown`.
 *
 * This started life as a union of the shapes Cal was documented to send, and
 * that was a mistake which cost a real booking: the first live delivery carried
 *
 *   "location": { "label": "location",
 *                 "value": { "value": "integrations:google:meet", "optionValue": "" } }
 *
 * — a nested object inside `value`, which the union rejected. Because zod
 * validates the whole object at once, one unrecognised answer to a question we
 * do not even read (`location`) invalidated the entire payload and the booking
 * never reached call_bookings.
 *
 * The lesson, now encoded: a schema for a third-party webhook must be strict
 * ONLY about the fields the pipeline depends on (uid, startTime, attendees) and
 * must never reject on fields it merely reads opportunistically. Booking
 * questions are entirely under Cal's control and can grow new shapes at any
 * time, so the flattening happens defensively in readResponse() instead.
 */
const responseValueSchema = z.unknown();

const bookingPayloadSchema = z.object({
  uid: z.string().min(1),
  bookingId: z.number().nullish(),
  eventTypeId: z.number().nullish(),
  title: z.string().nullish(),
  startTime: z.string().min(1),
  endTime: z.string().nullish(),
  attendees: z.array(attendeeSchema).min(1),
  organizer: z
    .object({
      name: z.string().nullish(),
      email: z.string().nullish(),
      timeZone: z.string().nullish(),
    })
    .nullish(),
  location: z.string().nullish(),
  // Both response containers are optional and both are consulted: Cal's docs
  // describe `responses`, but `userFieldsResponses` has carried custom-question
  // answers in the wild. Reading only one is how hidden-field attribution goes
  // quietly missing.
  responses: z.record(z.string(), responseValueSchema).nullish(),
  userFieldsResponses: z.record(z.string(), responseValueSchema).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  cancellationReason: z.string().nullish(),
  // Reschedule linkage. Which of these Cal populates — and whether a reschedule
  // reuses the original uid or mints a new one — is confirmed by the Phase 0
  // capture; all three are read so the link survives either behaviour.
  rescheduleUid: z.string().nullish(),
  rescheduledBy: z.string().nullish(),
  fromReschedule: z.string().nullish(),
});

export const calWebhookEnvelopeSchema = z.object({
  triggerEvent: z.string().min(1),
  createdAt: z.string().min(1),
  payload: z.unknown().optional(),
});

export type CalBookingPayload = z.infer<typeof bookingPayloadSchema>;

export type ParsedCalEvent =
  | { kind: "booking"; trigger: HandledTrigger; eventAt: Date; payload: CalBookingPayload }
  | { kind: "ignored"; trigger: string; eventAt: Date | null; reason: string };

/**
 * Parse one webhook body. Never throws: an unparseable delivery must still be
 * ledgered and answered 200, because a non-2xx only makes Cal redeliver
 * something we already can't read.
 */
export function parseCalWebhook(body: unknown): ParsedCalEvent {
  const envelope = calWebhookEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    return { kind: "ignored", trigger: "UNKNOWN", eventAt: null, reason: "envelope_invalid" };
  }

  const { triggerEvent, createdAt } = envelope.data;
  const parsedDate = new Date(createdAt);
  const eventAt = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;

  if (!isHandledTrigger(triggerEvent)) {
    return { kind: "ignored", trigger: triggerEvent, eventAt, reason: "trigger_not_handled" };
  }
  if (!eventAt) {
    // createdAt is the ordering key for the whole pipeline. Without a usable
    // one there is no safe way to decide whether this event supersedes what is
    // already stored, so the event is recorded and skipped rather than applied
    // with a guessed timestamp.
    return { kind: "ignored", trigger: triggerEvent, eventAt: null, reason: "created_at_invalid" };
  }

  const payload = bookingPayloadSchema.safeParse(envelope.data.payload);
  if (!payload.success) {
    return {
      kind: "ignored",
      trigger: triggerEvent,
      eventAt,
      reason: `payload_invalid: ${payload.error.issues[0]?.path.join(".") ?? "unknown"}`,
    };
  }

  return { kind: "booking", trigger: triggerEvent, eventAt, payload: payload.data };
}

// ── Field readers ───────────────────────────────────────────────────────────

/**
 * Read one booking-question answer, flattening every shape Cal uses and
 * consulting both response containers. Returns null for anything blank so
 * callers never have to distinguish "" from absent.
 */
export function readResponse(payload: CalBookingPayload, key: string): string | null {
  const direct = payload.responses?.[key] ?? payload.userFieldsResponses?.[key];
  if (direct != null) return flattenAnswer(direct);

  // Fall back to a normalised match. Cal DERIVES a question's identifier from
  // its label rather than taking it verbatim, and mangles it on the way: a
  // label of "Company" produced the identifier `Company`, and a label with a
  // leading space (" Source") produced `-source`. Both silently failed an
  // exact-match lookup on the first live booking — the answers were sitting
  // right there in the payload and we dropped them.
  //
  // Matching on [a-z0-9] only means Company/company, -source/source,
  // Intent/intent and teamSize/team_size all resolve to the same question, so a
  // dashboard rename can no longer quietly cost us a field.
  const wanted = normaliseKey(key);
  for (const container of [payload.responses, payload.userFieldsResponses]) {
    if (!container) continue;
    for (const [candidate, value] of Object.entries(container)) {
      if (normaliseKey(candidate) === wanted) {
        const flattened = flattenAnswer(value);
        if (flattened !== null) return flattened;
      }
    }
  }
  return null;
}

const normaliseKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Flatten whatever Cal put in an answer down to a string.
 *
 * Confirmed live shapes: `{ label, value: "text" }`, `{ label, value: [] }`, and
 * `{ label, value: { value: "integrations:google:meet", optionValue: "" } }`.
 * Bare strings are also accepted since older payloads used them. The recursion
 * is depth-limited rather than unbounded so a pathological payload cannot spin.
 */
function flattenAnswer(raw: unknown, depth = 0): string | null {
  if (raw == null || depth > 3) return null;

  if (typeof raw === "string") return raw.trim() || null;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) {
    const parts = raw.map((item) => flattenAnswer(item, depth + 1)).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof raw === "object" && "value" in raw) {
    return flattenAnswer((raw as { value: unknown }).value, depth + 1);
  }
  return null;
}

/**
 * The meeting link. `metadata.videoCallUrl` is where Cal Video lands;
 * `location` carries an external link (Meet/Zoom) when the event type is
 * configured that way, so both are consulted and only URLs are accepted.
 */
export function readMeetingUrl(payload: CalBookingPayload): string | null {
  const fromMetadata = payload.metadata?.videoCallUrl;
  if (typeof fromMetadata === "string" && /^https?:\/\//.test(fromMetadata)) return fromMetadata;
  if (payload.location && /^https?:\/\//.test(payload.location)) return payload.location;
  return null;
}

/** The booker. Cal puts the person who filled the form first; guests follow. */
export const primaryAttendee = (payload: CalBookingPayload) => payload.attendees[0];

/** The uid this booking was rescheduled FROM, whichever field Cal used. */
export const rescheduledFromUid = (payload: CalBookingPayload): string | null =>
  payload.fromReschedule ?? payload.rescheduleUid ?? null;
