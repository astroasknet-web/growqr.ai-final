import { CATEGORIES, LOCATIONS, MODES } from "./listing";
import type { NewJob } from "./jobs";

/** Server-side rules for a new role (port of the validation in public/employer-post.php). The browser checks nothing the server relies on. */
export interface RoleFields { title: string; cat: string; loc: string; mode: string; stipend: string; weeks: string; openings: string; about: string; skills: string; question: string; escrow: string }
export type RoleErrors = Partial<Record<keyof RoleFields, string>>;

export const EMPTY: RoleFields = { title: "", cat: "", loc: "", mode: "Remote", stipend: "", weeks: "", openings: "1", about: "", skills: "", question: "", escrow: "" };

const cut = (s: string, n: number) => Array.from(s.trim()).slice(0, n).join("");
const len = (s: string) => Array.from(s).length;
const int = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

export function readFields(get: (k: string) => string): RoleFields {
  const f = { ...EMPTY };
  for (const k of Object.keys(f) as Array<keyof RoleFields>) f[k] = cut(get(k), k === "about" ? 2000 : 200);
  return f;
}

export const skillList = (s: string): string[] => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))];

export function validate(f: RoleFields): RoleErrors {
  const e: RoleErrors = {};
  if (len(f.title) < 5) e.title = "Enter a clear role title (at least 5 characters).";
  if (!CATEGORIES.some((c) => c[0] === f.cat)) e.cat = "Choose a field.";
  if (!MODES.includes(f.mode)) e.mode = "Choose a work mode.";
  if (f.mode !== "Remote" && !LOCATIONS.includes(f.loc)) e.loc = "Choose the office location.";
  const min = f.mode === "Remote" ? 1000 : 2000; // platform minimums
  if (int(f.stipend) < min) e.stipend = `Minimum stipend is ₹${min.toLocaleString("en-IN")} per month for ${f.mode === "Remote" ? "remote" : "on-site and hybrid"} roles.`;
  const w = int(f.weeks);
  if (w < 2 || w > 26) e.weeks = "Duration must be between 2 and 26 weeks.";
  const o = int(f.openings);
  if (o < 1 || o > 20) e.openings = "Openings must be between 1 and 20.";
  if (len(f.about) < 80) e.about = "Describe the role in at least 80 characters so students know what they will do.";
  if (skillList(f.skills).length < 1) e.skills = "List at least one required skill, separated by commas.";
  return e;
}

export function toNewJob(f: RoleFields, company: string): NewJob {
  return { title: f.title, company, cat: f.cat, mode: f.mode, loc: f.loc, stipend: int(f.stipend), weeks: int(f.weeks), openings: int(f.openings), about: f.about, skills: skillList(f.skills), question: f.question };
}
