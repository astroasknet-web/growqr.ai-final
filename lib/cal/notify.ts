import { createAdminClient } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { getEmailShell } from "@/lib/email/shell";
import { escapeHtml } from "@/lib/escape-html";
import { createLogger } from "@/lib/log";
import { countryDisplayName } from "@/lib/crm/derive";
import { eventTypeLabel, isB2cSource } from "@/lib/cal";
import { buildAttendeeEmail } from "@/lib/cal/attendee-email";
import type { Tables } from "@/types/database";

/**
 * Internal team notification for a Cal.com booking.
 *
 * DELIBERATELY INDEPENDENT OF THE CRM. bot_leads sends its notification from
 * inside the afterSync hook, which means no Lead, no email. That is right for a
 * chat qualification — the Lead is the artifact. It is wrong here: a booked call
 * is a commitment on somebody's calendar, and the team has to hear about it even
 * when Zoho is unreachable or CRM_SYNC_ENABLED is off. So this is driven by the
 * webhook's after() hook directly, with its own reconciliation lane in the
 * crm-sync cron (retryPendingBookingNotifications) rather than the afterSync
 * filter, which only ever visits rows that already reached 'synced'.
 *
 * Guarded by notifications_count < events_count, not a boolean: a booking has a
 * lifecycle (booked → rescheduled → cancelled) and a boolean would send once and
 * silently swallow the cancellation.
 *
 * Two independent sends live here: the internal team notification, and the
 * branded attendee confirmation added in migration 0019 (sendAttendeeConfirmation
 * below). They have separate counters and separate try/catch blocks so a bounce
 * on one cannot suppress the other.
 *
 * Cal sends its own confirmation, calendar invite and reminders. Ours is
 * deliberately additive rather than a replacement, and is skipped entirely for
 * disposable addresses.
 */

const log = createLogger("cal-notify");

const FROM_EMAIL = "GrowQR | Calls <hello@growqr.ai>";
const NOTIFY_TO = ["sahil@growqr.ai", "support@growqr.ai"];

/**
 * CC'd on business bookings only — the seeker waitlist is a consumer flow and
 * does not need to reach the B2B desk.
 *
 * Gated on isB2cSource rather than isB2bSource on purpose: those are NOT
 * inverses. A booking whose source never arrived (blocked beacon, shared link)
 * is UNKNOWN, and an unknown booking is far more likely to be a business
 * enquiry than a consumer one. Missing a real B2B call because attribution
 * failed would be a worse outcome than one unnecessary CC.
 */
const B2B_CC = ["pranav@growqr.ai"];

/** Where an attendee's reply to our confirmation should land. */
const TEAM_REPLY_TO = "support@growqr.ai";

/** Rows younger than this are left to the webhook's own after() hook. */
const RETRY_GRACE_MS = 5 * 60_000;
const RETRY_BATCH = 25;

type Booking = Tables<"call_bookings">;

const STATUS_COPY: Record<string, { verb: string; heading: string }> = {
  booked: { verb: "booked", heading: "New call booked" },
  rescheduled: { verb: "rescheduled", heading: "Call rescheduled" },
  cancelled: { verb: "cancelled", heading: "Call cancelled" },
};

/**
 * Both timezones, always. A time shown only in IST is a booking the team has to
 * mentally convert before they can tell whether the attendee understood it, and
 * a time shown only in the attendee's zone is one the team has to convert to
 * know when to show up.
 */
function formatWhen(iso: string | null, timeZone: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const ist = date.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  if (!timeZone || timeZone === "Asia/Kolkata") return `${ist} IST`;

  try {
    const local = date.toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone,
    });
    return `${ist} IST &nbsp;·&nbsp; ${local} (${timeZone})`;
  } catch {
    // An unknown IANA zone from Cal must not cost us the notification.
    return `${ist} IST`;
  }
}

function row(label: string, value: string | null, opts?: { raw?: boolean }) {
  if (!value) return "";
  const rendered = opts?.raw ? value : escapeHtml(value);
  return `<p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">${escapeHtml(label)}:</strong> ${rendered}</p>`;
}

