import { describe, expect, it } from "vitest";
import { buildAttendeeEmail } from "@/lib/cal/attendee-email";
import type { Tables } from "@/types/database";

const booking = (overrides: Partial<Tables<"call_bookings">> = {}) =>
  ({
    id: "b1",
    cal_uid: "abc123",
    email: "jane@acme.com",
    attendee_name: "Jane Sharma",
    attendee_timezone: "Asia/Calcutta",
    cal_event_type_id: 6292341,
    start_time: "2026-08-12T05:30:00Z",
    meeting_url: "https://meet.google.com/abc-defg-hij",
    status: "booked",
    is_disposable_email: false,
    ...overrides,
  }) as Tables<"call_bookings">;

describe("buildAttendeeEmail", () => {
  it("confirms a new booking", () => {
    const { subject, html } = buildAttendeeEmail(booking());
    expect(subject).toContain("Your GrowQR call is confirmed");
    expect(html).toContain("Your call is confirmed");
    expect(html).toContain("Hi Jane,");
    expect(html).toContain("https://meet.google.com/abc-defg-hij");
    // Cal owns reschedule/cancel; we link to it rather than reimplementing it.
    expect(html).toContain("https://cal.com/booking/abc123");
  });

  it("uses reschedule copy and keeps the join link", () => {
    const { subject, html } = buildAttendeeEmail(booking({ status: "rescheduled" }));
    expect(subject).toContain("has moved");
    expect(html).toContain("Your call has been rescheduled");
    expect(html).toContain("https://meet.google.com/abc-defg-hij");
  });

  it("drops the meeting link and manage link on a cancellation", () => {
    // Offering "join the meeting" for a cancelled call would be actively
    // misleading, and there is nothing left to reschedule from that page.
    const { subject, html } = buildAttendeeEmail(booking({ status: "cancelled" }));
    expect(subject).toContain("cancelled");
    expect(html).not.toContain("https://meet.google.com/abc-defg-hij");
    expect(html).not.toContain("Reschedule or cancel");
    expect(html).toContain("Was scheduled for");
  });

  it("shows a foreign attendee both their own timezone and IST", () => {
    const { html } = buildAttendeeEmail(booking({ attendee_timezone: "America/New_York" }));
    expect(html).toContain("America/New_York");
    expect(html).toContain("IST");
  });

  it("does not repeat the time twice for an Indian attendee", () => {
    const { html } = buildAttendeeEmail(booking({ attendee_timezone: "Asia/Calcutta" }));
    expect(html).not.toContain("Asia/Calcutta)");
  });

  it("survives an unrecognised timezone from Cal", () => {
    expect(() => buildAttendeeEmail(booking({ attendee_timezone: "Mars/Olympus" }))).not.toThrow();
  });

  it("escapes attendee-controlled text", () => {
    // attendee_name comes straight from a public booking form.
    const { html } = buildAttendeeEmail(
      booking({ attendee_name: "<script>alert(1)</script> Smith" }),
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
