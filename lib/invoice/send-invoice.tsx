import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF, type InvoiceData } from "./pdf-template";
import { getResend } from "../resend";
import { escapeHtml } from "../escape-html";
import { emailLogo } from "../email/logo";
import { firstName as getFirstName } from "../first-name";

/* ─── Helpers ─── */

const INVOICE_TZ = "Asia/Kolkata";

function buildInvoiceNumber(paymentId: string): string {
  // Date parts in IST so the number's date matches the (IST) issue date,
  // regardless of the server's timezone (UTC on Vercel).
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: INVOICE_TZ,
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
  }).format(new Date()).replace(/-/g, "");
  const tail = paymentId.slice(-6).toUpperCase();
  return `GQR-${date}-${tail}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    timeZone: INVOICE_TZ,
  });
}

function formatSessionDateTime(isoStart: string): string {
  const d = new Date(isoStart);
  return d.toLocaleDateString("en-IN", {
    weekday:  "long",
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   true,
    timeZone: "Asia/Kolkata",
  }) + " IST";
}

/* ─── Email HTML ─── */

function buildEmailHtml(opts: {
  customerName:    string;
  expertName:      string;
  sessionDateTime: string;
  sessionMinutes:  number;
  meetingUrl?:     string;
  invoiceNumber:   string;
  amountINR:       number;
}): string {
  const { customerName, expertName, sessionDateTime, sessionMinutes, meetingUrl, invoiceNumber, amountINR } = opts;
  // First name (titles like "Dr." skipped), cleanly cased (e.g. "SAHIL ANDHARE" → "Sahil").
  const rawFirst = getFirstName(customerName, "");
  const firstName = escapeHtml(
    rawFirst ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase() : "there",
  );
  const safeExpertName = escapeHtml(expertName);

  // Font stack used everywhere
  const ff = "-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif";

  const meetSection = meetingUrl
    ? `<tr><td style="padding:20px 36px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${meetingUrl}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="20%" strokecolor="#FF6A2F" fillcolor="#FF6A2F">
          <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">Join Google Meet</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${meetingUrl}" target="_blank"
           style="display:inline-block;background-color:#FF6A2F;color:#ffffff !important;
                  text-decoration:none;font-family:${ff};font-size:13px;font-weight:600;
                  padding:10px 22px;border-radius:8px;line-height:1.4;">
          Join Google Meet &#8594;
        </a>
        <!--<![endif]-->
       </td></tr>`
    : `<tr><td style="padding:16px 36px 0;font-family:${ff};font-size:13px;color:#6B7280;line-height:1.5;">
        Your Google Meet link will arrive in a separate calendar invite.
       </td></tr>`;

  const checks = [
    "Calendar invite with reminders",
    "Google Meet link via email",
    "Invoice attached to this email",
  ].map(text =>
    `<tr><td style="padding:2px 0;font-family:${ff};font-size:13px;color:#374151;line-height:1.6;">
       <span style="color:#FF6A2F;">&#8226;</span>&ensp;${text}
     </td></tr>`
  ).join("");

  // Detail row helper — stacked layout for mobile-friendly long text wrapping
  const detailRow = (label: string, value: string, isLast = false, bold = false) =>
    `<tr><td style="padding:13px 18px;${isLast ? "" : "border-bottom:1px solid #eef0f2;"}">
       <p style="margin:0 0 2px;font-family:${ff};font-size:11px;color:#8b919a;line-height:1;">${label}</p>
       <p style="margin:0;font-family:${ff};font-size:${bold ? "15" : "14"}px;font-weight:${bold ? "700" : "600"};color:#1a1a2e;line-height:1.4;word-break:break-word;">
         ${value}
       </p>
     </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Booking Confirmed</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table{border-collapse:collapse;}td{font-family:sans-serif;}</style>
  <![endif]-->
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
  Your session with ${safeExpertName} is confirmed.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg"
       style="background-color:#f4f5f7;padding:32px 12px;">
  <tr><td align="center">

    <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="card"
           style="max-width:540px;width:100%;background-color:#ffffff;border-radius:10px;
                  overflow:hidden;border:1px solid #e5e7eb;">

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
            Session Confirmed
          </h1>
          <p class="text-mid" style="margin:0;font-family:${ff};font-size:13.5px;color:#6b7280;line-height:1.5;">
            Hi ${firstName}, your booking is confirmed. Here are the details.
          </p>
        </td>
      </tr>

      <!-- Details card -->
      <tr>
        <td class="px" style="padding:20px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-inner"
                 style="background-color:#f7f8f9;border-radius:8px;overflow:hidden;">
            ${detailRow("Expert", safeExpertName)}
            ${detailRow("Date &amp; Time", sessionDateTime)}
            ${detailRow("Session", `${sessionMinutes} min &middot; 1:1 Video Call`)}
            ${detailRow("Amount Paid", `&#8377;${amountINR.toLocaleString("en-IN")}`, true, true)}
          </table>
        </td>
      </tr>

      <!-- Meet link -->
      ${meetSection}

      <!-- Divider -->
      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <div style="height:1px;background-color:#eef0f2;"></div>
        </td>
      </tr>

      <!-- What to expect -->
      <tr>
        <td class="px" style="padding:18px 36px 0;">
          <p class="text-light" style="margin:0 0 8px;font-family:${ff};font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;">
            What to expect
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">${checks}</table>
        </td>
      </tr>

      <!-- Invoice note -->
      <tr>
        <td class="px" style="padding:16px 36px 0;">
          <p class="text-mid" style="margin:0;font-family:${ff};font-size:12px;color:#6b7280;line-height:1.5;">
            Invoice <strong class="text-dark" style="color:#374151;">${invoiceNumber}</strong> is attached as a PDF.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="px" style="padding:24px 36px 22px;">
          <div style="height:1px;background-color:#eef0f2;margin-bottom:16px;"></div>
          <p class="text-light" style="margin:0;font-family:${ff};font-size:11.5px;color:#9ca3af;line-height:1.6;">
            Questions? Reply to this email or contact
            <a href="mailto:support@growqr.ai" style="color:#FF6A2F;text-decoration:none;">support@growqr.ai</a>
          </p>
          <p style="margin:4px 0 0;font-family:${ff};font-size:10.5px;color:#c9cdd4;line-height:1;">
            GrowQR Advisory
          </p>
        </td>
      </tr>

    </table>

  </td></tr>
