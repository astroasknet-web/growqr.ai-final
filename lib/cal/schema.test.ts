import { describe, expect, it } from "vitest";
import {
  parseCalWebhook,
  primaryAttendee,
  readMeetingUrl,
  readResponse,
  rescheduledFromUid,
  TRIGGER_STATUS,
} from "@/lib/cal/schema";

/**
 * Shaped from Cal.com's documented BOOKING_CREATED example. Once the Phase 0
 * capture route has recorded a real delivery, docs/cal/WEBHOOK_CONTRACT.md is
 * written from it and this fixture is replaced with the verbatim payload.
 */
const bookingEvent = (overrides: Record<string, unknown> = {}) => ({
  triggerEvent: "BOOKING_CREATED",
  createdAt: "2026-08-04T10:00:00.000Z",
  payload: {
    uid: "abc123",
    bookingId: 4242,
    eventTypeId: 6292341,
    title: "15 Min Intro Call between GrowQR and Jane",
    startTime: "2026-08-10T09:00:00Z",
    endTime: "2026-08-10T09:15:00Z",
    attendees: [{ email: "jane@acme.com", name: "Jane Sharma", timeZone: "Asia/Kolkata" }],
    organizer: { name: "GrowQR", email: "hello@growqr.ai", timeZone: "Asia/Kolkata" },
    responses: { source: "b2b-enterprise-modal", company: "Acme Ltd" },
    metadata: { videoCallUrl: "https://app.cal.com/video/abc123" },
    ...overrides,
  },
});

describe("parseCalWebhook", () => {
  it("parses a booking event", () => {
    const parsed = parseCalWebhook(bookingEvent());
    expect(parsed.kind).toBe("booking");
    if (parsed.kind !== "booking") return;
    expect(parsed.trigger).toBe("BOOKING_CREATED");
    expect(parsed.payload.uid).toBe("abc123");
    expect(parsed.eventAt.toISOString()).toBe("2026-08-04T10:00:00.000Z");
  });

  it("maps every handled trigger to a booking status", () => {
    expect(TRIGGER_STATUS.BOOKING_CREATED).toBe("booked");
    expect(TRIGGER_STATUS.BOOKING_RESCHEDULED).toBe("rescheduled");
    expect(TRIGGER_STATUS.BOOKING_CANCELLED).toBe("cancelled");
  });

  it("ignores triggers we do not subscribe to instead of throwing", () => {
    const parsed = parseCalWebhook({ ...bookingEvent(), triggerEvent: "RECORDING_READY" });
    expect(parsed).toMatchObject({ kind: "ignored", reason: "trigger_not_handled" });
  });

  it("ignores MEETING_ENDED, whose payload is flat rather than nested", () => {
    // Not subscribed, but a mis-clicked trigger in the dashboard must be a
    // no-op rather than a 500 that makes Cal retry forever.
    const parsed = parseCalWebhook({
      triggerEvent: "MEETING_ENDED",
      createdAt: "2026-08-04T10:00:00.000Z",
      uid: "abc123",
    });
    expect(parsed.kind).toBe("ignored");
  });

  it("ignores an event with an unusable createdAt", () => {
    // createdAt is the ordering key; without one there is no safe way to decide
    // whether the event supersedes stored state.
    const parsed = parseCalWebhook({ ...bookingEvent(), createdAt: "not-a-date" });
    expect(parsed).toMatchObject({ kind: "ignored", reason: "created_at_invalid" });
  });

  it("ignores a payload with no attendees", () => {
    const parsed = parseCalWebhook(bookingEvent({ attendees: [] }));
    expect(parsed.kind).toBe("ignored");
    if (parsed.kind !== "ignored") return;
    expect(parsed.reason).toContain("payload_invalid");
  });

  it("ignores junk without throwing", () => {
    expect(parseCalWebhook(null).kind).toBe("ignored");
    expect(parseCalWebhook({ nope: true }).kind).toBe("ignored");
  });

  it("tolerates unknown extra fields Cal may add later", () => {
    const parsed = parseCalWebhook(bookingEvent({ somethingNew: { nested: true } }));
    expect(parsed.kind).toBe("booking");
  });
});

