import "server-only";
import { run } from "./db";
import { sha256 } from "./security";
import type { ScoredResult } from "../qrscore";

/** The first non-empty line of the resume, as the PHP store guessed the candidate name. */
export function guessName(text: string): string | null {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t !== "") return t.slice(0, 255);
  }
  return null;
}

/** Keep the anonymous scoring corpus growing (port of Database::save into qr_submissions). Never throws, never blocks the visitor. */
export async function saveSubmission(res: ScoredResult, meta: { filename?: string | null; ip?: string; userAgent?: string }): Promise<void> {
  try {
    const text = res.extraction.text ?? "";
    const slim = { ...res, extraction: { ...res.extraction, text: undefined } };
    const section1 = (res.sections?.[0] as { section_score?: number } | undefined)?.section_score ?? null;
    await run(
      `INSERT INTO qr_submissions (created_at, candidate_name, source, filename, extraction_method, confidence, text_length, career_stage, years_experience, domain, overall_score, grade,
         section1_score, resume_text, result_json, profile_json, ip_hash, user_agent)
       VALUES (LOCALTIMESTAMP(0), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [guessName(text), res.extraction.source ?? null, meta.filename ?? null, res.extraction.method ?? null, res.extraction.confidence ?? null, res.extraction.text_length ?? null,
        (res.career as { stage?: string }).stage ?? null, Math.trunc(Number((res.career as { yearsExperience?: number }).yearsExperience ?? 0)) || null, (res.domain as { key?: string }).key ?? null,
        res.overall.score, res.grade, section1, text, JSON.stringify(slim), res.profile ? JSON.stringify(res.profile) : null, meta.ip ? sha256(meta.ip) : null, (meta.userAgent ?? "").slice(0, 255) || null],
    );
  } catch (e) {
    console.error("resume-score save:", (e as Error).message);
  }
}

/** Up to three recommended courses across the sections (title, category, url). */
export function courseIdeas(res: ScoredResult): Array<{ title: string; cat: string; url: string }> {
  const out = new Map<string, { title: string; cat: string; url: string }>();
  for (const s of res.sections ?? []) {
    for (const r of ((s as { recommendations?: Array<Record<string, unknown>> }).recommendations ?? [])) {
      const url = String(r.url ?? "");
      const title = String(r.title ?? "");
      if (url && title) out.set(url, { title, cat: String(r.category ?? ""), url });
    }
  }
  return [...out.values()].slice(0, 3);
}
