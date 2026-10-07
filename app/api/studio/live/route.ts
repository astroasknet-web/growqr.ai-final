import { isResponse, out, rate, studentJson } from "@/lib/studio/api";
import * as access from "@/lib/studio/access";
import { analyze } from "@/lib/studio/job-match";
import { atsNotes, html } from "@/lib/studio/renderer";
import { normalize } from "@/lib/studio/resume-data";
import { run as score } from "@/lib/studio/scorer";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";

export const dynamic = "force-dynamic";

// Live editor call: returns the rendered preview and the score for what is typed right now. Autosaves the draft.
// Never counts as a "saved update" and is not limited by the free 24-hour rule.
export async function POST(req: Request) {
  const ctx = await studentJson(req);
  if (isResponse(ctx)) return ctx;
  const limited = rate(ctx.sessionId, "live", 150);
  if (limited) return limited;
  const { me, input } = ctx;

  const resume = await store.find(me.id, Math.trunc(Number(input.id ?? 0)) || 0);
  const tpl = templates.get(String(input.template ?? ""));
  if (!resume || !tpl) return out({ ok: false, error: "That resume was not found." }, 404);
  if (!(await access.canUseTemplate(me.id, tpl.id))) return out({ ok: false, locked: true, error: "This template is part of Resume Studio Pro." }, 402);
  const data = normalize(input.data ?? []);
  await store.saveDraft(me.id, resume.id, tpl.id, data);
  const s = score(data, tpl);
  const jd = String(input.jd ?? "").trim();
  return out({
    ok: true,
    html: html(data, tpl),
    paper: tpl.paper,
    scored: s.scored, message: s.message ?? null,
    score: s.score ?? null, grade: s.grade ?? null, sections: s.sections ?? [], tips: s.tips ?? [],
    words: s.words, pages: Math.max(1, Math.ceil(s.words / 520)),
    ats: atsNotes(data, tpl),
    region_fields: tpl.personal,
    jd: jd !== "" ? analyze(jd, s.text, s.years ?? null) : null,
  });
}