/**
 * The first REAL delivery from our own event type (2026-08-04), verbatim from
 * cal_webhook_events#8 minus the attendee's address.
 *
 * It is a regression fixture: this payload was REJECTED by the original schema
 * because `responses.location.value` is a nested object, and one unrecognised
 * answer to a question we do not even read invalidated the whole booking. It is
 * kept here exactly as Cal sent it so that can never happen again.
 */
const liveBookingCreated = {
  triggerEvent: "BOOKING_CREATED",
  createdAt: "2026-08-04T11:14:36.627Z",
  payload: {
    uid: "k7okkXK88v6HxtS74zFomu",
    eventTypeId: 6292341,
    title: "15 Min Intro Call between GrowQR and Upwise Labs",
    startTime: "2026-08-12T05:30:00Z",
    endTime: "2026-08-12T05:45:00Z",
    location: "integrations:google:meet",
    attendees: [
      {
        name: "Upwise Labs",
        email: "attendee@example.com",
        firstName: "Upwise",
        lastName: "Labs",
        timeZone: "Asia/Calcutta",
        language: { locale: "en" },
        utcOffset: 330,
        bookingSeat: null,
        phoneNumber: null,
      },
    ],
    responses: {
      name: { label: "your_name", value: "Upwise Labs" },
      email: { label: "email_address", value: "attendee@example.com" },
      notes: { label: "notes", value: "hiring" },
      guests: { label: "guests", value: [] },
      location: {
        label: "location",
        value: { value: "integrations:google:meet", optionValue: "" },
      },
    },
    metadata: { videoCallUrl: "https://meet.google.com/zbm-gkqw-msu" },
  },
};

describe("the first real delivery (regression)", () => {
  it("parses instead of rejecting on responses.location", () => {
    const parsed = parseCalWebhook(liveBookingCreated);
    expect(parsed.kind).toBe("booking");
  });

  it("reads the fields the pipeline depends on", () => {
    const parsed = parseCalWebhook(liveBookingCreated);
    if (parsed.kind !== "booking") throw new Error("expected a booking");

    expect(parsed.payload.uid).toBe("k7okkXK88v6HxtS74zFomu");
    expect(primaryAttendee(parsed.payload).email).toBe("attendee@example.com");
    expect(readResponse(parsed.payload, "notes")).toBe("hiring");
    // Nested {value:{value}} flattens rather than exploding.
    expect(readResponse(parsed.payload, "location")).toBe("integrations:google:meet");
    // An empty multi-select is absent, not an empty string.
    expect(readResponse(parsed.payload, "guests")).toBeNull();
    // The Meet link lives in metadata; top-level `location` is not a URL.
    expect(readMeetingUrl(parsed.payload)).toBe("https://meet.google.com/zbm-gkqw-msu");
  });

  it("matches Cal's mangled identifiers (regression)", () => {
    // Cal DERIVES identifiers from labels: "Company" became `Company`, and a
    // label with a leading space (" Source") became `-source`. On the second
    // live booking the answers were present and were silently dropped by an
    // exact-match lookup, costing Company, Segment, Audience, Business_Unit,
    // Product_Interest, Region and Country on the Zoho Lead at once.
    const parsed = parseCalWebhook({
      ...liveBookingCreated,
      payload: {
        ...liveBookingCreated.payload,
        responses: {
          Company: { label: "Company", value: "test company name", isHidden: false },
          Intent: { label: "Intent", value: "fbf5c8b0-1a0d-4ae5-abb1-7881942323c8", isHidden: true },
          "-source": { label: " Source", value: "b2b-enterprise-modal", isHidden: true },
          teamSize: { label: " Team size", value: "201–1,000", isHidden: false },
        },
      },
    });
    if (parsed.kind !== "booking") throw new Error("expected a booking");

    expect(readResponse(parsed.payload, "company")).toBe("test company name");
    expect(readResponse(parsed.payload, "intent")).toBe("fbf5c8b0-1a0d-4ae5-abb1-7881942323c8");
    expect(readResponse(parsed.payload, "source")).toBe("b2b-enterprise-modal");
    // teamSize/team_size normalise to the same question either way.
    expect(readResponse(parsed.payload, "teamSize")).toBe("201–1,000");
    expect(readResponse(parsed.payload, "team_size")).toBe("201–1,000");
  });

  it("returns null for booking questions that do not exist yet", () => {
    // source/intent/company/teamSize are absent until the hidden questions are
    // added in the Cal dashboard — that must degrade, never throw.
    const parsed = parseCalWebhook(liveBookingCreated);
    if (parsed.kind !== "booking") throw new Error("expected a booking");
    for (const key of ["source", "intent", "company", "teamSize"]) {
      expect(readResponse(parsed.payload, key)).toBeNull();
    }
  });
});

