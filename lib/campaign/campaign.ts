import "server-only";
import { MAIL_1_HTML } from "./mail-1-template";

/* ────────────────────────────────────────────────────────────────
   Demo-day campaign sending.

   Zoho CRM caps mass email per DAY (2,000 on its top edition) and
   spreading the send across hours does not help, so demo waves go
   out through Resend instead. Sending is deliberately decoupled
   from the CRM import: students get their link minutes after the
   demo, and the sheets are reconciled into Zoho afterwards.
──────────────────────────────────────────────────────────────── */

export interface CampaignDef {
  id: string;
  name: string;
  subject: string;
  from: string;
  replyTo: string;
  html: string;
  /** Placeholders the operator must supply a URL for before sending. */
  links: { key: "cta_url" | "guide_url"; label: string; hint: string }[];
}

/** No unsubscribe route exists on the site yet. A mailto is a real destination;
 *  a link that 404s turns unsubscribes into spam complaints, and complaints are
 *  what actually damage the domain reputation carrying our booking emails. */
export const UNSUBSCRIBE = "mailto:support@growqr.ai?subject=Unsubscribe";

export const CAMPAIGNS: Record<string, CampaignDef> = {
  "mail-1-institutional-signup": {
    id: "mail-1-institutional-signup",
    name: "Institutional sign-up",
    subject: "Complete Your GrowQR Institutional Sign-Up",
    from: "GrowQR Q-Kampus <advisory@growqr.ai>",
    replyTo: "support@growqr.ai",
    html: MAIL_1_HTML,
    links: [
      { key: "cta_url", label: "Sign-up link", hint: "The Complete my sign-up button" },
      { key: "guide_url", label: "Step-by-Step Guide link", hint: "Linked twice in the body" },
    ],
  },
};

export interface Recipient {
  email: string;
  college: string;
  /** Used only for the greeting. Blank falls back to "Aspirant". */
  firstName?: string;
}

export interface ParseResult {
  recipients: Recipient[];
  invalid: string[];
  duplicates: string[];
  totalRows: number;
  /** Header names we found, so the operator can see the sheet was understood. */
  matchedColumns: { email: string | null; college: string | null; name: string | null };
}

/** Wave sheets come from whatever form the campus team used that day, so match
 *  header names on meaning rather than requiring an exact schema. */
const EMAIL_RE = /^e-?mail|email.?address|mail.?id/i;
const COLLEGE_RE = /college|university|institut|school|campus/i;
const NAME_RE = /^(full.?)?name$|first.?name|student.?name/i;
const VALID_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Minimal RFC4180 reader: handles quoted cells, embedded commas and newlines. */
function parseCsv(text: string): Record<string, string>[] {
  const t = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

export function parseSheet(csv: string): ParseResult {
  const rows = parseCsv(csv);
  const header = rows.length ? Object.keys(rows[0]) : [];
  const emailCol = header.find((h) => EMAIL_RE.test(h)) ?? null;
  const collegeCol = header.find((h) => COLLEGE_RE.test(h)) ?? null;
  const nameCol = header.find((h) => NAME_RE.test(h)) ?? null;

  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  for (const r of rows) {
    const email = (emailCol ? r[emailCol] : "").trim().toLowerCase();
    const college = (collegeCol ? r[collegeCol] : "").trim();
    /* the greeting wants a first name, and sheets usually carry a full one */
    const firstName = (nameCol ? r[nameCol] : "").trim().split(/\s+/)[0] ?? "";
    if (!VALID_EMAIL.test(email)) { invalid.push(email || "(blank)"); continue; }
    if (seen.has(email)) { duplicates.push(email); continue; }
    seen.add(email);
    recipients.push({ email, college, firstName });
  }

  return {
    recipients,
    invalid,
    duplicates,
    totalRows: rows.length,
    matchedColumns: { email: emailCol, college: collegeCol, name: nameCol },
  };
}

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function render(
  campaign: CampaignDef,
  r: Recipient,
  links: Record<string, string>,
): string {
  return campaign.html
    .replaceAll("{{greeting_name}}", escapeHtml(r.firstName || "Aspirant"))
    .replaceAll("{{college}}", escapeHtml(r.college || "your institution"))
    .replaceAll("{{email}}", escapeHtml(r.email))
    .replaceAll("{{cta_url}}", escapeHtml(links.cta_url ?? ""))
    .replaceAll("{{guide_url}}", escapeHtml(links.guide_url ?? ""))
    .replaceAll("{{unsubscribe_url}}", UNSUBSCRIBE);
}

/** Anything still wearing {{braces}} after a render is a template shipped
 *  broken, which is worse than not sending. Callers must refuse on a hit. */
export function unresolved(html: string): string[] {
  return [...new Set(html.match(/\{\{\w+\}\}/g) ?? [])];
}

export function isHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}
