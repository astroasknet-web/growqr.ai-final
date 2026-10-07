import { escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/seo";

/**
 * The internship appointment letter, as a standalone printable document.
 *
 * Issued once a candidate is selected. Deliberately says nothing about
 * stipend, salary or compensation: those are handled separately, and a letter
 * that stays silent on them cannot be read as an implied promise. It also
 * makes no statement about future employment, for the same reason.
 *
 * Rendered as self-contained HTML rather than a React component so any backend
 * path can produce it: a route handler returning it inline, a mail attachment,
 * or a headless browser printing it to PDF. Nothing here depends on the app
 * being booted.
 *
 * The layout is two explicit A4 pages rather than one flowing document. That
 * costs the freedom to let content reflow, and buys the thing that actually
 * matters for a letter someone signs: what you see on screen is exactly what
 * comes out of the printer, with the page break where we put it instead of
 * wherever the browser happened to run out of room. @page carries no margin;
 * each .page supplies its own padding, so the two measurements can never
 * disagree.
 */

/** Company details, from the site footer and the legal pages. */
export const COMPANY = {
  legalName: "GrowQR Private Limited",
  tradingName: "GrowQR",
  site: "www.growqr.ai",
  email: "hello@growqr.ai",
  address: {
    line1: "4th Floor, Wesource Building",
    line2: "Sector 125, Noida",
    line3: "Uttar Pradesh 201313, India",
  },
} as const;

export interface AppointmentLetterParams {
  /** Issue date, already formatted, e.g. "31 August 2026". */
  date: string;
  referenceNo: string;
  internName: string;
  internEmail: string;
  /** The internship title, e.g. "Technology Intern". */
  designation: string;
  department: string;
  startDate: string;
  /** Either an end date or a span, e.g. "28 February 2027" or "6 months". */
  endDate: string;
  duration: string;
  reportingManager: string;
  /** e.g. "Remote", "Noida (Hybrid)". */
  location: string;
  /** Who signs. Defaults to a neutral title so the letter is never unsigned. */
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface RenderOptions {
  /**
   * If set, the screen toolbar gains a direct download link to a pre-rendered
   * PDF. Preview pages use this; a letter served live has nothing to point at
   * and falls back to the print dialog alone.
   */
  pdfHref?: string;
}

/** Placeholder set, used by the preview and safe to render as-is. */
export const SAMPLE_LETTER: AppointmentLetterParams = {
  date: "31 August 2026",
  referenceNo: "GQR/INT/2026/0041",
  internName: "Ishaan G",
  internEmail: "ishaan.g@growqr.demo",
  designation: "Technology Intern",
  department: "Engineering",
  startDate: "1 October 2026",
  endDate: "31 March 2027",
  duration: "6 months",
  reportingManager: "Aman Gupta",
  location: "Remote",
  signatoryName: "Chandni Jha",
  signatoryTitle: "Head of HR",
};

function field(label: string, value: string): string {
  return `
          <tr>
            <th scope="row">${escapeHtml(label)}</th>
            <td>${escapeHtml(value)}</td>
          </tr>`;
}

export function renderAppointmentLetter(
  p: AppointmentLetterParams,
  opts: RenderOptions = {},
): string {
  const signatory = p.signatoryName ?? "Authorised Signatory";
  const signatoryTitle = p.signatoryTitle ?? `For ${COMPANY.legalName}`;
  const first = escapeHtml(p.internName.trim().split(/\s+/)[0] ?? "");

  const footer = (page: number) => `
      <footer class="doc-footer">
        <span>${escapeHtml(COMPANY.legalName)}</span>
        <span>${escapeHtml(p.referenceNo)}</span>
        <span>Page ${page} of 2</span>
      </footer>`;

  const downloadBtn = opts.pdfHref
    ? `<a class="btn btn-primary" href="${escapeHtml(opts.pdfHref)}" download>Download PDF</a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Internship Appointment Letter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<style>
  :root {
    --ink: #1A1A1A;
    --ink-2: #333333;
    --ink-3: #525252;
    --ink-4: #8A8A8A;
    --rule: #D9D7D2;
    --rule-soft: #ECEAE5;
    --orange: #FF6A2F;
    --sans: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  }

  * { box-sizing: border-box; }

  html { background: #EDECE8; }

  body {
    margin: 0;
    background: #EDECE8;
    color: var(--ink-2);
    font-family: var(--sans);
    font-size: 10.5pt;
    line-height: 1.62;
    -webkit-font-smoothing: antialiased;
  }

  /* ---------- the sheet ----------
     Height is a shade under A4 so a rounding error in the print engine
     cannot spill a third, blank page. */
  .page {
    position: relative;
    width: 210mm;
    height: 296.6mm;
    margin: 22px auto;
    padding: 15mm 18mm 12mm;
    background: #FFFFFF;
    box-shadow: 0 2px 20px rgba(0,0,0,0.09);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ---------- letterhead ---------- */

  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--ink);
  }

  .letterhead img { display: block; width: 112px; height: auto; }

  .org {
    text-align: right;
    font-size: 8pt;
    line-height: 1.55;
    color: var(--ink-3);
  }
  .org .legal { font-weight: 600; color: var(--ink); font-size: 8.8pt; }

  /* ---------- meta ---------- */

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 9px;
    font-size: 8.5pt;
    color: var(--ink-4);
  }

  /* ---------- title ---------- */

  .doc-title {
    margin: 20px 0 0;
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--ink);
    text-align: center;
  }
  .doc-rule {
    width: 48px;
    height: 2px;
    background: var(--orange);
    margin: 9px auto 0;
  }

  /* ---------- addressee ---------- */

  .addressee {
    margin-top: 20px;
    font-size: 10pt;
    line-height: 1.5;
  }
  .addressee .name { font-weight: 600; color: var(--ink); font-size: 10.5pt; }
  .addressee .email { color: var(--ink-3); }

  /* ---------- particulars ---------- */

  table.particulars {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  table.particulars th,
  table.particulars td {
    text-align: left;
    vertical-align: top;
    padding: 6.5px 0;
    font-size: 9.5pt;
    line-height: 1.45;
    border-bottom: 1px solid var(--rule-soft);
  }
  table.particulars tr:last-child th,
  table.particulars tr:last-child td { border-bottom: none; }
  table.particulars th {
    width: 38%;
    font-weight: 400;
    color: var(--ink-4);
    padding-right: 16px;
  }
  table.particulars td { font-weight: 600; color: var(--ink); }

  /* ---------- body ---------- */

  .body { margin-top: 18px; }
  .body p { margin: 0 0 11px; text-align: justify; }
  .body p:last-child { margin-bottom: 0; }
  .salutation { margin-bottom: 12px !important; }

  h2.clause {
    margin: 18px 0 7px;
    font-size: 10pt;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: 0.01em;
  }

  ol.terms { margin: 0; padding-left: 17px; }
  ol.terms li { margin-bottom: 8px; padding-left: 3px; text-align: justify; }
  ol.terms li:last-child { margin-bottom: 0; }

  /* ---------- page 2 continuation strip ---------- */

  .continued {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 9px;
    border-bottom: 1px solid var(--rule);
    font-size: 8.5pt;
    color: var(--ink-4);
  }
  .continued strong { font-weight: 600; color: var(--ink-3); }

  /* ---------- signature ---------- */

  .signature { margin-top: 38px; }

  .sign-grid {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 32px;
  }

  .sign-block { width: 46%; }

  .sign-line {
    border-bottom: 1px solid var(--ink);
    height: 54px;
  }

  .sign-who {
    margin-top: 7px;
    font-size: 9.5pt;
    font-weight: 600;
    color: var(--ink);
  }
  .sign-role {
    font-size: 8.5pt;
    color: var(--ink-4);
    line-height: 1.5;
  }

  .ack {
    margin-top: auto;
    padding-bottom: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--rule-soft);
    font-size: 8.5pt;
    line-height: 1.6;
    color: var(--ink-3);
  }

  /* The note has already absorbed the free space; the footer just follows it. */
  .ack + .doc-footer { margin-top: 14px; }

  /* ---------- footer ---------- */

  .doc-footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--rule-soft);
    display: flex;
    justify-content: space-between;
    gap: 20px;
    font-size: 7.5pt;
    color: var(--ink-4);
  }

  /* ---------- print ----------
     No @page margin: each .page owns its own padding, so the printed
     geometry is the same geometry the screen already showed. */

  @page { size: A4; margin: 0; }

  @media print {
    html, body { background: #FFFFFF; }
    .page {
      margin: 0;
      box-shadow: none;
      break-after: page;
      page-break-after: always;
    }
    .page:last-of-type {
      break-after: auto;
      page-break-after: auto;
    }
    .no-print { display: none !important; }
    a { color: inherit; text-decoration: none; }
  }

  /* ---------- screen-only toolbar ---------- */

  .toolbar {
    width: 210mm;
    margin: 22px auto -6px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .toolbar .hint {
    margin-right: auto;
    font-size: 11.5px;
    color: #6F6C66;
  }
  .btn {
    display: inline-block;
    font-family: var(--sans);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    border: 1px solid var(--ink);
    border-radius: 7px;
    padding: 10px 18px;
    cursor: pointer;
    text-decoration: none;
  }
  .btn-primary { color: #FFFFFF; background: var(--ink); }
  .btn-primary:hover { background: #000000; }
  .btn-ghost { color: var(--ink); background: transparent; }
  .btn-ghost:hover { background: #FFFFFF; }
  .btn:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; }

  /* Small screens get a readable reflow. Print geometry is unaffected. */
  @media screen and (max-width: 840px) {
    .page { width: auto; height: auto; margin: 12px; padding: 22px; }
    .toolbar { width: auto; margin: 12px; flex-wrap: wrap; }
    .letterhead { flex-direction: column; gap: 14px; }
    .org { text-align: left; }
    .sign-grid { flex-direction: column; gap: 26px; }
    .sign-block { width: 100%; }
  }
</style>
</head>
<body>

<div class="toolbar no-print">
  <span class="hint">A4, two pages. Print at 100% scale with background graphics on.</span>
  ${downloadBtn}
  <button type="button" class="btn ${opts.pdfHref ? "btn-ghost" : "btn-primary"}" onclick="window.print()">Print or save as PDF</button>
</div>

<!-- ============================ PAGE 1 ============================ -->
<section class="page">

  <header class="letterhead">
    <img src="${SITE_URL}/emailogo.png" alt="GrowQR" width="112">
    <div class="org">
      <div class="legal">${escapeHtml(COMPANY.legalName)}</div>
      <div>${escapeHtml(COMPANY.address.line1)}</div>
      <div>${escapeHtml(COMPANY.address.line2)}</div>
      <div>${escapeHtml(COMPANY.address.line3)}</div>
      <div>${escapeHtml(COMPANY.site)}</div>
    </div>
  </header>

  <div class="meta">
    <span>Ref: ${escapeHtml(p.referenceNo)}</span>
    <span>Date: ${escapeHtml(p.date)}</span>
  </div>

  <h1 class="doc-title">Internship Appointment Letter</h1>
  <div class="doc-rule"></div>

  <div class="addressee">
    <div class="name">${escapeHtml(p.internName)}</div>
    <div class="email">${escapeHtml(p.internEmail)}</div>
  </div>

  <table class="particulars">
    <tbody>
${field("Designation", p.designation)}
${field("Department", p.department)}
${field("Start date", p.startDate)}
${field("End date", p.endDate)}
${field("Duration", p.duration)}
${field("Reporting manager", p.reportingManager)}
${field("Work location", p.location)}
    </tbody>
  </table>

  <div class="body">
    <p class="salutation">Dear ${first},</p>

    <p>
      Further to your application and the selection process, we are pleased to confirm your
      appointment as <strong>${escapeHtml(p.designation)}</strong> with ${escapeHtml(COMPANY.legalName)}.
      Your internship begins on ${escapeHtml(p.startDate)} and runs for ${escapeHtml(p.duration)},
      concluding on ${escapeHtml(p.endDate)}.
    </p>

    <p>
      You will be part of the ${escapeHtml(p.department)} team, reporting to
      ${escapeHtml(p.reportingManager)}, and will be based at ${escapeHtml(p.location)}.
    </p>

    <h2 class="clause">Terms of engagement</h2>
    <ol class="terms">
      <li>
        You are expected to conduct yourself professionally at all times and to comply with the
        policies, standards and codes of conduct of ${escapeHtml(COMPANY.tradingName)} as they apply
        from time to time.
      </li>
      <li>
        You will treat as strictly confidential all information relating to the Company, its clients,
        its users and its business that you access during the internship, and will not disclose or
        use it for any purpose outside your assigned work, during the internship or after it ends.
      </li>
      <li>
        Any work product, material or intellectual property you create in the course of the
        internship, and in connection with it, belongs to the Company.
      </li>
    </ol>
  </div>
${footer(1)}
</section>

<!-- ============================ PAGE 2 ============================ -->
<section class="page">

  <div class="continued">
    <span><strong>Internship Appointment Letter</strong> &nbsp;·&nbsp; ${escapeHtml(p.internName)}</span>
    <span>Ref: ${escapeHtml(p.referenceNo)}</span>
  </div>

  <div class="body">
    <ol class="terms" start="4">
      <li>
        You will carry out the responsibilities assigned to you diligently, keep to agreed timelines,
        and maintain regular communication with your reporting manager.
      </li>
      <li>
        You will handle Company equipment, systems, accounts and data responsibly, and use them only
        for Company work.
      </li>
      <li>
        This internship is a fixed-term learning engagement for the period stated above. Either party
        may end it earlier with reasonable written notice.
      </li>
      <li>
        This appointment is subject to the Company's policies and terms, and to your continued
        adherence to them.
      </li>
    </ol>

    <p style="margin-top:16px;">
      We are glad to have you with us and look forward to the contribution you will make. Please
      sign and return a copy of this letter to confirm your acceptance.
    </p>
  </div>

  <div class="signature">
    <p style="margin:0 0 6px;">Yours sincerely,</p>
    <div class="sign-who">${escapeHtml(signatory)}</div>
    <div class="sign-role">
      ${escapeHtml(signatoryTitle)}<br>
      ${escapeHtml(COMPANY.legalName)}
    </div>

    <div class="sign-grid" style="justify-content:flex-start;">
      <div class="sign-block">
        <div class="sign-line"></div>
        <div class="sign-who">${escapeHtml(p.internName)}</div>
        <div class="sign-role">
          Accepted by the intern<br>
          Date: ____________________
        </div>
      </div>
    </div>

  </div>

  <p class="ack">
      This letter is issued electronically by ${escapeHtml(COMPANY.legalName)} and is valid without a
      seal. For any query, write to ${escapeHtml(COMPANY.email)} quoting reference
      ${escapeHtml(p.referenceNo)}.
  </p>
${footer(2)}
</section>

</body>
</html>`;
}