</table>

</body>
</html>`;
}

/* ─── Main export ─── */

export async function sendInvoiceEmail(opts: {
  customerName:      string;
  customerEmail:     string;
  expertName:        string;
  sessionStart:      string;
  sessionMinutes:    number;
  amountINR:         number;
  razorpayPaymentId: string;
  razorpayOrderId:   string;
  meetingUrl?:       string;
}) {
  const {
    customerName, customerEmail, expertName,
    sessionStart, sessionMinutes, amountINR,
    razorpayPaymentId, razorpayOrderId,
    meetingUrl,
  } = opts;

  const invoiceNumber   = buildInvoiceNumber(razorpayPaymentId);
  const issueDate       = formatDate(new Date());
  const sessionDateTime = formatSessionDateTime(sessionStart);
  const logoPath        = path.join(process.cwd(), "public", "onlygrowqr.png");

  const invoiceData: InvoiceData = {
    invoiceNumber,
    date:              issueDate,
    customerName:      customerName.toUpperCase(),
    customerEmail,
    expertName,
    sessionDate:       sessionDateTime,
    sessionMinutes,
    amountINR,
    razorpayPaymentId,
    razorpayOrderId,
    logoPath,
  };

  const pdfBuffer = await renderToBuffer(<InvoicePDF {...invoiceData} />);

  const resend = getResend();
  const { error } = await resend.emails.send({
    from:    "GrowQR Advisory <advisory@growqr.ai>",
    to:      [customerEmail],
    replyTo: "support@growqr.ai",
    subject: `Booking Confirmed, ${expertName} · ${sessionDateTime}`,
    html:    buildEmailHtml({
      customerName,
      expertName,
      sessionDateTime,
      sessionMinutes,
      meetingUrl,
      invoiceNumber,
      amountINR,
    }),
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content:  pdfBuffer,
      },
    ],
  });

  if (error) {
    console.error("[invoice] Resend error:", error);
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }

  console.log("[invoice] Sent invoice", invoiceNumber, "to", customerEmail);
  return { invoiceNumber };
}
