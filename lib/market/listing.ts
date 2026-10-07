import type { Job } from "./jobs";
import * as search from "./job-search";

/** Filtering, sorting and paging of the internship list (the logic of public/internships.php, kept out of the page so it can be tested). */
export const CATEGORIES: Array<[string, string]> = [
  ["Software & Web", "Frontend, backend, mobile"],
  ["Data & AI", "Analytics, ML, BI"],
  ["Design & Creative", "UI/UX, graphics, video"],
  ["Marketing", "SEO, social, content"],
  ["Finance & Accounts", "Audit, FinTech, equity"],
  ["HR & Operations", "Talent, people ops"],
  ["Law & Policy", "Research, compliance"],
  ["Core Engineering", "Mech, civil, electrical"],
];
export const LOCATIONS = ["Remote", "Bengaluru", "Mumbai", "Pune", "Delhi NCR", "Hyderabad", "Chennai"];
export const MODES = ["Remote", "On-site", "Hybrid"];
export const MIN_STIPENDS = [5000, 10000, 15000, 20000];
export const MAX_WEEKS = [8, 12, 16];
export const SORTS = ["relevance", "match", "new", "stipend", "deadline"] as const;
export type Sort = (typeof SORTS)[number];
export const PER_PAGE = 12;

export interface Filters {
  q: string; cat: string; loc: string[]; mode: string[]; min: number; weeks: number;
  verified: boolean; ppo: boolean; fresh: boolean; short: boolean; saved: boolean; sort: string; page: number;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const many = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);
const int = (v: string | string[] | undefined): number => {
  const n = parseInt(one(v), 10);
  return Number.isFinite(n) ? n : 0;
};

/** Read and sanitise the URL parameters. */
export function parseFilters(sp: Params): Filters {
  const cat = one(sp.cat);
  const min = int(sp.min);
  const weeks = int(sp.weeks);
  return {
    q: Array.from(one(sp.q).trim()).slice(0, 80).join(""),
    cat: CATEGORIES.some((c) => c[0] === cat) ? cat : "",
    loc: LOCATIONS.filter((l) => many(sp.loc).includes(l)),
    mode: MODES.filter((m) => many(sp.mode).includes(m)),
    min: MIN_STIPENDS.includes(min) ? min : 0,
    weeks: MAX_WEEKS.includes(weeks) ? weeks : 0,
    verified: !!one(sp.verified), ppo: !!one(sp.ppo), fresh: !!one(sp.new), short: !!one(sp.short), saved: !!one(sp.saved),
    sort: one(sp.sort), page: Math.max(1, int(sp.page) || 1),
  };
}

export interface Listing {
  items: Job[];
  total: number;
  pages: number;
  page: number;
  sort: Sort;
  defaultSort: Sort;
  search: search.SearchResult<Job>;
  chips: Array<{ label: string; drop: Partial<Record<keyof Filters, true>>; arrayVal?: [keyof Filters, string] }>;
}

export function run(all: Job[], f: Filters, o: { isStudent: boolean; hasProfile: boolean; savedIds: number[] }): Listing {
  const s = search.run(all, f.q);
  const defaultSort: Sort = s.mode !== "all" ? "relevance" : o.hasProfile ? "match" : "new";
  let sort: Sort = (SORTS as readonly string[]).includes(f.sort) ? (f.sort as Sort) : defaultSort;
  if (sort === "relevance" && s.mode === "all") sort = o.hasProfile ? "match" : "new";
  const onlySaved = o.isStudent && f.saved;
  const res = s.jobs.filter((j) => {
    if (f.cat !== "" && j.cat !== f.cat) return false;
    if (f.loc.length && !f.loc.includes(j.loc)) return false;
    if (f.mode.length && !f.mode.includes(j.mode)) return false;
    if (f.min && j.stipend < f.min) return false;
    if (f.weeks && j.weeks > f.weeks) return false;
    if (f.verified && j.badge !== "Verified stipend") return false;
    if (f.ppo && !(j.badge + " " + j.perks.join(" ")).toLowerCase().includes("ppo")) return false;
    if (f.fresh && j.posted > 7) return false;
    if (f.short && j.weeks > 8) return false;
    if (onlySaved && !o.savedIds.includes(j.id)) return false;
    return true;
  });
  res.sort((a, b) => {
    switch (sort) {
      case "new": return a.posted - b.posted;
      case "stipend": return b.stipend - a.stipend;
      case "deadline": return (a.days_left ?? 9999) - (b.days_left ?? 9999);
      case "relevance": return ((b._score ?? 0) - (a._score ?? 0)) || ((b.match ?? -1) - (a.match ?? -1));
      default: return (b.match ?? -1) - (a.match ?? -1);
    }
  });
  const total = res.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(f.page, pages);
  const chips: Listing["chips"] = [];
  if (f.q !== "") chips.push({ label: `"${f.q}"`, drop: { q: true } });
  if (f.cat !== "") chips.push({ label: f.cat, drop: { cat: true } });
  for (const l of f.loc) chips.push({ label: l, drop: {}, arrayVal: ["loc", l] });
  for (const m of f.mode) chips.push({ label: m, drop: {}, arrayVal: ["mode", m] });
  if (f.min) chips.push({ label: `₹${f.min.toLocaleString("en-IN")}+`, drop: { min: true } });
  if (f.weeks) chips.push({ label: `Up to ${f.weeks} weeks`, drop: { weeks: true } });
  if (f.verified) chips.push({ label: "Verified stipend", drop: { verified: true } });
  if (f.ppo) chips.push({ label: "PPO possible", drop: { ppo: true } });
  if (f.fresh) chips.push({ label: "New this week", drop: { fresh: true } });
  if (f.short) chips.push({ label: "8 weeks or less", drop: { short: true } });
  if (onlySaved) chips.push({ label: "Saved", drop: { saved: true } });
  return { items: res.slice((page - 1) * PER_PAGE, page * PER_PAGE), total, pages, page, sort, defaultSort, search: s, chips };
}

/** URL for the list with some parameters changed. `arrayVal` toggles one value of loc / mode. Paging is always reset. */
export function url(f: Filters, defaultSort: string, change: { drop?: Partial<Record<keyof Filters, true>>; set?: Partial<Filters>; arrayVal?: [keyof Filters, string] } = {}): string {
  const p: Filters = { ...f, ...(change.set ?? {}) };
  for (const k of Object.keys(change.drop ?? {}) as Array<keyof Filters>) {
    (p as unknown as Record<string, unknown>)[k] = Array.isArray(p[k]) ? [] : typeof p[k] === "number" ? 0 : typeof p[k] === "boolean" ? false : "";
  }
  if (change.arrayVal) {
    const [k, v] = change.arrayVal;
    const cur = (p[k] as string[]).slice();
    (p as unknown as Record<string, unknown>)[k] = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  }
  const q = new URLSearchParams();
  if (p.q) q.set("q", p.q);
  if (p.cat) q.set("cat", p.cat);
  for (const l of p.loc) q.append("loc", l);
  for (const m of p.mode) q.append("mode", m);
  if (p.min) q.set("min", String(p.min));
  if (p.weeks) q.set("weeks", String(p.weeks));
  if (p.verified) q.set("verified", "1");
  if (p.ppo) q.set("ppo", "1");
  if (p.fresh) q.set("new", "1");
  if (p.short) q.set("short", "1");
  if (p.saved) q.set("saved", "1");
  if (p.sort && p.sort !== defaultSort) q.set("sort", p.sort);
  const s = q.toString();
  return "/internships" + (s ? "?" + s : "");
}
