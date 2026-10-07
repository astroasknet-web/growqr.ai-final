import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/seo";
import { normalizePersonName } from "@/lib/format-person-name";
import { getExpertBySlug } from "@/features/experts/data/experts-data";
import {
  ADVISORY_FROM,
  ADVISORY_REPLY_TO,
  SUPPORT_EMAIL,
  SUPPORT_FOOTNOTE,
  advisoryShell,
  detailRow,
  formatSessionDateTime,
  p,
  type BuiltEmail,
} from "./shell";

/* ────────────────────────────────────────────────────────────────
   The follow-up for a seeker who did not join a session they had
   booked.

   Written once, for every expert. The only expert-specific values
   are the name and the slug that the rebooking link points at, so
   the same copy carries a session missed with any expert on the
   platform rather than being retyped per person.

   The brief this implements: courteous and supportive first, and
   clear that a booked slot is real time blocked on an expert's
   calendar that no other seeker could take. It ends on an open
   door, not a reprimand, so the tone stays an invitation to come
   back rather than an invoice for the missed hour.
──────────────────────────────────────────────────────────────── */

export interface MissedSessionInput {
  /** As the seeker gave it. Used verbatim in the greeting, no honorific inferred. */
  userName: string;
  userEmail: string;
  /** Full display name, honorific included, e.g. "Dr. Ruchi Sharma". */
  expertName: string;
  /** Drives the rebooking link. Falls back to the experts listing when unknown. */
  expertSlug?: string | null;
  sessionTopic?: string | null;
  /** ISO start of the session that was missed. */
  sessionStart: string;
}

/** Where "book another session" sends them: the expert's own page when we know it. */
function rebookUrl(expertSlug?: string | null): string {
  return expertSlug ? `${SITE_URL}/experts/${expertSlug}` : `${SITE_URL}/experts`;
}

export function buildMissedSessionEmail(input: MissedSessionInput): BuiltEmail {
  const { userName, expertName, expertSlug, sessionTopic, sessionStart } = input;

  const when = formatSessionDateTime(sessionStart);
  const expert = escapeHtml(expertName);
  const href = rebookUrl(expertSlug);
  // Booking forms store the name raw, and this one opens a formal letter.
  const seeker = normalizePersonName(userName);

  const html = advisoryShell({
    heading: "About your missed session",
    intro: `Dear ${escapeHtml(seeker)}, greetings from GrowQR.`,
    body:
      p(
        `We are writing regarding your expert session booked with ${expert} for <strong style="color:#1a1a2e;font-weight:600;">${when}</strong>. We noticed that you were not able to join at the scheduled time.`,
      ) +
      p(
        `We understand that unforeseen commitments can arise. If you would still like to connect with ${expert}, you are welcome to book another available slot through the GrowQR platform.`,
      ) +
      p(
        "We would, however, request you to kindly keep in mind that every confirmed session reserves dedicated time on our expert's calendar. Once an appointment is booked, that time is specifically set aside for you and becomes unavailable to other seekers. We therefore greatly appreciate timely attendance and, where attendance is not possible, advance intimation or cancellation.",
      ) +
      p(
        "At GrowQR we value both the aspirations of our seekers and the professional time of our experts. A little consideration on both sides helps us make every expert interaction more meaningful and more accessible to everyone.",
      ) +
      p(
        "We look forward to welcoming you to a future session and supporting you in your professional journey.",
      ),
    rows:
      detailRow("Expert", expert) +
      detailRow("Was scheduled for", when) +
      (sessionTopic ? detailRow("Topic", escapeHtml(sessionTopic)) : ""),
    cta: { label: "Book another session", href },
    signoff: {
      closing: "Warm regards,",
      from: "Team GrowQR",
      tagline: "One QR. One Identity. Unlock Growth.",
    },
    footnote: SUPPORT_FOOTNOTE,
  });

  const text = [
    `Dear ${seeker},`,
    "",
    "Greetings from GrowQR.",
    "",
    `We are writing regarding your expert session booked with ${expertName} for ${when}. We noticed that you were not able to join at the scheduled time.`,
    "",
    `We understand that unforeseen commitments can arise. If you would still like to connect with ${expertName}, you are welcome to book another available slot through the GrowQR platform: ${href}`,
    "",
    "We would, however, request you to kindly keep in mind that every confirmed session reserves dedicated time on our expert's calendar. Once an appointment is booked, that time is specifically set aside for you and becomes unavailable to other seekers. We therefore greatly appreciate timely attendance and, where attendance is not possible, advance intimation or cancellation.",
    "",
    "At GrowQR we value both the aspirations of our seekers and the professional time of our experts. A little consideration on both sides helps us make every expert interaction more meaningful and more accessible to everyone.",
    "",
    "We look forward to welcoming you to a future session and supporting you in your professional journey.",
    "",
    "Warm regards,",
    "Team GrowQR",
    "One QR. One Identity. Unlock Growth.",
    "",
    `Questions? ${SUPPORT_EMAIL}`,
  ].join("\n");

  return {
    subject: `Regarding your missed session with ${expertName}`,
    html,
    text,
  };
}

/**
 * The booking row shape this needs. Deliberately narrower than BookingRow so a
 * caller can build the email from a hand-typed record when the booking predates
 * the table.
 */
export interface MissedSessionBooking {
  expert_slug: string;
  user_name: string;
  user_email: string;
  session_topic?: string | null;
  start_time: string;
}

/**
 * Resolve a booking row into the email input, taking the expert's display name
 * from the expert data rather than the caller. Returns null when the slug is
 * unknown, because a follow-up naming the wrong expert is worse than none.
 */
export function missedSessionInputFromBooking(
  booking: MissedSessionBooking,
): MissedSessionInput | null {
  const expert = getExpertBySlug(booking.expert_slug);
  if (!expert) return null;

  return {
    userName: normalizePersonName(booking.user_name),
    userEmail: booking.user_email,
    expertName: expert.name,
    expertSlug: expert.slug,
    sessionTopic: booking.session_topic ?? null,
    sessionStart: booking.start_time,
  };
}

/** Send the missed-session follow-up to the seeker. Throws if Resend rejects it. */
export async function sendMissedSessionEmail(input: MissedSessionInput): Promise<void> {
  const { subject, html, text } = buildMissedSessionEmail(input);

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: ADVISORY_FROM,
    to: [input.userEmail],
    replyTo: ADVISORY_REPLY_TO,
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Failed to send missed-session email: ${error.message}`);
}