export function buildBookingEmail(booking: Booking): { subject: string; html: string } {
  const copy = STATUS_COPY[booking.status] ?? STATUS_COPY.booked;
  const label = eventTypeLabel(booking.cal_event_type_id);
  const subject = `[GrowQR] Call ${copy.verb} — ${booking.attendee_name}${booking.company ? ` (${booking.company})` : ""}`;

  const html = getEmailShell(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR Calls</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">${escapeHtml(copy.heading)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            ${row("When", formatWhen(booking.start_time, booking.attendee_timezone), { raw: true })}
                            ${row("Type", label)}
                            <div class="divider" style="height: 1px; margin: 10px 0 14px 0;"></div>
                            ${row("Name", booking.attendee_name)}
                            ${row("Email", `<a href="mailto:${escapeHtml(booking.email)}" style="color: #ff6b35; text-decoration: none;">${escapeHtml(booking.email)}</a>`, { raw: true })}
                            ${row("Company", booking.company)}
                            ${row("Team size", booking.team_size)}
                            ${row("Country", countryDisplayName(booking.country_code))}
                            <div class="divider" style="height: 1px; margin: 10px 0 14px 0;"></div>
                            ${row("Booked from", booking.source)}
                            ${row("Page", booking.page_path)}
                            ${row("Campaign", booking.utm_campaign)}
                            ${row("Source / medium", booking.utm_source ? `${booking.utm_source} / ${booking.utm_medium ?? "—"}` : null)}
                            ${booking.is_disposable_email ? row("⚠ Note", "Disposable email address — not synced to CRM") : ""}
                            ${row("Cancellation reason", booking.cancellation_reason)}
                          </td>
                        </tr>
                      </table>

                      ${
                        booking.meeting_url && booking.status !== "cancelled"
                          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                               <tr><td align="left">
                                 <a class="cta" href="${escapeHtml(booking.meeting_url)}">Join the meeting</a>
                               </td></tr>
                             </table>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 12px 8px 0 8px;">
                <p class="text-muted" style="margin: 0; font-size: 12px;">Booked through Cal.com. The attendee has already received their own confirmation and calendar invite.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `);

  return { subject, html };
}

/**
 * Send the notification for one booking, if it still owes one.
 *
 * The counter is advanced to events_count (not incremented) so that a booking
 * which changed twice while Resend was down settles at one email describing the
 * CURRENT state, rather than a backlog of stale ones.
 */
export async function sendBookingNotification(bookingId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: booking, error } = await admin
    .from("call_bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !booking) {
    log.error(`booking ${bookingId} not found for notification:`, error);
    return;
  }

  // Two independent sends to two different audiences. Each has its own counter
  // and its own try/catch, so a bounce on one is never able to suppress or mask
  // the other — the failure mode a shared counter would have introduced.
  await sendTeamNotification(booking);
  await sendAttendeeConfirmation(booking);
}

async function sendTeamNotification(booking: Booking): Promise<void> {
  if (booking.notifications_count >= booking.events_count) return;
  const admin = createAdminClient();

  const { subject, html } = buildBookingEmail(booking);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_TO,
    cc: isB2cSource(booking.source) ? undefined : B2B_CC,
    replyTo: booking.email,
    subject,
    html,
  });

  const { error } = await admin
    .from("call_bookings")
    .update({ notifications_count: booking.events_count })
    .eq("id", booking.id);
  if (error) {
    // The email is already out. Leaving the counter behind means the cron will
    // send a duplicate rather than silently drop a real one — the right way
    // round for a notification.
    log.error(`booking ${booking.id} notification counter write failed:`, error);
  }

  log.info(`booking ${booking.id} team-notified (${booking.status})`);
}

/**
 * The attendee's own branded confirmation, alongside Cal's.
 *
 * Never sent to a disposable address: Cal has already confirmed the booking to
 * them, and mailing a throwaway domain buys nothing while putting the sending
 * domain's reputation at risk on what is very often a spam trap.
 */
async function sendAttendeeConfirmation(booking: Booking): Promise<void> {
  if (booking.attendee_notifications_count >= booking.events_count) return;
  const admin = createAdminClient();

  if (booking.is_disposable_email) {
    await admin
      .from("call_bookings")
      .update({ attendee_notifications_count: booking.events_count })
      .eq("id", booking.id);
    log.info(`booking ${booking.id} attendee confirmation skipped (disposable address)`);
    return;
  }

  try {
    const { subject, html } = buildAttendeeEmail(booking);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      replyTo: TEAM_REPLY_TO,
      subject,
      html,
    });

    const { error } = await admin
      .from("call_bookings")
      .update({ attendee_notifications_count: booking.events_count })
      .eq("id", booking.id);
    if (error) {
      log.error(`booking ${booking.id} attendee counter write failed:`, error);
    }
    log.info(`booking ${booking.id} attendee-confirmed (${booking.status})`);
  } catch (sendError) {
    // Left for the retry lane. Deliberately not rethrown: the team must still
    // learn about the booking even if the attendee's copy bounced.
    log.error(`booking ${booking.id} attendee confirmation failed:`, sendError);
  }
}

/**
 * Reconciliation lane for notifications, called from the crm-sync cron.
 *
 * Independent of CRM state by design: this is what makes the email survive
 * Zoho being down, CRM_SYNC_ENABLED being off, or the after() hook dying with a
 * cold shutdown. Never throws — a broken notification path must not fail the
 * cron that also drains the CRM queue.
 */
export async function retryPendingBookingNotifications(): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - RETRY_GRACE_MS).toISOString();

  const { data: rows, error } = await admin
    .from("call_bookings")
    .select("id")
    // Either lane can be outstanding on its own — an attendee bounce does not
    // hold back the team email and vice versa, so both are checked here.
    .or("notifications_pending.eq.true,attendee_notifications_pending.eq.true")
    .lt("updated_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(RETRY_BATCH);

  if (error) {
    log.error("notification retry query failed:", error);
    return 0;
  }

  let sent = 0;
  for (const { id } of rows ?? []) {
    try {
      await sendBookingNotification(id);
      sent += 1;
    } catch (sendError) {
      log.error(`booking ${id} notification retry failed:`, sendError);
    }
  }
  if (sent) log.info(`retried ${sent} pending booking notification(s)`);
  return sent;
}
