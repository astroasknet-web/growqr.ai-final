/**
 * Exports a curated set of Zoho SalesIQ documentation pages into a bundled
 * snapshot the AI fallback layer grounds against (lib/ai/zoho-docs-snapshot.json).
 *
 *   npm run zoho:docs
 *
 * WHY A SNAPSHOT, not a live fetch: the SalesIQ webhook has a hard 5-second
 * budget. A cold fetch of one help page measured ~650ms, and the fallback path
 * may need several — far too slow, and it would put an uncacheable third-party
 * dependency in the visitor's response path. Same trade-off, and same reasoning,
 * as scripts/export-kb-snapshot.ts.
 *
 * WHY AN ALLOWLIST, not a crawl: crawling zoho.com would pull in marketing
 * pages, pricing tables and unrelated products — precisely the material that
 * would let the bot state a Zoho "feature" or "price" that does not apply to
 * us. The corpus is a hand-picked list of the developer pages this bot is
 * actually built against, and it changes only when someone edits this file.
 *
 * SCOPE, stated plainly: this corpus answers questions about ZOHO SALESIQ —
 * the webhook contract, handoff, context forms. It does NOT answer questions
 * about GrowQR. A growqr.ai visitor asking about ATS integrations or pricing
 * is served by the Answer Hub snapshot (lib/bot/kb-snapshot.json), never from
 * here. Its purpose is to keep the model from inventing Zoho capabilities.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_PATH = join(process.cwd(), "lib/ai/zoho-docs-snapshot.json");

/** Politeness delay between fetches — this is someone else's server. */
const DELAY_MS = 250;

/**
 * The corpus. Every URL is a page this bot's behaviour was actually designed
 * against, cited in docs/salesiq-bot/{API_CAPABILITIES,WEBHOOK_CONTRACT,
 * FALLBACK_AND_AI_AUDIT}.md. Add a page only when the bot depends on it.
 */
const DOC_URLS: string[] = [
  // Webhook contract — request/response shape, auth, integration
  "https://www.zoho.com/salesiq/help/developer-section/zobot-webhook-request-response-format-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-section/zobot-webhook-integration-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-section/zobot-webhook-authentication-2.0.html",
  // Handlers and actions
  "https://www.zoho.com/salesiq/help/developer-guides/bot-siq-scripts-message-handler-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-guides/bot-siq-scripts-trigger-handler-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-guides/bot-siq-scripts-context-handler-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-guides/bot-siq-scripts-zobot-actions-forward-2.0.html",
  "https://www.zoho.com/salesiq/help/developer-guides/bot-siq-scripts-zobot-actions-context-2.0.html",
  // Visitor JS API — the source of our custom_info context
  "https://www.zoho.com/salesiq/help/developer-section/js-api-visitor-info.html",
];

interface ZohoDoc {
  id: string;
  url: string;
  title: string;
  text: string;
  wordCount: number;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/**
 * HTML → plain text. Deliberately blunt: strips script/style/nav, collapses
 * tags to whitespace. The result is fed to a model as reference material, not
 * rendered, so structure matters far less than removing markup noise.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
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

function titleOf(html: string, url: string): string {
  const raw = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!raw) return url.split("/").pop()?.replace(/\.html$/, "") ?? url;
  // Zoho suffixes most titles with " | ... - Zoho SalesIQ"; drop the boilerplate.
  return raw.split("|")[0].split(" - Zoho")[0].trim() || raw;
}

/** Stable id from the URL slug, so ids survive re-exports. */
function idOf(url: string): string {
  return (
    url
      .split("/")
      .pop()
      ?.replace(/\.html$/, "")
      .replace(/[^a-z0-9-]/gi, "-") ?? url
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  console.log(`Fetching ${DOC_URLS.length} Zoho documentation page(s)…\n`);

  const docs: ZohoDoc[] = [];
  const failures: string[] = [];

  for (const url of DOC_URLS) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; growqr-docs-export)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        failures.push(`${res.status} ${url}`);
        console.log(`  ✗ ${res.status}  ${url}`);
        continue;
      }
      const html = await res.text();
      const text = htmlToText(html);
      if (text.length < 200) {
        failures.push(`too short (${text.length} chars) ${url}`);
        console.log(`  ✗ only ${text.length} chars  ${url}`);
        continue;
      }
      const doc: ZohoDoc = {
        id: idOf(url),
        url,
        title: titleOf(html, url),
        text,
        wordCount: text.split(/\s+/).length,
      };
      docs.push(doc);
      console.log(`  ✓ ${String(doc.wordCount).padStart(5)} words  ${doc.title}`);
    } catch (error) {
      failures.push(`${error instanceof Error ? error.message : String(error)} ${url}`);
      console.log(`  ✗ ${error instanceof Error ? error.message : String(error)}  ${url}`);
    }
    await sleep(DELAY_MS);
  }

  if (!docs.length) fail("no pages fetched — refusing to write an empty snapshot");

  // A partial corpus silently shipping is how grounding quietly degrades:
  // the model stops seeing a page and starts guessing about it instead.
  if (failures.length) {
    console.log(`\n⚠ ${failures.length} page(s) failed and are NOT in the snapshot:`);
    for (const f of failures) console.log(`    ${f}`);
  }

  docs.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(OUT_PATH, `${JSON.stringify({ fetchedAt: new Date().toISOString(), docs }, null, 2)}\n`);

  const words = docs.reduce((n, d) => n + d.wordCount, 0);
  console.log(`\n✓ Wrote ${docs.length} page(s), ${words} words → lib/ai/zoho-docs-snapshot.json\n`);
  console.log(`  Roughly ${Math.round((words * 4) / 3 / 100) * 100} tokens if passed whole —`);
  console.log(`  retrieval keeps only the top matches per query (lib/ai/retrieval.ts).\n`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
