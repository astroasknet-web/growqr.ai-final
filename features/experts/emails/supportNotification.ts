import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import {
  ADVISORY_FROM,
  SUPPORT_EMAIL,
  advisoryShell,
  detailRow,
  formatSessionDateTime,
} from "./shell";

export interface SupportNotificationInput {
  expertName: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  sessionTopic?: string | null;
  sessionStart: string;
  meetingUrl?: string | null;
}

/** The internal copy of every booking. Pure, so it can be previewed. */
export function buildSupportNotification(input: SupportNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { expertName, userName, userEmail, userPhone, sessionTopic, sessionStart, meetingUrl } =
    input;
  const when = formatSessionDateTime(sessionStart);

  const html = advisoryShell({
    heading: "New booking",
    intro: `${escapeHtml(userName)} booked a 1:1 session with ${escapeHtml(expertName)}.`,
    rows:
      detailRow("Expert", escapeHtml(expertName)) +
      detailRow("When", when) +
      detailRow("Booked by", escapeHtml(userName)) +
      detailRow("Email", escapeHtml(userEmail)) +
      (userPhone ? detailRow("Phone", escapeHtml(userPhone)) : "") +
      (sessionTopic ? detailRow("Topic", escapeHtml(sessionTopic)) : ""),
    ...(meetingUrl ? { cta: { label: "Open Google Meet", href: meetingUrl } } : {}),
    footnote: "Automated booking notification from the GrowQR Advisory flow.",
  });

  const text = `New booking.\n${userName} booked ${expertName}.\nWhen: ${when}\nBooked by: ${userName} (${userEmail})${userPhone ? `\nPhone: ${userPhone}` : ""}${sessionTopic ? `\nTopic: ${sessionTopic}` : ""}${meetingUrl ? `\nMeet: ${meetingUrl}` : ""}`;

  return { subject: `New booking, ${userName} with ${expertName}, ${when}`, html, text };
}

/** Internal notification to GrowQR support for every booking. Fire-and-forget. */
export async function sendSupportNotification(opts: SupportNotificationInput) {
  const { subject, html, text } = buildSupportNotification(opts);

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: ADVISORY_FROM,
    to: [SUPPORT_EMAIL],
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Failed to send support notification: ${error.message}`);
}
