import { escapeHtml } from "@/lib/escape-html";
import { emailLogo } from "@/lib/email/logo";
import { firstName } from "@/lib/first-name";
import { eventTypeLabel, CAL_ORIGIN } from "@/lib/cal";
import type { Tables } from "@/types/database";

/**
 * The GrowQR-branded confirmation the ATTENDEE receives.
 *
 * Cal.com also emails them — that one carries the calendar invite and the
 * reschedule/cancel links, and is not replaced by this. This one carries the
 * brand, what happens next, and who to contact, which Cal's generic email
 * cannot. Both are wanted.
 *
 * Self-contained rather than getEmailShell(): that shell is the INTERNAL
 * notification style. Customer-facing mail in this repo follows the
 * logo + details card layout established by the B2B lead confirmation
 * (app/api/b2b-lead/route.ts) and the invoice emails.
 */

type Booking = Tables<"call_bookings">;

const ff =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif";

const COPY = {
  booked: {
    subject: (when: string) => `Your GrowQR call is confirmed — ${when}`,
    heading: "Your call is confirmed",
    intro: "we're looking forward to speaking with you.",
  },
  rescheduled: {
    subject: (when: string) => `Your GrowQR call has moved — ${when}`,
    heading: "Your call has been rescheduled",
    intro: "your call has a new time. Everything else stays the same.",
  },
  cancelled: {
    subject: () => "Your GrowQR call has been cancelled",
    heading: "Your call has been cancelled",
    intro: "your call is cancelled. If that wasn't intentional, you can book again any time.",
  },
} as const;

/**
 * Times are shown in the ATTENDEE's own timezone first — they are the audience,
 * and a time they have to convert themselves is a time they can get wrong. IST
 * follows in brackets only when it differs, so an Indian attendee doesn't see
 * the same thing twice.
 */
/**
 * attendee_timezone is whatever Cal put in the payload — untrusted input that
 * reaches Intl, which THROWS on an unknown zone rather than degrading. Every
 * formatter here goes through this one guard, because an unrecognised zone
 * must cost us a nicety, never the attendee's email.
 */
function safeFormat(
  date: Date,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions,
): string | null {
  try {
    return date.toLocaleString("en-IN", { ...opts, timeZone });
  } catch {
    return null;
  }
}

const IST = "Asia/Kolkata";
const isIndia = (tz: string | null) => !tz || tz === "Asia/Kolkata" || tz === "Asia/Calcutta";

function formatWhen(iso: string, timeZone: string | null): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const full = { dateStyle: "full", timeStyle: "short" } as const;
  const ist = safeFormat(date, IST, full);

  if (isIndia(timeZone)) return ist ? `${ist} IST` : date.toISOString();

  const local = safeFormat(date, timeZone as string, full);
  if (!local) return ist ? `${ist} IST` : date.toISOString();
  return `${local} (${timeZone}) · ${ist} IST`;
}

/** Short form for the subject line and preheader. */
function formatShort(iso: string, timeZone: string | null): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const opts = { dateStyle: "medium", timeStyle: "short" } as const;
  return (
    safeFormat(date, isIndia(timeZone) ? IST : (timeZone as string), opts) ??
    safeFormat(date, IST, opts) ??
    date.toISOString()
  );
}

const detailRow = (label: string, value: string, isLast = false) =>
  `<tr><td style="padding:13px 18px;${isLast ? "" : "border-bottom:1px solid #eef0f2;"}">
     <p style="margin:0 0 2px;font-family:${ff};font-size:11px;color:#8b919a;line-height:1;">${label}</p>
     <p style="margin:0;font-family:${ff};font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;word-break:break-word;">${value}</p>
   </td></tr>`;

