import { asciiLower, byteLen, mbHead, phpRound, phpTrim, rx, trimChars } from "../qrscore/php";
import { NEWLINE } from "./diff";
import skillData from "./data/studio-skills.json";

/**
 * Compare a job description with a resume, deterministically and honestly (port of PHP Studio\JobMatch). It finds the
 * skills and keywords the job asks for, says which the resume already mentions and which it does not, and offers tips.
 * It never writes content for the student: a missing keyword is only worth adding if it is TRUE.
 */
const STOP =
  "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not of off on once only or other our out over own same she should so some such than that the their theirs them then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your " +
  "able experience years year work working team role position job candidate company looking strong including etc ability skills required preferred responsibilities requirements qualifications must will need needs include plus bonus good great excellent new using use used knowledge understanding across within well";

export type Level = "must" | "standard" | "nice";
export interface Found { term: string; count: number; level: Level; in_resume: boolean }
export interface Analysis {
  coverage: number;
  matched: Found[];
  missing: Found[];
  extra_matched: string[];
  extra_missing: string[];
  tips: string[];
  total: number;
  years_asked: number | null;
}

interface Dict { skills: string[]; aliases: Record<string, string> }
let dictCache: Dict | null = null;
function dict(): Dict {
  if (!dictCache) {
    const j = skillData as { skills?: string[]; aliases?: Record<string, string> };
    dictCache = { skills: [...new Set((j.skills ?? []).map(asciiLower))], aliases: j.aliases ?? {} };
  }
  return dictCache;
}