describe("readResponse", () => {
  const payloadOf = (overrides: Record<string, unknown>) => {
    const parsed = parseCalWebhook(bookingEvent(overrides));
    if (parsed.kind !== "booking") throw new Error("expected a booking");
    return parsed.payload;
  };

  it("reads a bare string answer", () => {
    expect(readResponse(payloadOf({}), "source")).toBe("b2b-enterprise-modal");
  });

  it("reads a { label, value } answer", () => {
    const payload = payloadOf({ responses: { company: { label: "Company", value: "Acme" } } });
    expect(readResponse(payload, "company")).toBe("Acme");
  });

  it("reads a multi-select array answer", () => {
    const payload = payloadOf({ responses: { topics: ["hiring", "onboarding"] } });
    expect(readResponse(payload, "topics")).toBe("hiring, onboarding");
  });

  it("falls back to userFieldsResponses", () => {
    // Cal's docs describe `responses`, but custom answers have appeared under
    // userFieldsResponses in the wild. Reading only one silently loses UTMs.
    const payload = payloadOf({ responses: {}, userFieldsResponses: { intent: "abc-uuid" } });
    expect(readResponse(payload, "intent")).toBe("abc-uuid");
  });

  it("returns null for blank and missing answers alike", () => {
    const payload = payloadOf({ responses: { company: "   ", other: null } });
    expect(readResponse(payload, "company")).toBeNull();
    expect(readResponse(payload, "other")).toBeNull();
    expect(readResponse(payload, "absent")).toBeNull();
  });
});

describe("field readers", () => {
  const payloadOf = (overrides: Record<string, unknown> = {}) => {
    const parsed = parseCalWebhook(bookingEvent(overrides));
    if (parsed.kind !== "booking") throw new Error("expected a booking");
    return parsed.payload;
  };

  it("prefers metadata.videoCallUrl for the meeting link", () => {
    expect(readMeetingUrl(payloadOf())).toBe("https://app.cal.com/video/abc123");
  });

  it("falls back to a URL location (Meet/Zoom event types)", () => {
    const payload = payloadOf({ metadata: {}, location: "https://meet.google.com/xyz" });
    expect(readMeetingUrl(payload)).toBe("https://meet.google.com/xyz");
  });

  it("ignores a non-URL location such as 'inPerson'", () => {
    expect(readMeetingUrl(payloadOf({ metadata: {}, location: "inPerson" }))).toBeNull();
  });

  it("takes the first attendee as the booker", () => {
    const payload = payloadOf({
      attendees: [
        { email: "booker@acme.com", name: "Booker" },
        { email: "guest@acme.com", name: "Guest" },
      ],
    });
    expect(primaryAttendee(payload).email).toBe("booker@acme.com");
  });

  it("reads the reschedule link from whichever field Cal populates", () => {
    expect(rescheduledFromUid(payloadOf({ fromReschedule: "old-uid" }))).toBe("old-uid");
    expect(rescheduledFromUid(payloadOf({ rescheduleUid: "old-uid-2" }))).toBe("old-uid-2");
    expect(rescheduledFromUid(payloadOf())).toBeNull();
  });
});
