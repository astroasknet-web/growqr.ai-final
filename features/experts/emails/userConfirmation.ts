import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import { firstName } from "@/lib/first-name";
import {
  ADVISORY_FROM,
  ADVISORY_REPLY_TO,
  SUPPORT_EMAIL,
  advisoryShell,
  detailRow,
  formatSessionDateTime,
} from "./shell";

export interface UserConfirmationInput {
  userName: string;
  userEmail: string;
  expertName: string;
  sessionTopic?: string | null;
  sessionStart: string;
  meetingUrl?: string | null;
}

/** The booking confirmation the seeker receives. Pure, so it can be previewed. */
export function buildUserConfirmation(input: UserConfirmationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, expertName, sessionTopic, sessionStart, meetingUrl } = input;
  const when = formatSessionDateTime(sessionStart);

  const html = advisoryShell({
    heading: "Your session is booked",
    intro: `Hi ${escapeHtml(firstName(userName))}, your 1:1 session with ${escapeHtml(expertName)} is confirmed.`,
    rows:
      detailRow("Expert", escapeHtml(expertName)) +
      detailRow("When", when) +
      (sessionTopic ? detailRow("Topic", escapeHtml(sessionTopic)) : ""),
    ...(meetingUrl ? { cta: { label: "Join Google Meet", href: meetingUrl } } : {}),
    footnote: `A calendar invite with the Google Meet link has been sent to your email. Need to reschedule or have a question? Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#FF6A2F;text-decoration:none;">${SUPPORT_EMAIL}</a>.`,
  });

  const text = `Your GrowQR session is booked.\nExpert: ${expertName}\nWhen: ${when}${sessionTopic ? `\nTopic: ${sessionTopic}` : ""}${meetingUrl ? `\nMeet: ${meetingUrl}` : ""}\n\nA calendar invite with the Meet link has been sent to your email. Questions? ${SUPPORT_EMAIL}`;

  return { subject: `Your GrowQR session is booked, ${when}`, html, text };
}

/** Confirm the booking to the user who booked the session. Fire-and-forget. */
export async function sendUserConfirmation(opts: UserConfirmationInput) {
  const { subject, html, text } = buildUserConfirmation(opts);

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: ADVISORY_FROM,
    to: [opts.userEmail],
    replyTo: ADVISORY_REPLY_TO,
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Failed to send user confirmation: ${error.message}`);
}
