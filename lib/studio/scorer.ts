import { adviceFromAreas, gateMessage, isScored, scoreText, type ScoredResult } from "@/lib/qrscore";
import type { Area } from "@/lib/qrscore/advice";
import { phpRound } from "@/lib/qrscore/php";
import { toText, wordCount, type ResumeData } from "./resume-data";
import type { Template } from "./templates";

/** Score a studio resume with the same engine as the Skill Passport, on exactly the text that will be exported (port of Studio\Scorer). */
export interface Scored {
  scored: boolean;
  text: string;
  words: number;
  message?: string;
  result?: ScoredResult;
  score?: number;
  grade?: string;
  sections?: Array<{ name: string; pct: number }>;
  tips?: Array<{ name: string; reason: string }>;
  years?: number | null;
}

export function run(d: ResumeData, tpl: Template): Scored {
  const text = toText(d, tpl.region);
  const words = wordCount(text);
  if (words < 25) return { scored: false, text, words, message: "Add a few more details (a summary, a job or your education) and your score will appear." };
  const res = scoreText(text);
  if (!isScored(res)) return { scored: false, text, words, message: gateMessage(res.gate ?? {}) };
  // Section-level numbers only. Individual checks, weights and points are never sent to the browser.
  const sections: Array<{ name: string; pct: number }> = [];
  const areas: Area[] = [];
  for (const s of res.sections ?? []) {
    if (!s.applicable) continue;
    const pts = Number(s.points_per_section ?? 20);
    const pct = Math.trunc(phpRound((Number(s.section_score) / Math.max(1, pts)) * 100));
    sections.push({ name: String(s.name), pct });
    areas.push({ id: Math.trunc(Number(s.id ?? 0)), pct, applicable: true });
  }
  const tips = adviceFromAreas(areas, 3).map((a) => ({ name: a.title, reason: a.text }));
  const years = res.career?.yearsExperience;
  return {
    scored: true, text, words, result: res,
    score: phpRound(Number(res.overall.score), 1), grade: String(res.grade ?? ""),
    sections, tips,
    years: years !== undefined && years !== null ? Math.trunc(Number(years)) : null,
  };
}