function norm(s: string): string {
  const lower = asciiLower(s).replace(/[^\p{L}\p{N}+#./\- ]+/gu, " ");
  return " " + phpTrim(lower.replace(rx(String.raw`\s+`, "g"), " ")) + " ";
}

function has(normText: string, term: string): boolean {
  return normText.includes(" " + term + " ") || normText.includes(" " + term + ".") || normText.includes(" " + term + ",");
}

const canon = (term: string): string => (Object.hasOwn(dict().aliases, term) ? dict().aliases[term] : term);

/** substr_count(): non-overlapping occurrences. */
function countSub(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

export function analyze(jdIn: string, resumeText: string, resumeYears: number | null = null): Analysis {
  const jd = mbHead(jdIn, 8000);
  const jdN = norm(jd);
  let cvN = norm(resumeText);
  // Resume side: also expand aliases ("js" counts for javascript).
  for (const [short, long] of Object.entries(dict().aliases)) {
    if (has(cvN, short) && !has(cvN, long)) cvN += long + " ";
  }
  // Which lines are requirements and which are nice to have? A heading such as "Requirements:" or "Preferred:" sets the
  // mode for the lines under it; a line can also say so itself ("must have...", "...is a plus").
  let must = "";
  let nice = "";
  let mode: Level = "standard";
  for (const line of jd.split(NEWLINE)) {
    const l = asciiLower(phpTrim(line));
    if (l === "") continue;
    const isHeading = byteLen(l) <= 60 && (l.endsWith(":") || !/[.,;]/.test(l)) && !/^[-*•]/u.test(l);
    if (isHeading && /\b(requirements?|qualifications?|must[- ]haves?|what you.?ll need|what we.?re looking for|you have|essential|minimum)\b/.test(l)) { mode = "must"; continue; }
    if (isHeading && /\b(preferred|nice to haves?|bonus|desirable|good to have|a plus|advantage)\b/.test(l)) { mode = "nice"; continue; }
    if (isHeading && /\b(responsibilit|you will|the role|about|benefits|what we offer|duties|overview)\b/.test(l)) { mode = "standard"; continue; }
    let inline: Level = /\b(preferred|nice to have|bonus|plus|desirable|an advantage|good to have)\b/.test(l)
      ? "nice"
      : /\b(required|must|mandatory|essential|minimum)\b/.test(l) ? "must" : mode;
    // "Preferred: Python, A/B testing" on one line.
    if (rx(String.raw`^(preferred|nice to have|bonus|desirable)\s*[:\-]`).test(l)) inline = "nice";
    if (inline === "nice") nice += " " + norm(line);
    else if (inline === "must") must += " " + norm(line);
  }

  const found = new Map<string, Found>();
  const skills = [...dict().skills].sort((a, b) => byteLen(b) - byteLen(a));
  for (const sk of [...skills, ...Object.keys(dict().aliases)]) {
    const c = canon(sk);
    if (found.has(c) || !has(jdN, sk)) continue;
    const count = countSub(jdN, " " + sk + " ") + countSub(jdN, " " + sk + ".") + countSub(jdN, " " + sk + ",");
    const level: Level = must !== "" && has(must, sk) ? "must" : nice !== "" && has(nice, sk) ? "nice" : count >= 2 ? "must" : "standard";
    found.set(c, { term: c, count, level, in_resume: has(cvN, c) || has(cvN, sk) });
  }
  // Weighted coverage: required skills count double.
  let w = 0;
  let hit = 0;
  for (const f of found.values()) {
    const wt = f.level === "must" ? 2 : f.level === "nice" ? 0.5 : 1;
    w += wt;
    hit += f.in_resume ? wt : 0;
  }
  const coverage = w > 0 ? Math.trunc(phpRound((hit / w) * 100)) : 0;

  // Other repeated keywords that are not in the skills list (domain words).
  const stop = new Set(phpTrim(STOP).split(" "));
  const words = new Map<string, number>();
  for (const raw of phpTrim(jdN).split(" ")) {
    const wd = trimChars(raw, ".,-/");
    if (byteLen(wd) >= 4 && !stop.has(wd) && !/^[0-9]+$/.test(wd)) words.set(wd, (words.get(wd) ?? 0) + 1);
  }
  const inSkills = new Set<string>();
  for (const f of found.values()) for (const p of f.term.split(" ")) inSkills.add(p);
  const extraMatched: string[] = [];
  const extraMissing: string[] = [];
  for (const [wd, n] of [...words.entries()].sort((a, b) => b[1] - a[1])) {
    if (n < 2 || inSkills.has(wd)) continue;
    if (has(cvN, wd)) extraMatched.push(wd);
    else extraMissing.push(wd);
    if (extraMatched.length + extraMissing.length >= 14) break;
  }

  const all = [...found.values()];
  const matched = all.filter((f) => f.in_resume);
  const missing = all.filter((f) => !f.in_resume);
  const ord: Record<Level, number> = { must: 0, standard: 1, nice: 2 };
  missing.sort((a, b) => ord[a.level] - ord[b.level] || b.count - a.count);
  matched.sort((a, b) => b.count - a.count);

  const tips: string[] = [];
  const mustMissing = missing.filter((f) => f.level === "must");
  if (mustMissing.length) {
    const it = mustMissing.length === 1 ? "it" : "them";
    tips.push(`The job stresses ${mustMissing.slice(0, 4).map((f) => f.term).join(", ")} and your resume does not mention ${it}. If you have real experience with ${it}, add ${it} to Skills and to a bullet that shows how you used ${it}.`);
  }
  if (missing.length && !mustMissing.length) tips.push(`Nothing critical is missing. If true, you could add: ${missing.slice(0, 4).map((f) => f.term).join(", ")}.`);
  let yearsAsked: number | null = null;
  const y = rx(String.raw`(\d{1,2})\s*\+?\s*(?:years|yrs)`, "i").exec(jd);
  if (y) {
    yearsAsked = parseInt(y[1], 10);
    if (resumeYears !== null && yearsAsked > resumeYears + 1) {
      tips.push(`The job asks for about ${yearsAsked} years of experience; your resume shows about ${resumeYears}. Make sure internships, projects and part-time work with relevant skills are clearly dated and described.`);
    }
  }
  if (found.size && coverage >= 80) tips.push("Strong match: your resume already mentions most of what the job asks for. Check the wording of your top bullets for the same key terms.");
  if (!found.size) tips.push("We could not find recognisable skills in that text. Paste the full job description, including the requirements.");
  return { coverage, matched, missing, extra_matched: extraMatched, extra_missing: extraMissing, tips, total: found.size, years_asked: yearsAsked };
}
