import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import * as docx from "@/lib/studio/docx";
import { esc, html } from "@/lib/studio/renderer";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";

export const dynamic = "force-dynamic";

const text = (body: string, status: number) => new NextResponse(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });

// Download a SAVED version: print / PDF, Word, or plain text. You always keep what you saved, even if Pro lapses.
export async function GET(req: Request) {
  if (!databaseConfigured()) return text("Resume Studio is not available right now.", 503);
  const s = await getSession();
  if (!s?.user || s.user.role !== "student") return NextResponse.redirect(new URL("/login?next=/studio", req.url), 303);
  const q = new URL(req.url).searchParams;
  const vid = /^\d{1,9}$/.test(q.get("v") ?? "") ? Number(q.get("v")) : 0;
  const v = vid ? await store.version(s.user.id, vid) : null;
  if (!v) return text("Version not found.", 404);
  const tpl = templates.get(v.template) ?? templates.get("chrono-classic")!;
  const name = v.data.personal.name.trim().replace(/[^A-Za-z0-9]+/g, "-") || "resume";
  const fmt = q.get("fmt") ?? "print";
  const base = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

  if (fmt === "txt") {
    return new NextResponse(v.text_body, { headers: { ...base, "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-resume.txt"` } });
  }
  if (fmt === "docx") {
    const bytes = docx.build(v.data, tpl);
    return new NextResponse(Buffer.from(bytes), {
      headers: { ...base, "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${name}-resume.docx"` },
    });
  }
  const paper = tpl.paper === "Letter" ? "letter" : "A4";
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(name)} - Resume</title>
<link rel="stylesheet" href="/studio/studio-tpl.css?v=1">
<style>
@page { size: ${paper}; margin: 0; }
html, body { margin: 0; background: #e5e7eb; }
.bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: space-between; padding: 10px 16px; background: #111827; color: #fff; font: 15px/1.4 system-ui, sans-serif; }
.bar button, .bar a { min-height: 44px; padding: 0 18px; border-radius: 10px; border: 0; background: #4338ca; color: #fff; font: 600 15px system-ui, sans-serif; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
.bar a.alt { background: #374151; }
.sheet { margin: 18px auto; width: max-content; max-width: 100%; box-shadow: 0 8px 30px rgba(0, 0, 0, .25); overflow-x: auto; }
@media print { html, body { background: #fff; } .bar { display: none; } .sheet { margin: 0; box-shadow: none; overflow: visible; } }
</style>
</head>
<body>
<div class="bar"><span>To get a PDF: press <b>Print / Save as PDF</b>, choose &ldquo;Save as PDF&rdquo;, and set margins to None.</span>
<span><button type="button" data-print>Print / Save as PDF</button> <a class="alt" href="/studio/edit/${Number(v.resume_id)}">Back to editor</a></span></div>
<div class="sheet">${html(v.data, tpl)}</div>
<script src="/studio/studio-print.js" defer></script>
</body>
</html>
`;
  return new NextResponse(page, { headers: { ...base, "Content-Type": "text/html; charset=utf-8" } });
}
