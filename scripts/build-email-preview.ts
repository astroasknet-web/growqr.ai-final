/**
 * Renders every internship email into one browsable preview page.
 *
 * Generated from EMAIL_CATALOGUE rather than hand-written, so the preview can
 * never show a version of an email that is not the one we actually send.
 *
 *   npx tsx scripts/build-email-preview.ts [outfile]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { EMAIL_CATALOGUE } from "@/lib/internship/emails";
import { inlineLogo } from "./lib-preview-logo";

const out = process.argv[2] ?? "public/internal/email-preview.html";
const built = EMAIL_CATALOGUE.map((e) => {
  const mail = e.build();
  return { ...e, ...mail, html: inlineLogo(mail.html) };
});

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cards = built
  .map(
    (e, i) => `
    <article class="mail" id="${esc(e.id)}">
      <div class="mail-head">
        <div class="mail-id">
          <span class="idx">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h2>${esc(e.name)}</h2>
            <p class="trigger">${esc(e.trigger)}</p>
          </div>
        </div>
        <div class="tags">
          <span class="tag ${e.audience === "team" ? "team" : "cand"}">${e.audience === "team" ? "To the team" : "To the candidate"}</span>
          <span class="tag ${e.automatic ? "auto" : "manual"}">${e.automatic ? "Automatic" : "Reviewer sends"}</span>
        </div>
      </div>
      <div class="subject">
        <span class="subject-label">Subject</span>
        <span class="subject-text">${esc(e.subject)}</span>
      </div>
      <div class="frame-wrap">
        <iframe title="${esc(e.name)} preview" loading="lazy" srcdoc="${esc(e.html)}"></iframe>
      </div>
    </article>`,
  )
  .join("\n");

const nav = built
  .map((e, i) => `<a href="#${esc(e.id)}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(e.name)}</a>`)
  .join("\n");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Internship Emails</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root {
    --orange:#FF6A2F; --ink:#1A1A1A; --ink3:#525252; --ink4:#8A8A8A;
    --cream:#FAFAF8; --line:#E8E6E1; --surface:#FFFFFF;
    --sans:"Poppins",system-ui,sans-serif; --mono:"IBM Plex Mono",monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--sans);}
  .shell{display:grid;grid-template-columns:250px 1fr;min-height:100vh;}
  aside{border-right:1px solid var(--line);padding:34px 22px;position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--surface);}
  aside h1{font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 4px;}
  aside .sub{font-size:12px;color:var(--ink4);margin:0 0 22px;line-height:1.5;}
  aside a{display:flex;gap:10px;align-items:baseline;text-decoration:none;color:var(--ink3);font-size:13.5px;padding:7px 9px;border-radius:7px;line-height:1.35;}
  aside a:hover{background:var(--cream);color:var(--ink);}
  aside a:focus-visible{outline:2px solid var(--orange);outline-offset:2px;}
  aside a span{font-family:var(--mono);font-size:11px;color:var(--ink4);flex:none;}
  main{padding:34px clamp(20px,4vw,44px) 90px;max-width:1000px;}
  .lede{font-size:14.5px;color:var(--ink3);line-height:1.6;margin:0 0 30px;max-width:64ch;}
  .mail{background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:28px;overflow:hidden;scroll-margin-top:20px;}
  .mail-head{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:flex-start;padding:20px 22px 16px;}
  .mail-id{display:flex;gap:13px;align-items:baseline;}
  .idx{font-family:var(--mono);font-size:12px;color:var(--orange);font-weight:500;}
  .mail h2{font-size:16.5px;font-weight:600;letter-spacing:-0.015em;margin:0;}
  .trigger{font-size:13px;color:var(--ink4);margin:3px 0 0;line-height:1.5;}
  .tags{display:flex;gap:7px;flex-wrap:wrap;}
  .tag{font-family:var(--mono);font-size:11px;padding:4px 10px;border-radius:999px;border:1px solid var(--line);white-space:nowrap;}
  .tag.cand{background:#FFF5EE;color:#B8460F;border-color:#F7D9C6;}
  .tag.team{background:#F1F5F9;color:#334155;border-color:#DCE3EA;}
  .tag.auto{background:#E9F6F0;color:#0E7C5A;border-color:#C7E5D8;}
  .tag.manual{background:#F5F5F2;color:#525252;}
  .subject{display:flex;gap:11px;align-items:baseline;padding:11px 22px;background:var(--cream);border-top:1px solid var(--line);border-bottom:1px solid var(--line);flex-wrap:wrap;}
  .subject-label{font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink4);}
  .subject-text{font-size:14px;font-weight:500;}
  .frame-wrap{background:#F3F4F6;}
  iframe{display:block;width:100%;height:660px;border:0;background:#F3F4F6;}
  @media(max-width:860px){.shell{grid-template-columns:1fr}aside{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}}
</style>
</head>
<body>
<div class="shell">
  <aside>
    <h1>Internship Emails</h1>
    <p class="sub">${built.length} templates, rendered exactly as they send.</p>
    <nav>${nav}</nav>
  </aside>
  <main>
    <p class="lede">Every email the internship pipeline sends, from application through to outcome. Each preview below is the real template rendered live, not a mockup.</p>
    ${cards}
  </main>
</div>
</body>
</html>`;

mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), page);
console.log(`${built.length} emails rendered to ${out}`);
