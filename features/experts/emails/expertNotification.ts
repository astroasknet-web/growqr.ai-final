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

export interface ExpertNotificationInput {
  expertName: string;
  expertEmail: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  sessionTopic?: string | null;
  sessionStart: string;
  meetingUrl?: string | null;
}

/** The "a session was booked with you" email to the expert. Pure, so it can be previewed. */
export function buildExpertNotification(input: ExpertNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { expertName, userName, userEmail, userPhone, sessionTopic, sessionStart, meetingUrl } =
    input;
  const when = formatSessionDateTime(sessionStart);

  const html = advisoryShell({
    heading: "New session booked",
    intro: `Hi ${escapeHtml(firstName(expertName))}, a new 1:1 session has been booked with you.`,
    rows:
      detailRow("When", when) +
      detailRow("Booked by", escapeHtml(userName)) +
      detailRow("Email", escapeHtml(userEmail)) +
      (userPhone ? detailRow("Phone", escapeHtml(userPhone)) : "") +
      (sessionTopic ? detailRow("Topic", escapeHtml(sessionTopic)) : ""),
    ...(meetingUrl ? { cta: { label: "Join Google Meet", href: meetingUrl } } : {}),
    footnote: `A calendar invite with the Meet link has been added to your calendar. Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#FF6A2F;text-decoration:none;">${SUPPORT_EMAIL}</a>`,
  });

  const text = `New session booked.\nWhen: ${when}\nBooked by: ${userName} (${userEmail})${userPhone ? `\nPhone: ${userPhone}` : ""}${sessionTopic ? `\nTopic: ${sessionTopic}` : ""}${meetingUrl ? `\nMeet: ${meetingUrl}` : ""}`;

  return { subject: `New session booked, ${userName} · ${when}`, html, text };
}

/** Notify the expert that a new session has been booked. Fire-and-forget. */
export async function sendExpertNotification(opts: ExpertNotificationInput) {
  const { subject, html, text } = buildExpertNotification(opts);

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: ADVISORY_FROM,
    to: [opts.expertEmail],
    replyTo: ADVISORY_REPLY_TO,
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Failed to send expert notification: ${error.message}`);
}
