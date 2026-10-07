/**
 * Renders every GrowQR Advisory (expert session) email into one browsable page.
 *
 *   npx tsx scripts/build-expert-email-preview.ts [outfile]
 *
 * Built from the same `build*` functions the send path calls, so the preview
 * can never show a version of an email that is not the one we actually send.
 *
 * The missed-session follow-up is rendered three times, against three
 * different experts, because that template is the one whose whole point is
 * that it is not written per expert.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildUserConfirmation } from "@/features/experts/emails/userConfirmation";
import { buildExpertNotification } from "@/features/experts/emails/expertNotification";
import { buildSupportNotification } from "@/features/experts/emails/supportNotification";
import { buildSessionReminder } from "@/features/experts/emails/sessionReminder";
import { buildMissedSessionEmail } from "@/features/experts/emails/missedSession";
import { getExpertBySlug } from "@/features/experts/data/experts-data";
import type { BuiltEmail } from "@/features/experts/emails/shell";
import { inlineLogo } from "./lib-preview-logo";

const out = process.argv[2] ?? "public/internal/expert-email-preview.html";

/* ─── Sample booking, fixed so the page is byte-stable between runs ─── */

const SESSION_START = "2026-08-31T04:30:00.000Z"; // Mon 31 Aug 2026, 10:00 am IST
const MEET = "https://meet.google.com/abc-defg-hij";

const SEEKER = { userName: "Vanapalli Madhu Kishore", userEmail: "seeker@example.com" };
const TOPIC = "Career direction after graduation";

/** The expert whose name and slug carry a given card. */
function expert(slug: string) {
  const found = getExpertBySlug(slug);
  if (!found) throw new Error(`Unknown expert slug in preview data: ${slug}`);
  return found;
}

interface Card {
  id: string;
  name: string;
  trigger: string;
  audience: "seeker" | "expert" | "team";
  automatic: boolean;
  mail: BuiltEmail;
}

const ruchi = expert("ruchi-sharma");

const CATALOGUE: Card[] = [
  {
    id: "confirmation",
    name: "Booking confirmation",
    trigger: "Payment verified and the slot is held.",
    audience: "seeker",
    automatic: true,
    mail: buildUserConfirmation({
      ...SEEKER,
      expertName: ruchi.name,
      sessionTopic: TOPIC,
      sessionStart: SESSION_START,
      meetingUrl: MEET,
    }),
  },
  {
    id: "expert-notification",
    name: "New booking, to the expert",
    trigger: "Same moment as the confirmation.",
    audience: "expert",
    automatic: true,
    mail: buildExpertNotification({
      expertName: ruchi.name,
      expertEmail: ruchi.email ?? "",
      ...SEEKER,
      userPhone: "+91 98765 43210",
      sessionTopic: TOPIC,
      sessionStart: SESSION_START,
      meetingUrl: MEET,
    }),
  },
  {
    id: "support-notification",
    name: "New booking, to support",
    trigger: "Internal copy of every booking.",
    audience: "team",
    automatic: true,
    mail: buildSupportNotification({
      expertName: ruchi.name,
      ...SEEKER,
      userPhone: "+91 98765 43210",
      sessionTopic: TOPIC,
      sessionStart: SESSION_START,
      meetingUrl: MEET,
    }),
  },
  {
    id: "reminder-24h-seeker",
    name: "Reminder, 24h, to the seeker",
    trigger: "Queued at Resend for 24 hours before the start.",
    audience: "seeker",
    automatic: true,
    mail: buildSessionReminder({
      stage: "24h",
      audience: "attendee",
      expertName: ruchi.name,
      userName: SEEKER.userName,
      sessionStart: SESSION_START,
      meetingUrl: MEET,
    }),
  },
  {
    id: "reminder-1h-expert",
    name: "Reminder, 1h, to the expert",
    trigger: "Queued at Resend for 1 hour before the start.",
    audience: "expert",
    automatic: true,
    mail: buildSessionReminder({
      stage: "1h",
      audience: "expert",
      expertName: ruchi.name,
      userName: SEEKER.userName,
      sessionStart: SESSION_START,
      meetingUrl: null,
    }),
  },
];

/* The same template, three experts. Nothing below is expert-specific copy. */
for (const slug of ["ruchi-sharma", "kharanshu-sharma", "ankur-bansal"]) {
  const e = expert(slug);
  CATALOGUE.push({
    id: `missed-${slug}`,
    name: `Missed session, ${e.name}`,
    trigger: "Reviewer sends after a seeker does not join.",
    audience: "seeker",
    automatic: false,
    mail: buildMissedSessionEmail({
      ...SEEKER,
      expertName: e.name,
      expertSlug: e.slug,
      sessionTopic: TOPIC,
      sessionStart: SESSION_START,
    }),
  });
}

/* ─── Page ─── */

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const AUDIENCE_LABEL = {
  seeker: "To the seeker",
  expert: "To the expert",
  team: "To the team",
} as const;

const cards = CATALOGUE.map(
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
          <span class="tag ${e.audience}">${AUDIENCE_LABEL[e.audience]}</span>
          <span class="tag ${e.automatic ? "auto" : "manual"}">${e.automatic ? "Automatic" : "Reviewer sends"}</span>
        </div>
      </div>
      <div class="subject">
        <span class="subject-label">Subject</span>
        <span class="subject-text">${esc(e.mail.subject)}</span>
      </div>
      <div class="frame-wrap">
        <iframe title="${esc(e.name)} preview" loading="lazy" srcdoc="${esc(inlineLogo(e.mail.html))}"></iframe>
      </div>
    </article>`,
).join("\n");

const nav = CATALOGUE.map(
  (e, i) => `<a href="#${esc(e.id)}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(e.name)}</a>`,
).join("\n");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Expert Session Emails</title>
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
  .tag.seeker{background:#FFF5EE;color:#B8460F;border-color:#F7D9C6;}
  .tag.expert{background:#EEF2FF;color:#3730A3;border-color:#D8DEF7;}
  .tag.team{background:#F1F5F9;color:#334155;border-color:#DCE3EA;}
  .tag.auto{background:#E9F6F0;color:#0E7C5A;border-color:#C7E5D8;}
  .tag.manual{background:#F5F5F2;color:#525252;}
  .subject{display:flex;gap:11px;align-items:baseline;padding:11px 22px;background:var(--cream);border-top:1px solid var(--line);border-bottom:1px solid var(--line);flex-wrap:wrap;}
  .subject-label{font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink4);}
  .subject-text{font-size:14px;font-weight:500;}
  .frame-wrap{background:#F3F4F6;}
  iframe{display:block;width:100%;height:760px;border:0;background:#F3F4F6;}
  @media(max-width:860px){.shell{grid-template-columns:1fr}aside{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}}
</style>
</head>
<body>
<div class="shell">
  <aside>
    <h1>Expert Session Emails</h1>
    <p class="sub">${CATALOGUE.length} renders, straight from the send path.</p>
    <nav>${nav}</nav>
  </aside>
  <main>
    <p class="lede">Every email the expert booking flow sends, from confirmation through to the missed-session follow-up. Each preview is the real template rendered live, not a mockup. The last three are one template rendered against three different experts.</p>
    ${cards}
  </main>
</div>
</body>
</html>`;

mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), page);
console.log(`${CATALOGUE.length} emails rendered to ${out}`);
