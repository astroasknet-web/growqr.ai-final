/**
 * Exports the live SalesIQ FAQs into a bundled snapshot the bot searches
 * locally (lib/bot/faq-snapshot.json).
 *
 *   npm run faq:export
 *
 * WHY THIS EXISTS: scripts/export-kb-snapshot.ts states FAQs are unreachable —
 * "isn't reachable at /faqs, /faq, /faqcategories or /smalltalk (all 1006
 * Invalid URL)". That is true on API **v2**, which is the only version that
 * script tries. The FAQs live on **v3**:
 *
 *   GET https://salesiq.zoho.in/api/v3/growqr5/faqs   → 200, 11 published FAQs
 *   GET https://salesiq.zoho.in/api/v2/growqr5/faqs   → 400, 1006 Invalid URL
 *
 * So 11 human-authored, published answers were invisible to the bot — including
 * "Is GrowQR available in my country?", which is exactly the question the
 * matcher was answering wrongly with "What is GrowQR?".
 *
 * Same credentials and token flow as export-kb-snapshot.ts.
 */
import { loadEnvConfig } from "@next/env";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

loadEnvConfig(process.cwd());

const PORTAL = "growqr5";
/** v3, NOT v2 — see the header. This is the whole point of this script. */
const FAQ_BASE = "https://salesiq.zoho.in/api/v3";
const OUT_PATH = join(process.cwd(), "lib/bot/faq-snapshot.json");

export interface KbFaq {
  id: string;
  /** The canonical phrasing, from `default_question`. */
  question: string;
  /** Alternate phrasings SalesIQ holds for the same FAQ. */
  variants: string[];
  answer: string;
  wordCount: number;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

async function accessToken(): Promise<string> {
  const {
    ZOHO_CLIENT_ID: clientId,
    ZOHO_CLIENT_SECRET: clientSecret,
    ZOHO_REFRESH_TOKEN: refreshToken,
    ZOHO_ACCOUNTS_BASE: accountsBase = "https://accounts.zoho.in",
  } = process.env;
  if (!clientId || !clientSecret || !refreshToken) {
    fail("ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN missing from .env.local");
  }
  const res = await fetch(`${accountsBase}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) fail(`Token refresh failed: ${body.error ?? "no access_token"}`);
  return body.access_token;
}

/** HTML → chat-friendly plain text. Mirrors export-kb-snapshot.ts's htmlToText. */
function htmlToText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface RawFaq {
  id?: string;
  default_question?: string;
  answer?: string;
  published?: boolean | string;
  questions?: Array<{ question?: string; default?: boolean | string }>;
}

async function main(): Promise<void> {
  const token = await accessToken();

  const res = await fetch(`${FAQ_BASE}/${PORTAL}/faqs`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const body = (await res.json()) as { data?: RawFaq[]; error?: { code?: number; message?: string } };
  if (body.error) fail(`/faqs → ${body.error.code} ${body.error.message}`);

  const rows = body.data ?? [];
  console.log(`Found ${rows.length} FAQ(s); normalising…\n`);

  const faqs: KbFaq[] = [];
  for (const row of rows) {
    // Unpublished FAQs are invisible to visitors — never answer from them.
    if (row.published === false || row.published === "false") continue;

    const question = (row.default_question ?? "").trim();
    const answer = htmlToText(row.answer ?? "");
    if (!question || !answer) continue;

    const variants = (row.questions ?? [])
      .map((q) => (q.question ?? "").trim())
      .filter((q) => q && q.toLowerCase() !== question.toLowerCase());

    faqs.push({
      id: String(row.id ?? question),
      question,
      variants,
      answer,
      wordCount: answer.split(/\s+/).length,
    });
  }

  if (!faqs.length) fail("no published FAQs with answers — refusing to write an empty snapshot");

  faqs.sort((a, b) => a.question.localeCompare(b.question));
  writeFileSync(OUT_PATH, `${JSON.stringify({ faqs }, null, 2)}\n`);

  console.log(`✓ Wrote ${faqs.length} FAQ(s) → lib/bot/faq-snapshot.json\n`);
  for (const f of faqs) {
    const extra = f.variants.length ? `  (+${f.variants.length} variant)` : "";
    console.log(`  ${String(f.wordCount).padStart(3)}w  ${f.question}${extra}`);
  }
  console.log();
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
