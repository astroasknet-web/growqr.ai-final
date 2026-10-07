import { all, one, run, val } from "../portal/db";
import * as passport from "../portal/passport/profile";
import * as templates from "./templates";
import { fromProfile, normalize, type ResumeData } from "./resume-data";
import { run as scoreRun, type Scored } from "./scorer";

/** Database access for Resume Studio. Every query is scoped to the signed-in user (port of Studio\Store). */
const j = (v: unknown): string => JSON.stringify(v);

export interface ResumeSummary { id: number; title: string; template: string; updated_at: string; saves: number; score: string | null; grade: string | null }
export interface ResumeRow { id: number; user_id: number; title: string; template: string; data_json: string; created_at: string; updated_at: string; data: ResumeData }
export interface VersionSummary { id: number; kind: string; template: string; score: string | null; grade: string | null; words: number; created_at: string }
export interface VersionRow extends VersionSummary { resume_id: number; user_id: number; data_json: string; text_body: string; sections_json: string | null; data: ResumeData; sections: Array<{ name: string; pct: number }> }
export interface Prefs { region: string; level: string; industry: string; goal: string }

const parse = (s: string | null | undefined): unknown => {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

export async function resumes(uid: number): Promise<ResumeSummary[]> {
  return all<ResumeSummary>(
    `SELECT r.id, r.title, r.template, r.updated_at,
        (SELECT COUNT(*) FROM studio_versions v WHERE v.resume_id = r.id AND v.kind = 'save') AS saves,
        (SELECT v.score FROM studio_versions v WHERE v.resume_id = r.id ORDER BY v.id DESC LIMIT 1) AS score,
        (SELECT v.grade FROM studio_versions v WHERE v.resume_id = r.id ORDER BY v.id DESC LIMIT 1) AS grade
     FROM studio_resumes r WHERE r.user_id = $1 ORDER BY r.updated_at DESC`,
    [uid],
  );
}

export async function find(uid: number, id: number): Promise<ResumeRow | null> {
  const r = await one<Omit<ResumeRow, "data">>("SELECT * FROM studio_resumes WHERE id = $1 AND user_id = $2", [id, uid]);
  return r ? { ...r, data: normalize(parse(r.data_json)) } : null;
}

export async function create(uid: number, template: string, data: ResumeData, title = "My resume"): Promise<number> {
  const id = await val<number>("INSERT INTO studio_resumes (user_id, title, template, data_json) VALUES ($1, $2, $3, $4) RETURNING id", [uid, Array.from(title).slice(0, 120).join(""), template, j(data)]);
  return Number(id);
}

export async function saveDraft(uid: number, id: number, template: string, data: ResumeData, client?: { query: (sql: string, params: unknown[]) => Promise<unknown> }): Promise<void> {
  const sql = "UPDATE studio_resumes SET template = $1, data_json = $2, updated_at = LOCALTIMESTAMP(0) WHERE id = $3 AND user_id = $4";
  const params = [template, j(data), id, uid];
  if (client) await client.query(sql, params);
  else await run(sql, params);
}

/** Record a version with its score. */
export async function addVersion(uid: number, resumeId: number, kind: string, template: string, data: ResumeData, scored: Scored, client?: { query: (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> }): Promise<number> {
  const sql = "INSERT INTO studio_versions (resume_id, user_id, kind, template, data_json, text_body, score, grade, sections_json, words) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id";
  const params = [resumeId, uid, kind, template, j(data), scored.text, scored.score ?? null, scored.grade ?? null, j(scored.sections ?? []), Math.trunc(scored.words)];
  const id = client ? (await client.query(sql, params)).rows[0]?.id : await val(sql, params);
  return Number(id);
}

export async function versions(uid: number, resumeId: number): Promise<VersionSummary[]> {
  return all<VersionSummary>("SELECT id, kind, template, score, grade, words, created_at FROM studio_versions WHERE resume_id = $1 AND user_id = $2 ORDER BY id DESC", [resumeId, uid]);
}

export async function version(uid: number, vid: number): Promise<VersionRow | null> {
  const v = await one<Omit<VersionRow, "data" | "sections">>("SELECT * FROM studio_versions WHERE id = $1 AND user_id = $2", [vid, uid]);
  if (!v) return null;
  const sections = parse(v.sections_json);
  return { ...v, data: normalize(parse(v.data_json)), sections: Array.isArray(sections) && sections.length ? (sections as VersionRow["sections"]) : [] };
}

function cleanPrefs(p: Record<string, unknown>): Prefs {
  const pick = (v: unknown, allowed: Record<string, string>, dflt: string): string => (typeof v === "string" && Object.hasOwn(allowed, v) ? v : dflt);
  return {
    region: pick(p.region, templates.regionOptions(), "other"),
    level: pick(p.level, templates.LEVELS, ""),
    industry: pick(p.industry, templates.INDUSTRIES, ""),
    goal: pick(p.goal, templates.GOALS, ""),
  };
}

export async function prefs(uid: number): Promise<Prefs> {
  const raw = await val<string>("SELECT prefs_json FROM studio_prefs WHERE user_id = $1", [uid]);
  const p = parse(raw);
  return cleanPrefs(p && typeof p === "object" ? (p as Record<string, unknown>) : {});
}

export async function savePrefs(uid: number, input: Record<string, unknown>): Promise<Prefs> {
  const p = cleanPrefs(input);
  await run("INSERT INTO studio_prefs (user_id, prefs_json) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET prefs_json = EXCLUDED.prefs_json, updated_at = LOCALTIMESTAMP(0)", [uid, j(p)]);
  return p;
}

/** Template id => how many resumes use it. */
export async function usage(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of await all<{ template: string; n: number }>("SELECT template, COUNT(*) AS n FROM studio_resumes GROUP BY template")) out[String(r.template)] = Number(r.n);
  return out;
}

/** Guess sensible defaults for the guided questions from the student's existing passport. */
export function guessPrefs(rq: { career?: { stage?: string; yearsExperience?: number } } | null, saved: Prefs): Prefs {
  const stage = String(rq?.career?.stage ?? "");
  const years = Math.trunc(Number(rq?.career?.yearsExperience ?? 0));
  const out = { ...saved };
  if (out.level === "" && stage !== "") out.level = stage === "fresher" || stage === "student" ? "student" : years >= 8 ? "senior" : years >= 3 ? "mid" : "early";
  return out;
}

/**
 * Make sure the student has a first studio resume, built from their passport resume, with a scored "import" version as the
 * before-picture. Returns its id.
 */
export async function ensureStarter(uid: number, user: { name?: string; email?: string }, template = "chrono-classic"): Promise<number> {
  const existing = await val<number>("SELECT id FROM studio_resumes WHERE user_id = $1 ORDER BY id LIMIT 1", [uid]);
  if (existing !== null) return Number(existing);
  const profile = await passport.profile(uid);
  let data: ResumeData;
  if (profile?.rq) {
    const text = await resumeText(uid);
    data = fromProfile(profile.rq, user, text);
  } else {
    data = normalize({ personal: { name: user.name ?? "", email: user.email ?? "" } });
  }
  const tpl = templates.get(template) ?? templates.get("chrono-classic")!;
  const id = await create(uid, tpl.id, data, "My resume");
  await addVersion(uid, id, "import", tpl.id, data, scoreRun(data, tpl));
  return id;
}

/** The text of the student's current Skill Passport resume (used to recover details the parser missed). */
export async function resumeText(uid: number): Promise<string> {
  return (await val<string>("SELECT resume_text FROM student_profiles WHERE user_id = $1", [uid])) ?? "";
}
