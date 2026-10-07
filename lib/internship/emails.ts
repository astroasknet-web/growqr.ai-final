import { escapeHtml } from "@/lib/escape-html";
import { firstName } from "@/lib/first-name";
import { SITE_URL } from "@/lib/seo";
import { EMAIL_LOGO_URL } from "@/lib/email/logo";

/**
 * Every email the internship pipeline sends.
 *
 * House style, and the reason for it: candidates read these on a phone, in a
 * hurry, usually while applying to twenty other places. So each one answers
 * three questions and stops. What happened, what happens next, what they do
 * now. No greeting paragraph, no thanks-for-your-interest padding, no closing
 * pleasantries that carry no information.
 *
 * Not built on getEmailShell(): that shell is the INTERNAL notification style.
 * Customer-facing mail in this repo follows the logo-plus-card layout of
 * lib/cal/attendee-email.ts and the invoice emails, and this is the third such
 * place, so the shell below is shared by all seven templates rather than
 * copied per template.
 *
 * Email HTML rules that are load-bearing here: tables not divs, inline styles
 * only, one 600px column, explicit background on every cell (a client that
 * forces dark mode otherwise paints our text onto its own ground), and a VML
 * fallback on every button so Outlook renders it as a button and not a bare
 * link.
 */

const FF =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif";



const ORANGE = "#FF6A2F";  // tailwind.config.ts orange.DEFAULT
const INK = "#1A1A1A";     // ink.DEFAULT
const BODY = "#4B5563";
const MUTED = "#9CA3AF";
const LINE = "#E5E7EB";
const CARD_BG = "#F9FAFB";

export const CAREERS_FROM = "GrowQR | Careers <hello@growqr.ai>";
export const CAREERS_REPLY_TO = "hello@growqr.ai";

/** A labelled row inside the details card. Label left, value right. */
function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:7px 0;font-family:${FF};font-size:13px;color:${MUTED};white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:7px 0;font-family:${FF};font-size:13px;color:${INK};font-weight:600;text-align:right;">${value}</td>
    </tr>`;
}

function detailsCard(rows: string): string {
  if (!rows.trim()) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:${CARD_BG};border:1px solid ${LINE};border-radius:10px;margin:0 0 24px 0;">
      <tr><td style="padding:6px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
      </td></tr>
    </table>`;
}

/** Button with a VML twin so Outlook draws a real button. */
function button(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
      <tr><td>
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${safeHref}" style="height:44px;v-text-anchor:middle;width:230px;" arcsize="18%"
          strokecolor="${ORANGE}" fillcolor="${ORANGE}">
          <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${escapeHtml(label)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${safeHref}" target="_blank"
           style="display:inline-block;background:${ORANGE};color:#ffffff !important;text-decoration:none;
                  font-family:${FF};font-size:14px;font-weight:600;padding:13px 30px;border-radius:8px;line-height:1.2;">
          ${escapeHtml(label)}
        </a>
        <!--<![endif]-->
      </td></tr>
    </table>`;
}

interface ShellParts {
  /** One line, sentence case, no exclamation marks. */
  heading: string;
  /** Two or three short lines at most. Already HTML. */
  body: string;
  details?: string;
  cta?: { label: string; href: string };
  /** Small print under the divider. Optional. */
  footnote?: string;
}

function shell({ heading, body, details = "", cta, footnote }: ShellParts): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table{border-collapse:collapse;}td{font-family:sans-serif;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F3F4F6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;">
    <tr><td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <tr><td style="padding:0 0 20px 4px;">
          <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
            <img src="${EMAIL_LOGO_URL}" width="132" height="66" alt="GrowQR"
                 style="display:block;border:0;outline:none;width:132px;height:66px;">
          </a>
        </td></tr>

        <tr><td style="background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;padding:36px 32px;">

          <h1 style="margin:0 0 18px 0;font-family:${FF};font-size:21px;line-height:1.3;font-weight:700;color:${INK};">
            ${escapeHtml(heading)}
          </h1>

          ${body}
          ${details}
          ${cta ? button(cta.label, cta.href) : ""}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border-top:1px solid ${LINE};padding-top:20px;">
              <p style="margin:0;font-family:${FF};font-size:13px;line-height:1.6;color:${MUTED};">
                ${footnote ? `${footnote}<br>` : ""}Team GrowQR
              </p>
            </td></tr>
          </table>

        </td></tr>

        <tr><td style="padding:20px 4px 0;">
          <p style="margin:0;font-family:${FF};font-size:11px;line-height:1.6;color:${MUTED};">
            Sent by GrowQR because you applied for an internship with us.
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/** Body paragraph. Kept to one or two sentences by convention, not by force. */
function p(html: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${FF};font-size:15px;line-height:1.65;color:${BODY};">${html}</p>`;
}

function strong(text: string): string {
  return `<strong style="color:${INK};font-weight:600;">${escapeHtml(text)}</strong>`;
}

/* ------------------------------------------------------------------ */
/* Templates                                                          */
/* ------------------------------------------------------------------ */

export interface CandidateEmail {
  subject: string;
  html: string;
}

/** Sent the moment an application is stored. */
export function applicationReceived(name: string, role: string): CandidateEmail {
  return {
    subject: "We have your GrowQR internship application",
    html: shell({
      heading: "Application received",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, your application for ${strong(role)} is in.`) +
        p("We review every application against the role and get back to you either way. You do not need to follow up."),
    }),
  };
}

/**
 * Shortlisted. Carries the assessment link, which is the entire point of the
 * email, so it is the only action offered.
 */
export function interviewInvite(
  name: string,
  role: string,
  interviewUrl: string,
  dueLabel: string | null,
): CandidateEmail {
  return {
    subject: "Your GrowQR interview is ready",
    html: shell({
      heading: "You have been shortlisted",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, you are through to the first round for ${strong(role)}.`) +
        p("This round is an AI interview you take in your own time. It takes about fifteen minutes and you need a quiet room and a working microphone."),
      details: detailsCard(
        row("Role", escapeHtml(role)) +
          row("Format", "AI interview, roughly 15 minutes") +
          (dueLabel ? row("Complete by", escapeHtml(dueLabel)) : ""),
      ),
      cta: { label: "Start interview", href: interviewUrl },
      footnote: "Sign in with the email you applied with.",
    }),
  };
}

