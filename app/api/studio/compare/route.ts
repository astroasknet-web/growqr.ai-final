import { isResponse, out, rate, studentJson } from "@/lib/studio/api";
import * as diff from "@/lib/studio/diff";
import * as store from "@/lib/studio/store";

export const dynamic = "force-dynamic";

// Before / after: two saved versions side by side, with a line-by-line diff of the exported text.
export async function POST(req: Request) {
  const ctx = await studentJson(req);
  if (isResponse(ctx)) return ctx;
  const limited = rate(ctx.sessionId, "compare", 60);
  if (limited) return limited;
  const { me, input } = ctx;
  const a = await store.version(me.id, Math.trunc(Number(input.a ?? 0)) || 0);
  const b = await store.version(me.id, Math.trunc(Number(input.b ?? 0)) || 0);
  if (!a || !b) return out({ ok: false, error: "Those versions were not found." }, 404);
  const d = diff.lines(a.text_body, b.text_body);
  const pack = (v: store.VersionRow) => ({ id: v.id, kind: v.kind, score: v.score !== null ? Number(v.score) : null, grade: v.grade, words: Number(v.words), sections: v.sections, when: v.created_at });
  return out({ ok: true, a: pack(a), b: pack(b), diff: d, stats: diff.stats(d) });
}
