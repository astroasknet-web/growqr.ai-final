import { getResend } from "@/lib/resend";
import { createAdminClient } from "@/lib/data/server";
import { CAREERS_FROM, CAREERS_REPLY_TO } from "./emails";

/**
 * Send one internship email and record the attempt in internship_emails.
 *
 * Every path that mails a candidate goes through here so that:
 *   - there is one ledger row per attempt, sent or failed, feeding the
 *     "already sent" hint on the status dropdown and the activity timeline;
 *   - a send failure never throws into the caller. A status change or a
 *     scheduled round must succeed on its own terms even when Resend is down;
 *     the failure is recorded, not raised.
 *
 * The one exception to "never throw" is a missing RESEND_API_KEY, which
 * getResend() throws for — caught here and surfaced as a failed send, not an
 * unhandled crash.
 */

export type InternshipEmailKind =
  | "application_received"
  | "interview_invite"
  | "final_round"
  | "selected"
  | "offer"
  | "rejected"
  | "appointment_letter"
  | "team_alert";

interface SendArgs {
  applicationId: string;
  kind: InternshipEmailKind;
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
  /** Defaults to the careers identity. Overridden only where a different from-line is wanted. */
  from?: string;
  replyTo?: string;
  /** Admin email for a human-triggered send. Null for a system send. */
  sentBy?: string | null;
}

export interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export async function sendInternshipEmail(args: SendArgs): Promise<SendResult> {
  const {
    applicationId,
    kind,
    to,
    subject,
    html,
    attachments,
    from = CAREERS_FROM,
    replyTo = CAREERS_REPLY_TO,
    sentBy = null,
  } = args;

  let resendId: string | undefined;
  let status: "sent" | "failed" = "sent";
  let error: string | null = null;

  try {
    const res = await getResend().emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      ...(attachments?.length ? { attachments } : {}),
    });
    if (res.error) {
      status = "failed";
      error = res.error.message ?? "Resend returned an error";
    } else {
      resendId = res.data?.id;
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : "Email send threw";
  }

  // Record the attempt. A ledger write failure must not mask the send outcome,
  // so it is logged and swallowed rather than thrown.
  try {
    await createAdminClient()
      .from("internship_emails")
      .insert({
        application_id: applicationId,
        kind,
        to_email: to,
        subject,
        resend_id: resendId ?? null,
        status,
        error,
        sent_by: sentBy,
      });
  } catch (e) {
    console.error("[internship email] ledger write failed:", e);
  }

  if (status === "failed") {
    console.error(`[internship email] ${kind} to ${to} failed:`, error);
  }

  return { ok: status === "sent", resendId, error: error ?? undefined };
}
