import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import { firstName } from "@/lib/first-name";
import {
  ADVISORY_FROM,
  ADVISORY_REPLY_TO,
  SUPPORT_FOOTNOTE,
  advisoryShell,
  detailRow,
  formatSessionDateTime,
  p,
  type BuiltEmail,
} from "./shell";

/* ────────────────────────────────────────────────────────────────
   Pre-session reminders — two stages per booking, 24h before and
   1h before, each sent to BOTH the attendee and the expert.

   Delivery is handed to Resend with `scheduledAt` rather than being
   timed by our own cron: Vercel Hobby only allows daily crons, so a
   sweeper could never hit a 1-hour mark. Resend holds the message
   and releases it at the exact instant. See reminder-schedule.ts
   for the orchestration.
──────────────────────────────────────────────────────────────── */

export type ReminderStage = "24h" | "1h";

/** How long before the session each stage goes out. */
export const STAGE_LEAD_MS: Record<ReminderStage, number> = {
  "24h": 24 * 60 * 60_000,
  "1h": 60 * 60_000,
};

/** Human phrasing for each stage, used in subjects and body copy. */
const STAGE_COPY: Record<ReminderStage, { lead: string; heading: string }> = {
  "24h": { lead: "tomorrow", heading: "Your session is tomorrow" },
  "1h": { lead: "in about an hour", heading: "Your session starts in an hour" },
};

/** Which side of the booking a reminder is addressed to. */
export type ReminderAudience = "attendee" | "expert";

export interface SessionReminderInput {
  stage: ReminderStage;
  audience: ReminderAudience;
  /** Full display name, honorific included. */
  expertName: string;
  userName: string;
  /** ISO start of the session. */
  sessionStart: string;
  meetingUrl?: string | null;
}

/**
 * One reminder email, for one side of the booking. Pure, so the preview page
 * renders exactly what sends rather than a second copy of the copy.
 */
export function buildSessionReminder(input: SessionReminderInput): BuiltEmail {
  const { stage, audience, expertName, userName, sessionStart, meetingUrl } = input;

  const when = formatSessionDateTime(sessionStart);
  const { lead } = STAGE_COPY[stage];
  const toAttendee = audience === "attendee";

  // Each side is told about the other, so the "who" flips with the audience.
  const greetingName = firstName(toAttendee ? userName : expertName);
  const otherParty = toAttendee ? expertName : userName;
  const heading = toAttendee
    ? STAGE_COPY[stage].heading
    : stage === "24h"
      ? "Session tomorrow"
      : "Session starts in an hour";
  const intro = toAttendee
    ? `this is a reminder that your 1:1 session with ${escapeHtml(expertName)} is ${lead}.`
    : `your 1:1 session with ${escapeHtml(userName)} is ${lead}.`;

  const html = advisoryShell({
    heading,
    intro: `Hi ${escapeHtml(greetingName)}, ${intro}`,
    body: meetingUrl ? "" : p("Your Google Meet link is in the calendar invite for this session."),
    rows: detailRow("When", when),
    ...(meetingUrl ? { cta: { label: "Join Google Meet", href: meetingUrl } } : {}),
    footnote: SUPPORT_FOOTNOTE,
  });

  return {
    subject: `Reminder, your session with ${otherParty} is ${lead}`,
    html,
    text: `Reminder: your session with ${otherParty} is ${lead}.\nWhen: ${when}${meetingUrl ? `\nMeet: ${meetingUrl}` : ""}`,
  };
}

export type ReminderSendResult = {
  /** True if at least one of the two recipients was accepted by Resend. */
  ok: boolean;
  /** Resend email ids that were accepted, for later cancel/reschedule. */
  emailIds: string[];
};

/**
 * Queue (or immediately send) one reminder stage for a booking, to both the
 * attendee and the expert.
 *
 * `scheduledAt` is an ISO instant handed to Resend, which holds the message
 * until then. Omit it to send right away. Resend accepts a schedule up to 30
 * days out; the caller is responsible for staying inside that.
 */
export async function sendSessionReminder(opts: {
  stage: ReminderStage;
  expertName: string;
  expertEmail: string;
  userName: string;
  userEmail: string;
  sessionStart: string;
  meetingUrl?: string | null;
  scheduledAt?: string;
}): Promise<ReminderSendResult> {
  const {
    stage,
    expertName,
    expertEmail,
    userName,
    userEmail,
    sessionStart,
    meetingUrl,
    scheduledAt,
  } = opts;

  const resend = getResend();
  const shared = { expertName, userName, sessionStart, meetingUrl, stage };

  const attendee = buildSessionReminder({ ...shared, audience: "attendee" });
  const forExpert = buildSessionReminder({ ...shared, audience: "expert" });

  const userSend = resend.emails.send({
    from: ADVISORY_FROM,
    to: [userEmail],
    replyTo: ADVISORY_REPLY_TO,
    ...attendee,
    ...(scheduledAt ? { scheduledAt } : {}),
  });

  const expertSend = resend.emails.send({
    from: ADVISORY_FROM,
    to: [expertEmail],
    replyTo: ADVISORY_REPLY_TO,
    ...forExpert,
    ...(scheduledAt ? { scheduledAt } : {}),
  });

  const [userRes, expertRes] = await Promise.allSettled([userSend, expertSend]);

  const emailIds: string[] = [];
  let ok = false;

  if (userRes.status === "fulfilled" && !userRes.value.error) {
    ok = true;
    if (userRes.value.data?.id) emailIds.push(userRes.value.data.id);
  } else {
    console.error(
      `[sessionReminder] ${stage} attendee email failed:`,
      userRes.status === "fulfilled" ? userRes.value.error : userRes.reason,
    );
  }

  if (expertRes.status === "fulfilled" && !expertRes.value.error) {
    ok = true;
    if (expertRes.value.data?.id) emailIds.push(expertRes.value.data.id);
  } else {
    console.error(
      `[sessionReminder] ${stage} expert email failed:`,
      expertRes.status === "fulfilled" ? expertRes.value.error : expertRes.reason,
    );
  }

  return { ok, emailIds };
}