/** Nudge for a shortlisted candidate who has not started. */
export function interviewReminder(
  name: string,
  interviewUrl: string,
  dueLabel: string | null,
): CandidateEmail {
  return {
    subject: "Reminder: your GrowQR interview is waiting",
    html: shell({
      heading: "Your interview is still open",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, you have not started your interview yet.`) +
        p(
          dueLabel
            ? `It closes on ${strong(dueLabel)}. After that we cannot consider the application further.`
            : "It stays open for a few more days. After that we cannot consider the application further.",
        ),
      cta: { label: "Start interview", href: interviewUrl },
    }),
  };
}

/** Final round booked. Every logistical detail is in the card. */
export function finalRoundScheduled(
  name: string,
  whenLabel: string,
  interviewer: string | null,
  meetingUrl: string | null,
): CandidateEmail {
  return {
    subject: `Your GrowQR final round: ${whenLabel}`,
    html: shell({
      heading: "Final round scheduled",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, your interview went well enough to move forward.`) +
        p("This last round is a conversation with the team. Come with questions."),
      details: detailsCard(
        row("When", escapeHtml(whenLabel)) +
          (interviewer ? row("With", escapeHtml(interviewer)) : "") +
          row("Format", "Video call, 30 minutes"),
      ),
      cta: meetingUrl ? { label: "Join the call", href: meetingUrl } : undefined,
      footnote: "Reply to this email if the time does not work.",
    }),
  };
}

/** Offer. Deliberately short: the detail belongs in the attached letter. */
export function offerExtended(
  name: string,
  role: string,
  startLabel: string | null,
  durationLabel: string | null,
): CandidateEmail {
  return {
    subject: `Your GrowQR internship offer: ${role}`,
    html: shell({
      heading: "We would like you to join us",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, we are offering you the ${strong(role)} internship at GrowQR.`) +
        p("Your formal offer letter follows separately. Reply to this email to accept, or with any questions first."),
      details: detailsCard(
        row("Role", escapeHtml(role)) +
          (durationLabel ? row("Duration", escapeHtml(durationLabel)) : "") +
          (startLabel ? row("Starts", escapeHtml(startLabel)) : ""),
      ),
    }),
  };
}

/**
 * Covering note the appointment letter rides on. The letter PDF is the
 * substance; this is two lines and gets out of the way. Still silent on
 * compensation, exactly as the letter is.
 */
export function appointmentLetterIssued(name: string, role: string): CandidateEmail {
  return {
    subject: `Your GrowQR internship appointment letter: ${role}`,
    html: shell({
      heading: "Your appointment letter",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, your appointment letter for the ${strong(role)} internship is attached.`) +
        p("Please read it, sign it, and reply to this email with a signed copy to confirm."),
      footnote: "The letter is a PDF attached to this email.",
    }),
  };
}

