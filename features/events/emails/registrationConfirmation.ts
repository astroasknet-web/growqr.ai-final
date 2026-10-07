import type { EventRow } from "../types/event";
import { firstName as getFirstName } from "@/lib/first-name";
import { emailLogo } from "@/lib/email/logo";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildRegistrationConfirmationEmail(opts: {
  attendeeName: string;
  event: EventRow;
}): { subject: string; html: string; text: string } {
  const { attendeeName, event } = opts;

  const firstName = getFirstName(attendeeName);
  const dateLine = formatDate(event.event_date);

  const timeLine =
    event.start_time && event.end_time
      ? `${event.start_time} – ${event.end_time} ${event.timezone || "IST"}`
      : event.start_time
        ? `${event.start_time} ${event.timezone || "IST"}`
        : "";

  const platformLabel =
    event.meeting_platform === "zoom"
      ? "Zoom"
      : event.meeting_platform === "google_meet"
        ? "Google Meet"
        : "Online";

  // Location line — offline: venue/city; online: platform name
  const locationLine =
    event.event_mode === "online"
      ? platformLabel
      : [event.venue, event.city, event.country].filter(Boolean).join(", ");

  const speakerLine = event.speaker_name
    ? [event.speaker_name, event.speaker_designation, event.speaker_company]
        .filter(Boolean)
        .join(" · ")
    : "";

  const subject = `You're registered: ${event.title}`;

  // Build detail rows
  const rows: { label: string; value: string; isLink?: boolean }[] = [];
  rows.push({ label: "Date", value: dateLine });
  if (timeLine) rows.push({ label: "Time", value: timeLine });
  if (locationLine) rows.push({ label: event.event_mode === "online" ? "Platform" : "Venue", value: locationLine });
  // Meeting link only for online events — sent privately via email
  if (event.event_mode === "online" && event.meeting_url) {
    rows.push({ label: "Join link", value: event.meeting_url, isLink: true });
  }
  if (speakerLine) rows.push({ label: "Speaker", value: speakerLine });

  const detailRowsHtml = rows
    .map(
      (r, i) => `<tr><td style="padding:${i === 0 ? "18px" : "0"} 20px 18px 20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">${r.label}</div>
        ${
          r.isLink
            ? `<a href="${escapeHtml(r.value)}" style="font-size:14px;color:#ff6a2f;font-weight:600;text-decoration:none;">${escapeHtml(r.value)}</a>`
            : `<div style="font-size:15px;color:#111827;font-weight:600;">${escapeHtml(r.value)}</div>`
        }
      </td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- Logo -->
        <tr><td align="center" style="padding:4px 0 20px 0;">
          ${emailLogo({ width: 132, align: "center" })}
          <p style="margin:6px 0 0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">Events</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border:1px solid #e8e6e0;border-radius:18px;padding:36px 32px;">

          <!-- Eyebrow -->
          <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#ff6a2f;">
            You&rsquo;re registered
          </p>

          <!-- Title -->
          <h1 style="margin:0 0 20px 0;font-size:26px;line-height:1.2;letter-spacing:-0.03em;color:#111827;font-weight:800;">
            ${escapeHtml(event.title)}
          </h1>

          <!-- Greeting -->
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#4b5563;">
            Hi ${escapeHtml(firstName)}, your seat is confirmed. Here are the details.
          </p>

          <!-- Details block -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="margin:0 0 28px 0;background:#faf9f5;border:1px solid #efece4;border-radius:14px;">
            ${detailRowsHtml}
          </table>

          <!-- Sign-off -->
          <div style="border-top:1px solid #ebebeb;padding-top:20px;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:700;">See you there,</p>
            <p style="margin:0 0 12px 0;font-size:14px;color:#111827;font-weight:600;">Team GrowQR</p>
          
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:16px 0 0 0;font-size:11px;color:#9ca3af;">
          © GrowQR · growqr.ai
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  const textRows = rows.map((r) => `${r.label}: ${r.value}`).join("\n");

  const text = [
    `You're registered for ${event.title}.`,
    "",
    textRows,
    "",
    "See you there,",
    "Team GrowQR",
  ].join("\n");

  return { subject, html, text };
}