export function buildAttendeeEmail(booking: Booking): { subject: string; html: string } {
  const status = (booking.status as keyof typeof COPY) in COPY
    ? (booking.status as keyof typeof COPY)
    : "booked";
  const copy = COPY[status];
  const cancelled = status === "cancelled";

  const label = eventTypeLabel(booking.cal_event_type_id);
  const when = formatWhen(booking.start_time, booking.attendee_timezone);
  const first = escapeHtml(firstName(booking.attendee_name));
  const shortWhen = formatShort(booking.start_time, booking.attendee_timezone);

  // Cal's own booking page is where reschedule and cancel live. Linking it
  // means the attendee never has to dig out Cal's email to change something.
  const manageUrl = `${CAL_ORIGIN}/booking/${booking.cal_uid}`;

  const nextSteps = cancelled
    ? ["Nothing further is needed from you", "Book again whenever the timing suits you"]
    : [
        "You'll receive a calendar invite with the meeting link",
        "We'll review your details before the call so we can be useful from minute one",
        "Need to change the time? Use the link below",
      ];

  const steps = nextSteps
    .map(
      (text) =>
        `<tr><td style="padding:2px 0;font-family:${ff};font-size:13px;color:#374151;line-height:1.6;">
           <span style="color:#FF6A2F;">&#8226;</span>&ensp;${escapeHtml(text)}
         </td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${escapeHtml(copy.heading)}</title>
  <style>
    @media (prefers-color-scheme:dark){
      .email-bg{background-color:#f4f5f7 !important;}
      .card{background-color:#ffffff !important;border-color:#e5e7eb !important;}
      .card-inner{background-color:#f7f8f9 !important;}
      .text-dark{color:#1a1a2e !important;}
      .text-mid{color:#6b7280 !important;}
      .text-light{color:#9ca3af !important;}
      .accent-line{background-color:#FF6A2F !important;}
    }
    @media only screen and (max-width:600px){
      .card{border-radius:8px !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

<div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${escapeHtml(cancelled ? "Your GrowQR call has been cancelled." : `Your ${label} is set for ${shortWhen}.`)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f4f5f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="card" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

      <tr>
        <td class="px" style="background-color:#ffffff;padding:24px 36px 16px;">
          ${emailLogo({ width: 120 })}
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:0 36px;">
          <div class="accent-line" style="height:2px;background-color:#FF6A2F;border-radius:1px;"></div>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <h1 class="text-dark" style="margin:0 0 4px;font-family:${ff};font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:-0.2px;">
            ${escapeHtml(copy.heading)}
          </h1>
          <p class="text-mid" style="margin:0;font-family:${ff};font-size:13.5px;color:#6b7280;line-height:1.5;">
            Hi ${first}, ${escapeHtml(copy.intro)}
          </p>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:20px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-inner" style="background-color:#f7f8f9;border-radius:8px;overflow:hidden;">
            ${detailRow(cancelled ? "Was scheduled for" : "When", escapeHtml(when))}
            ${detailRow("What", escapeHtml(label), !booking.meeting_url || cancelled)}
            ${
              booking.meeting_url && !cancelled
                ? detailRow(
                    "Where",
                    `<a href="${escapeHtml(booking.meeting_url)}" style="color:#FF6A2F;text-decoration:none;">Join the meeting</a>`,
                    true,
                  )
                : ""
            }
          </table>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <div style="height:1px;background-color:#eef0f2;"></div>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:18px 36px 0;">
          <p class="text-light" style="margin:0 0 8px;font-family:${ff};font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;">
            ${cancelled ? "What happens next" : "Before the call"}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">${steps}</table>
        </td>
      </tr>

      ${
        cancelled
          ? ""
          : `<tr>
               <td class="px" style="padding:20px 36px 0;">
                 <a href="${escapeHtml(manageUrl)}" style="display:inline-block;font-family:${ff};font-size:13px;font-weight:600;color:#FF6A2F;text-decoration:none;">
                   Reschedule or cancel &rarr;
                 </a>
               </td>
             </tr>`
      }

      <tr>
        <td class="px" style="padding:24px 36px 22px;">
          <div style="height:1px;background-color:#eef0f2;margin-bottom:16px;"></div>
          <p class="text-light" style="margin:0;font-family:${ff};font-size:11.5px;color:#9ca3af;line-height:1.6;">
            Questions? Reply to this email or contact
            <a href="mailto:support@growqr.ai" style="color:#FF6A2F;text-decoration:none;">support@growqr.ai</a>
          </p>
          <p style="margin:4px 0 0;font-family:${ff};font-size:10.5px;color:#c9cdd4;line-height:1;">
            GrowQR
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`;

  return { subject: copy.subject(shortWhen), html };
}
