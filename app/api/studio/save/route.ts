import { isResponse, out, rate, studentJson } from "@/lib/studio/api";
import { isScored, scoreText } from "@/lib/qrscore";
import { tx } from "@/lib/portal/db";
import * as passport from "@/lib/portal/passport/profile";
import * as resumes from "@/lib/portal/passport/resumes";
import { phpRound } from "@/lib/qrscore/php";
import * as access from "@/lib/studio/access";
import { normalize } from "@/lib/studio/resume-data";
import { run as score } from "@/lib/studio/scorer";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";

export const dynamic = "force-dynamic";

class Cooldown extends Error {
  constructor(public wait: number) {
    super("cooldown");
  }
}

// Save an update (a numbered version with its score), or apply a saved version to the Skill Passport.
// The free 24-hour limit and the Pro-only templates are enforced HERE, on the server.
export async function POST(req: Request) {
  const ctx = await studentJson(req);
  if (isResponse(ctx)) return ctx;
  const limited = rate(ctx.sessionId, "save", 20);
  if (limited) return limited;
  const { me, input } = ctx;
  const uid = me.id;
  const act = String(input.act ?? "save");

  if (act === "apply") {
    const v = await store.version(uid, Math.trunc(Number(input.version ?? 0)) || 0);
    if (!v) return out({ ok: false, error: "That version was not found." }, 404);
    const res = scoreText(v.text_body);
    if (!isScored(res)) return out({ ok: false, error: "That version could not be scored. Add more detail and save again." }, 422);
    await passport.saveResult(uid, res, "Resume Studio", v.text_body);
    await resumes.saveAccepted(uid, res, v.text_body, {});
    return out({ ok: true, score: phpRound(Number(res.overall.score), 1), message: "Your Skill Passport now uses this version." });
  }

  const resume = await store.find(uid, Math.trunc(Number(input.id ?? 0)) || 0);
  const tpl = templates.get(String(input.template ?? ""));
  if (!resume || !tpl) return out({ ok: false, error: "That resume was not found." }, 404);
  const pro = await access.isPro(uid);
  if (!(await access.canUseTemplate(uid, tpl.id, pro))) return out({ ok: false, locked: true, error: "This template is part of Resume Studio Pro." }, 402);
  const data = normalize(input.data ?? []);
  const scored = score(data, tpl);
  if (!scored.scored) return out({ ok: false, error: scored.message ?? "Add more detail before saving." }, 422);

  try {
    const saved = await tx(async (c) => {
      // Serialise this user's saves so two quick clicks cannot both pass the 24-hour check.
      await c.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [uid]);
      const wait = await access.secondsUntilNextSave(uid, pro, c);
      if (wait > 0) throw new Cooldown(wait);
      const prev = (await c.query("SELECT score FROM studio_versions WHERE resume_id = $1 ORDER BY id DESC LIMIT 1", [resume.id])).rows[0] as { score: string | null } | undefined;
      await store.saveDraft(uid, resume.id, tpl.id, data, c);
      const vid = await store.addVersion(uid, resume.id, "save", tpl.id, data, scored, c);
      return { vid, prev: prev?.score ?? null };
    });
    return out({
      ok: true, version: saved.vid, score: scored.score, grade: scored.grade,
      delta: saved.prev !== null ? phpRound((scored.score as number) - Number(saved.prev), 1) : null,
      wait: await access.secondsUntilNextSave(uid, pro), pro,
    });
  } catch (e) {
    if (e instanceof Cooldown) {
      return out({ ok: false, cooldown: true, wait: e.wait, error: `Free plan: one saved update every ${access.cooldownHours()} hours. Your next one is in ${access.countdown(e.wait)}, or go Pro for unlimited updates.` }, 429);
    }
    console.error("studio save:", e instanceof Error ? e.message : e);
    return out({ ok: false, error: "Could not save right now. Please try again." }, 500);
  }
}
