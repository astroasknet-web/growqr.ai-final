/**
 * Exports the live SalesIQ Answer Hub into a bundled JSON snapshot the bot
 * searches locally (lib/bot/kb-snapshot.json).
 *
 * Why a snapshot rather than a runtime fetch: the webhook has a hard 5-second
 * budget (docs/salesiq-bot/WEBHOOK_CONTRACT.md) and the KB is 30 rarely-changing
 * articles. Matching against a bundled file costs 0ms and needs no credential
 * in the hot path. The tradeoff is staleness — rerun this after editing the
 * Answer Hub:
 *
 *   npm run kb:export
 *
 * Requires a token with SalesIQ.articles.ALL (mint via `npm run zoho:token`).
 *
 * FAQs are NOT included: the Answer Hub's 13 FAQs live behind an endpoint that
 * isn't reachable at /faqs, /faq, /faqcategories or /smalltalk (all 1006
 * "Invalid URL" as of 2026-07-31) despite SalesIQ.faqs.ALL being granted. The
 * articles carry the substantive content; revisit if the FAQ path surfaces.
 */
import { loadEnvConfig } from "@next/env";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

loadEnvConfig(process.cwd());

const PORTAL = "growqr5";
const SALESIQ_BASE = "https://salesiq.zoho.in/api/v2";
const OUT_PATH = join(process.cwd(), "lib/bot/kb-snapshot.json");
/** The list endpoint pages with `index` (1-based); `limit` alone returns nothing. */
const PAGE_SIZE = 50;

/**
 * Grounding-mode thresholds for the AI fallback layer — see
 * docs/salesiq-bot/AI_FALLBACK_DESIGN.md §4. That design passes the WHOLE KB in
 * every prompt, so corpus size is a latency and cost ceiling, not just a content
 * question: the cost lands hardest on the first call after each export, when the
 * prefix cache is cold and the full corpus is billed and processed uncached.
 *
 * Measured in ARTICLES, not tokens, deliberately: token totals swing with
 * authoring style, while article count tracks the knowledge base's actual
 * complexity and maintenance overhead.
 *
 * Landed here, ahead of the AI layer itself, so the threshold polices itself
 * instead of depending on someone rereading the design doc in a year.
 */
const KB_WARN_ARTICLES = 50;
const KB_MAX_ARTICLES = 75;

export interface KbArticle {
  id: string;
  title: string;
  category: string | null;
  /** Plain text, bullets preserved as "• " lines. */
  text: string;
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

async function siq(token: string, path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${SALESIQ_BASE}/${PORTAL}${path}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  const error = body.error as { code?: number; message?: string } | undefined;
  if (error) fail(`${path} → ${error.code} ${error.message}`);
  return body;
}

/**
 * HTML → chat-friendly plain text. Keeps list items as "• " lines (the KB is
 * heavily bulleted by house style) and drops everything else to prose, so the
 * bot can send an article verbatim without markup leaking into the chat.
 */
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
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/**
 * Enforces the §4 grounding thresholds against the article count that actually
 * reaches the snapshot (published only — drafts never enter a prompt).
 *
 * Runs AFTER the file is written, and that ordering is the point. The ceiling
 * exists for AI whole-KB grounding, which does not exist yet; the deterministic
 * matcher (lib/bot/answers.ts) has no such limit and must keep receiving content
 * updates regardless. Refusing to write the snapshot would strand every KB edit
 * behind a constraint that binds only a future layer. So the snapshot is always
 * current, and the non-zero exit is the gate.
 */
function checkGroundingBudget(count: number): void {
  if (count > KB_MAX_ARTICLES) {
    fail(
      [
        `KB has ${count} articles, over the ${KB_MAX_ARTICLES}-article ceiling for whole-KB AI grounding.`,
        "",
        "  Retrieval is now MANDATORY before any AI fallback layer ships:",
        "  top-8 with a recall-oriented retriever (embeddings), never top-3 from",
        "  the keyword scorer. See docs/salesiq-bot/AI_FALLBACK_DESIGN.md §4.",
        "",
        "  The snapshot WAS written and is current (lib/bot/kb-snapshot.json).",
        "  The deterministic matcher is unaffected and needs no change — this",
        "  exit code gates the AI grounding mode only.",
      ].join("\n"),
    );
  }

  if (count > KB_WARN_ARTICLES) {
    console.warn(
      [
        "",
        `⚠ KB has ${count} articles, past the ${KB_WARN_ARTICLES}-article whole-KB grounding line.`,
        `  Still permitted up to ${KB_MAX_ARTICLES}, where this export starts failing.`,
        "  Schedule the retrieval work now — see docs/salesiq-bot/AI_FALLBACK_DESIGN.md §4.",
      ].join("\n"),
    );
  }
}

async function main(): Promise<void> {
  const token = await accessToken();

  const summaries: Array<{ id: string; published: boolean }> = [];
  for (let index = 1; ; index += PAGE_SIZE) {
    const page = await siq(token, `/articles?limit=${PAGE_SIZE}&index=${index}`);
    const rows = (page.data ?? []) as Array<{ id: string; published?: boolean }>;
    if (!rows.length) break;
    summaries.push(...rows.map((r) => ({ id: r.id, published: r.published !== false })));
    if (rows.length < PAGE_SIZE) break;
  }

  console.log(`Found ${summaries.length} article(s); fetching content…`);

  const articles: KbArticle[] = [];
  for (const { id, published } of summaries) {
    // Unpublished drafts are invisible to visitors — never answer from them.
    if (!published) continue;
    const detail = (await siq(token, `/articles/${id}`)).data as Record<string, unknown>;
    const html = (detail.published_content ?? detail.content ?? "") as string;
    const text = htmlToText(html);
    if (!text) continue;
    const title = (detail.published_title ?? detail.title ?? "") as string;
    const category = (detail.category as { name?: string } | undefined)?.name ?? null;
    articles.push({ id, title, category, text, wordCount: text.split(/\s+/).length });
  }

  articles.sort((a, b) => a.title.localeCompare(b.title));
  writeFileSync(OUT_PATH, `${JSON.stringify({ articles }, null, 2)}\n`);

  console.log(`\n✓ Wrote ${articles.length} article(s) → lib/bot/kb-snapshot.json\n`);
  const long = articles.filter((a) => a.wordCount > 150);
  console.log(`Word counts: min ${Math.min(...articles.map((a) => a.wordCount))}, max ${Math.max(...articles.map((a) => a.wordCount))}`);
  if (long.length) {
    console.log(`\n${long.length} article(s) over the 150-word house limit:`);
    for (const a of long) console.log(`  ${a.wordCount}  ${a.title}`);
  }

  // Last, so the useful export output is never buried under it.
  checkGroundingBudget(articles.length);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
