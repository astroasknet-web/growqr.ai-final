import { escapeHtml } from "@/lib/escape-html";
import { emailLogo } from "@/lib/email/logo";

/* ────────────────────────────────────────────────────────────────
   The shared shell behind every GrowQR Advisory email: booking
   confirmations, the two reminder stages, the expert and support
   notifications, and the missed-session follow-up.

   These five used to carry a copy each of the same card markup,
   the same IST formatter and the same detail row, which is how
   the logo ended up needing changing in five places at once. One
   shell, five templates.

   Email HTML rules that are load-bearing here: tables not divs,
   inline styles only, one fixed-width column, and an explicit
   background on every cell so a client that forces dark mode
   cannot paint our text onto its own ground.
──────────────────────────────────────────────────────────────── */

export const ADVISORY_FROM = "GrowQR Advisory <advisory@growqr.ai>";
export const ADVISORY_REPLY_TO = "support@growqr.ai";
export const SUPPORT_EMAIL = "support@growqr.ai";

export const FF =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif";

const ORANGE = "#FF6A2F";
const INK = "#1a1a2e";
const BODY = "#4b5563";
const MUTED = "#9ca3af";
const LABEL = "#8b919a";
const LINE = "#eef0f2";
const CARD_BG = "#f7f8f9";

/** Session times are always shown in IST: the experts and almost every seeker sit there. */
export function formatSessionDateTime(isoStart: string): string {
  return (
    new Date(isoStart).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }) + " IST"
  );
}

/** One labelled line inside the details card. `value` is already HTML. */
export function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:11px 18px;border-bottom:1px solid ${LINE};">
       <p style="margin:0 0 2px;font-family:${FF};font-size:11px;color:${LABEL};line-height:1;">${escapeHtml(label)}</p>
       <p style="margin:0;font-family:${FF};font-size:14px;font-weight:600;color:${INK};line-height:1.4;word-break:break-word;">${value}</p>
     </td></tr>`;
}

/** Body paragraph. One or two sentences by convention, not by force. */
export function p(html: string): string {
  return `<p style="margin:0 0 14px 0;font-family:${FF};font-size:14px;line-height:1.65;color:${BODY};">${html}</p>`;
}

/** Button with a VML twin so Outlook draws a real button and not a bare link. */
function button(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  return `<!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${safeHref}" style="height:40px;v-text-anchor:middle;width:220px;" arcsize="20%"
        strokecolor="${ORANGE}" fillcolor="${ORANGE}">
        <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">${escapeHtml(label)}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" target="_blank" style="display:inline-block;background:${ORANGE};color:#ffffff !important;text-decoration:none;font-family:${FF};font-size:13px;font-weight:600;padding:11px 24px;border-radius:8px;line-height:1.2;">${escapeHtml(label)}</a>
      <!--<![endif]-->`;
}

/** What every template in this folder returns. */
export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export interface AdvisoryShellParts {
  /** One line, sentence case. */
  heading: string;
  /** The line under the heading. Already HTML. */
  intro: string;
  /** Extra paragraphs between the intro and the details card. Already HTML. */
  body?: string;
  /** Rows built with `detailRow`. The card is dropped when empty. */
  rows?: string;
  cta?: { label: string; href: string };
  /**
   * A letter-style sign-off, set at body size above the divider. The footnote
   * below it is small print, which is the wrong weight for "Warm regards".
   */
  signoff?: { closing: string; from: string; tagline?: string };
  /** Small print at the foot of the card. Already HTML. */
  footnote: string;
}

export function advisoryShell({
  heading,
  intro,
  body = "",
  rows = "",
  cta,
  signoff,
  footnote,
}: AdvisoryShellParts): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">

        <tr><td style="padding:26px 36px 14px;">${emailLogo({ width: 120 })}</td></tr>
        <tr><td style="padding:0 36px;"><div style="height:2px;background:${ORANGE};border-radius:1px;font-size:0;line-height:0;">&nbsp;</div></td></tr>

        <tr><td style="padding:22px 36px 0;">
          <h1 style="margin:0 0 6px;font-family:${FF};font-size:18px;font-weight:700;color:${INK};line-height:1.35;">${escapeHtml(heading)}</h1>
          <p style="margin:0;font-family:${FF};font-size:13.5px;color:#6b7280;line-height:1.6;">${intro}</p>
        </td></tr>

        ${body ? `<tr><td style="padding:18px 36px 0;">${body}</td></tr>` : ""}

        ${
          rows
            ? `<tr><td style="padding:18px 36px 0;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CARD_BG};border-radius:8px;overflow:hidden;">${rows}</table>
               </td></tr>`
            : ""
        }

        ${cta ? `<tr><td style="padding:20px 36px 0;">${button(cta.label, cta.href)}</td></tr>` : ""}

        ${
          signoff
            ? `<tr><td style="padding:24px 36px 0;">
                 <p style="margin:0;font-family:${FF};font-size:14px;line-height:1.65;color:${BODY};">
                   ${escapeHtml(signoff.closing)}<br>
                   <strong style="color:${INK};font-weight:600;">${escapeHtml(signoff.from)}</strong>
                   ${signoff.tagline ? `<br><span style="color:${MUTED};font-size:12.5px;">${escapeHtml(signoff.tagline)}</span>` : ""}
                 </p>
               </td></tr>`
            : ""
        }

        <tr><td style="padding:24px 36px;">
          <div style="height:1px;background:${LINE};margin:0 0 14px;font-size:0;line-height:0;">&nbsp;</div>
          <p style="margin:0;font-family:${FF};font-size:11.5px;color:${MUTED};line-height:1.7;">${footnote}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** The support line most of these emails close on. */
export const SUPPORT_FOOTNOTE = `Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${ORANGE};text-decoration:none;">${SUPPORT_EMAIL}</a>`;