/** Selected, before the paperwork. */
export function selected(name: string, role: string): CandidateEmail {
  return {
    subject: "Update on your GrowQR internship application",
    html: shell({
      heading: "You have been selected",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, you have been selected for the ${strong(role)} internship.`) +
        p("We are putting your offer together and will send it in the next few days."),
    }),
  };
}

/**
 * Rejection.
 *
 * Short, clear, and it does not pretend. No "we were impressed by the calibre
 * of applications", no "we will keep your CV on file" unless we actually will.
 * Being told plainly is kinder than being told warmly and vaguely.
 */
export function notSelected(name: string, role: string): CandidateEmail {
  return {
    subject: "Update on your GrowQR internship application",
    html: shell({
      heading: "We are not moving forward",
      body:
        p(`Hi ${escapeHtml(firstName(name))}, we are not taking your application for ${strong(role)} further.`) +
        p("You are welcome to apply again for a future cohort. Your GrowQR profile stays yours either way, and building it up is the best thing you can do before the next application."),
      cta: { label: "Open your profile", href: "https://app.growqr.ai" },
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Internal                                                           */
/* ------------------------------------------------------------------ */

/**
 * Team alert on a new application. Internal, so it leads with the numbers a
 * reviewer triages on rather than a greeting.
 */
export function newApplicationAlert(params: {
  name: string;
  role: string;
  college: string;
  rqScore: number | null;
  triageLabel: string;
  adminUrl: string;
}): CandidateEmail {
  const { name, role, college, rqScore, triageLabel, adminUrl } = params;
  return {
    subject: `New internship application: ${name} (${role})`,
    html: shell({
      heading: "New internship application",
      body: p(`${strong(name)} applied for ${strong(role)}.`),
      details: detailsCard(
        row("RQ-Score", rqScore === null ? "Not available" : `${rqScore}`) +
          row("Triage", escapeHtml(triageLabel)) +
          row("College", escapeHtml(college)),
      ),
      cta: { label: "Open application", href: adminUrl },
    }),
  };
}

/** Everything above, for the preview page. Kept beside them so it cannot drift. */
export const EMAIL_CATALOGUE = [
  {
    id: "received",
    name: "Application received",
    trigger: "Sent the moment the form is submitted",
    audience: "candidate" as const,
    automatic: true,
    build: () => applicationReceived("Ishaan G", "Technology"),
  },
  {
    id: "invite",
    name: "Interview invite",
    trigger: "RQ-Score 50 or above, sent with the interview link",
    audience: "candidate" as const,
    automatic: true,
    build: () =>
      interviewInvite("Ishaan G", "Technology", "https://app.growqr.ai/interview", "12 September"),
  },
  {
    id: "reminder",
    name: "Interview reminder",
    trigger: "Shortlisted but has not started, three days before it closes",
    audience: "candidate" as const,
    automatic: true,
    build: () =>
      interviewReminder("Ishaan G", "https://app.growqr.ai/interview", "12 September"),
  },
  {
    id: "final",
    name: "Final round scheduled",
    trigger: "A reviewer books the final discussion",
    audience: "candidate" as const,
    automatic: false,
    build: () =>
      finalRoundScheduled(
        "Ishaan G",
        "Thursday 11 September, 3:30 pm IST",
        "Aman Gupta",
        "https://meet.google.com/demo-final-round",
      ),
  },
  {
    id: "selected",
    name: "Selected",
    trigger: "A reviewer marks the candidate Selected",
    audience: "candidate" as const,
    automatic: false,
    build: () => selected("Ishaan G", "Technology"),
  },
  {
    id: "offer",
    name: "Offer",
    trigger: "A reviewer marks the candidate Offer",
    audience: "candidate" as const,
    automatic: false,
    build: () => offerExtended("Ishaan G", "Technology", "1 October 2026", "6 months"),
  },
  {
    id: "rejected",
    name: "Not moving forward",
    trigger: "A reviewer marks the candidate Rejected",
    audience: "candidate" as const,
    automatic: false,
    build: () => notSelected("Ishaan G", "Technology"),
  },
  {
    id: "appointment_letter",
    name: "Appointment letter",
    trigger: "A reviewer issues the appointment letter",
    audience: "candidate" as const,
    automatic: false,
    build: () => appointmentLetterIssued("Ishaan G", "Technology"),
  },
  {
    id: "alert",
    name: "New application alert",
    trigger: "Sent to the hiring team on every new application",
    audience: "team" as const,
    automatic: true,
    build: () =>
      newApplicationAlert({
        name: "Ishaan G",
        role: "Technology",
        college: "Guru Nanak Dev University, Amritsar",
        rqScore: 86.84,
        triageLabel: "Auto-Shortlist",
        adminUrl: "https://www.growqr.ai/admin/internship",
      }),
  },
];
