export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  CAMPAIGNS, UNSUBSCRIBE, render, unresolved, isHttpUrl,
} from "@/lib/campaign/campaign";

/**
 * Serves the demo-day email as a public HTML page.
 *
 * Zoho Campaigns' createCampaign API takes its body via `content_url` rather
 * than inline, so the HTML has to be fetchable. Serving it from a route with
 * query parameters means a new wave needs no deploy: the college and both links
 * vary per demo, and Zoho fetches the rendered result once at campaign
 * creation.
 *
 *   /campaign/mail-1?college=JNU%20Jaipur&cta=https://…&guide=https://…
 *   …&mode=campaigns   emits Zoho merge tags instead of literal values
 *
 * Every value is escaped by render() before it reaches the markup. The page is
 * noindex because it is plumbing, not content.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const campaign = CAMPAIGNS["mail-1-institutional-signup"];

  const cta = sp.get("cta") ?? "";
  const guide = sp.get("guide") ?? "";
  const college = sp.get("college") ?? "";
  /* Campaigns mails one body to the whole list and fills per-contact values
     itself, so the recipient address must be its merge tag, not a literal. */
  const forZoho = sp.get("mode") === "campaigns";

  const bad = [
    !isHttpUrl(cta) && "cta must be a full http(s) URL",
    !isHttpUrl(guide) && "guide must be a full http(s) URL",
  ].filter(Boolean);
  if (bad.length) {
    return new Response(`Cannot render: ${bad.join("; ")}`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  /* $[FNAME|a|b]$ is Zoho's fallback form: a for email, b for social. Both are
     "Aspirant", which is exactly what the copy said before it was personalised,
     so a contact with no first name is no worse off than yesterday. */
  let html = render(
    campaign,
    {
      email: forZoho ? "$[EMAIL]$" : "",
      college,
      firstName: forZoho ? "$[FNAME|Aspirant|Aspirant]$" : "",
    },
    { cta_url: cta, guide_url: guide },
  );

  /* Unsubscribe is handed to Zoho in campaigns mode: it owns the do-not-mail
     registry, so its link actually suppresses future sends. Ours is a mailto
     someone has to action by hand. */
  if (forZoho) html = html.split(UNSUBSCRIBE).join("$[UNSUBSCRIBE]$");

  /* Zoho mails whatever this returns, so a surviving {{placeholder}} would
     reach real students. Fail loudly rather than send it. */
  const left = unresolved(html);
  if (left.length) {
    return new Response(`Cannot render: unresolved ${left.join(", ")}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
