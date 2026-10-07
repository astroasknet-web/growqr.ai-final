export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { SKILLS_THAT_TRAVEL_HTML } from "./template";

const POSTER_URL = `${SITE_URL}/events/skills-that-travel-poster.jpg`;
const RSVP_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSekwcK5RuaQmOqDUdFOuNXsWHB-SIgAMayNl-l4sCVvB8g3cA/viewform?usp=send_form";

const isHttpUrl = (u: string): boolean => {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
};

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Serves the "Skills That Travel" invite as a public HTML page for Zoho
 * Campaigns' content_url (same pattern as /campaign/mail-1).
 *
 *   /campaign/skills-that-travel                     defaults to the real
 *   RSVP form; pass ?rsvp=https://… to override, ?name=Dr.%20Sharma to preview.
 *   …&mode=campaigns   emits the $[FNAME]$ merge tag instead of a literal
 *   name, for the real Zoho send. No custom unsubscribe tag — Zoho injects
 *   its own working footer link below custom HTML content.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rsvp = sp.get("rsvp") ?? RSVP_URL;
  const forZoho = sp.get("mode") === "campaigns";

  if (!isHttpUrl(rsvp)) {
    return new Response("Cannot render: rsvp must be a full http(s) URL", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const name = forZoho ? "$[FNAME|Educator|Educator]$" : escapeHtml(sp.get("name") ?? "Educator");

  const html = SKILLS_THAT_TRAVEL_HTML
    .replaceAll("{{greeting_name}}", name)
    .replaceAll("{{rsvp_url}}", escapeHtml(rsvp))
    .replaceAll("{{poster_url}}", POSTER_URL);

  const left = [...new Set(html.match(/\{\{\w+\}\}/g) ?? [])];
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
