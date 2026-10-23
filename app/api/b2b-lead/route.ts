import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import { firstName } from "@/lib/first-name";
import { getEmailShell } from "@/lib/email/shell";
import { emailLogo } from "@/lib/email/logo";
import { createLogger } from "@/lib/log";
import { createFormRoute } from "@/lib/forms/handler";
import { parseB2bLead, type B2bLeadSubmission } from "@/lib/forms/schemas";

const FROM_EMAIL = "GrowQR | B2B <hello@growqr.ai>";
const TEAM_EMAIL = "support@growqr.ai";

const log = createLogger("b2b-lead");

function buildTeamNotificationEmail(data: {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  agent: string;
  solution: string;
  page: string;
  message: string;
}) {
  const { name, email, company, teamSize, agent, solution, page, message } = data;
  const attribution = agent !== "N/A" ? agent : solution !== "N/A" ? solution : "General enquiry";

  return getEmailShell(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR B2B</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">New enterprise lead</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-bottom: 14px;"><span class="chip">${escapeHtml(attribution)}</span></td>
                        </tr>
                      </table>

                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Name:</strong> ${escapeHtml(name)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #ff6b35; text-decoration: none;">${escapeHtml(email)}</a></p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Company:</strong> ${escapeHtml(company)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Team size:</strong> ${escapeHtml(teamSize)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Page:</strong> ${escapeHtml(page)}</p>
                            <div class="divider" style="height: 1px; margin: 0 0 14px 0;"></div>
                            <p class="text-primary body-text" style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; font-weight: 700;">Message</p>
                            <p class="text-muted body-text" style="margin: 0; font-size: 14px; line-height: 1.7;">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                        <tr>
                          <td align="left">
                            <a class="cta" href="mailto:${escapeHtml(email)}?subject=Re:%20GrowQR%20for%20${encodeURIComponent(company)}">Reply to ${escapeHtml(name)}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 12px 8px 0 8px;">
                <p class="text-muted" style="margin: 0; font-size: 12px;">This lead was captured from the GrowQR enterprise contact modal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `);
}

/**
 * Confirmation sent to the person who submitted the enquiry. Self-contained
 * (not the shared shell) — matches the brand mark + card layout used in the
 * booking-confirmation/invoice emails (lib/invoice/send-invoice.tsx): the
 * hosted GrowQR logo, accent line, a details card, and a proper footer,
 * rather than the shell's generic sans "GrowQR" logo.
 */
function buildLeadConfirmationEmail(data: {
  name: string;
  company: string;
  teamSize: string;
  attribution: string;
}) {
  const { name, company, teamSize, attribution } = data;
  const first = escapeHtml(firstName(name));
  const ff = "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif";

  const detailRow = (label: string, value: string, isLast = false) =>
    `<tr><td style="padding:13px 18px;${isLast ? "" : "border-bottom:1px solid #eef0f2;"}">
       <p style="margin:0 0 2px;font-family:${ff};font-size:11px;color:#8b919a;line-height:1;">${label}</p>
       <p style="margin:0;font-family:${ff};font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;word-break:break-word;">${value}</p>
     </td></tr>`;

  const nextSteps = [
    "A GrowQR team member will review your enquiry",
    "We'll reach out to your email within 1 business day",
  ]
    .map(
      (text) =>
        `<tr><td style="padding:2px 0;font-family:${ff};font-size:13px;color:#374151;line-height:1.6;">
           <span style="color:#FF6A2F;">&#8226;</span>&ensp;${text}
         </td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Enquiry received</title>
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
  We received your enquiry about GrowQR Enterprise for ${escapeHtml(company)}.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f4f5f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="card" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

      <!-- Brand header -->
      <tr>
        <td class="px" style="background-color:#ffffff;padding:24px 36px 16px;">
          ${emailLogo({ width: 120 })}
        </td>
      </tr>

      <!-- Accent line -->
      <tr>
        <td class="px" style="padding:0 36px;">
          <div class="accent-line" style="height:2px;background-color:#FF6A2F;border-radius:1px;"></div>
        </td>
      </tr>

      <!-- Heading -->
      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <h1 class="text-dark" style="margin:0 0 4px;font-family:${ff};font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:-0.2px;">
            Enquiry received
          </h1>
          <p class="text-mid" style="margin:0;font-family:${ff};font-size:13.5px;color:#6b7280;line-height:1.5;">
            Hi ${first}, we've received your enquiry about GrowQR Enterprise.
          </p>
        </td>
      </tr>

      <!-- Details card -->
      <tr>
        <td class="px" style="padding:20px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-inner" style="background-color:#f7f8f9;border-radius:8px;overflow:hidden;">
            ${detailRow("Company", escapeHtml(company))}
            ${detailRow("Team size", escapeHtml(teamSize))}
            ${detailRow("Regarding", escapeHtml(attribution), true)}
          </table>
        </td>
      </tr>

      <!-- Divider -->
      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <div style="height:1px;background-color:#eef0f2;"></div>
        </td>
      </tr>

      <!-- What happens next -->
      <tr>
        <td class="px" style="padding:18px 36px 0;">
          <p class="text-light" style="margin:0 0 8px;font-family:${ff};font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;">
            What happens next
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">${nextSteps}</table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="px" style="padding:24px 36px 22px;">
          <div style="height:1px;background-color:#eef0f2;margin-bottom:16px;"></div>
          <p class="text-light" style="margin:0;font-family:${ff};font-size:11.5px;color:#9ca3af;line-height:1.6;">
            Questions? Contact
            <a href="mailto:support@growqr.ai" style="color:#FF6A2F;text-decoration:none;">support@growqr.ai</a>
          </p>
          <p style="margin:4px 0 0;font-family:${ff};font-size:10.5px;color:#c9cdd4;line-height:1;">
            GrowQR Enterprise
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`;
}

function buildEmails(data: B2bLeadSubmission): Array<Promise<unknown>> {
  // Notify the team + confirm to the submitter — non-fatal, the lead is
  // already saved either way.
  const attribution = data.agent ?? data.solution ?? "General enquiry";
  const resend = getResend();

  return [
    resend.emails.send({
      from: FROM_EMAIL,
      to: TEAM_EMAIL,
      replyTo: data.email,
      subject: `New B2B lead: ${data.company}`,
      html: buildTeamNotificationEmail({
        name: data.name,
        email: data.email,
        company: data.company,
        teamSize: data.teamSize ?? "N/A",
        agent: data.agent ?? "N/A",
        solution: data.solution ?? "N/A",
        page: data.source ?? "N/A",
        message: data.message ?? "N/A",
      }),
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      replyTo: TEAM_EMAIL,
      subject: "We received your enquiry - GrowQR Enterprise",
      html: buildLeadConfirmationEmail({
        name: data.name,
        company: data.company,
        teamSize: data.teamSize ?? "Not specified",
        attribution,
      }),
    }),
  ];
}

// POST /api/b2b-lead
// Backs the EnterpriseContactModal used on solution pages + B2B agent pages.
export const POST = createFormRoute<B2bLeadSubmission>({
  key: "b2b-lead",
  turnstile: {
    // This route sends mail to a submitter-supplied address, so an unprotected
    // form is an open relay against the domain's sending reputation.
    label: "B2B lead",
    errorMessage: "Security check failed. Please try again.",
  },
  parse: parseB2bLead,
  persist: async (data, meta) => {
    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("b2b_leads")
      .insert({
        name: data.name,
        email: data.email,
        company: data.company,
        team_size: data.teamSize,
        message: data.message,
        agent: data.agent,
        solution: data.solution,
        country_code: meta.countryCode,
        ...meta.attribution,
        // Listed after the spread: the modal's legacy `source` field stays
        // the authoritative page_path (same submit-time pathname in
        // practice). crm_sync_status relies on the DB default 'pending'.
        page_path: data.source,
      })
      .select("id")
      .single();
    if (error) {
      log.error("insert error:", error);
      return NextResponse.json({ error: "Could not save your enquiry. Please try again." }, { status: 500 });
    }
    return { crmRowId: inserted.id };
  },
  crmSource: "b2b_leads",
  sideEffects: buildEmails,
  successBody: { success: true },
  failureMessage: "Something went wrong. Please try again.",
});
