import type { Metadata } from "next";
import Link from "next/link";
import { databaseConfigured } from "@/lib/portal/db";
import * as courses from "@/lib/market/courses";
import * as lessons from "@/lib/market/lessons";
import { CourseCard } from "@/components/market/course-parts";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const AUDS: Record<string, string> = { "": "Everyone", College: "College students", Fresher: "Freshers", Mid: "Mid-career", Senior: "Senior leaders", Founder: "Founders" };
const LENS: Record<string, string> = { short: "Up to 15 hours", medium: "15 to 40 hours", long: "40+ hours" };
const LEVELS: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

async function read(sp: SP) {
  const cats = await courses.categories();
  const q = Array.from(one(sp.q).trim()).slice(0, 80).join("");
  const cat = cats.some((c) => c.key === one(sp.cat)) ? one(sp.cat) : "";
  const level = LEVELS[one(sp.level)] ? one(sp.level) : "";
  const aud = Object.keys(AUDS).includes(one(sp.aud)) ? one(sp.aud) : "";
  const len = LENS[one(sp.len)] ? one(sp.len) : "";
  const sort = ["short", "long", "az"].includes(one(sp.sort)) ? one(sp.sort) : "";
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);
  const available = one(sp.available) === "1" ? "1" : "";
  return { cats, q, cat, level, aud, len, sort, page, available };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  if (!databaseConfigured()) return { title: "Courses | GrowQR" };
  const f = await read(await searchParams);
  const catName = f.cats.find((c) => c.key === f.cat)?.name ?? "";
  const filtered = f.q || f.cat || f.level || f.aud || f.len || f.sort || f.available;
  const base = catName ? `${catName} Courses | GrowQR` : "Online Courses to Get Internship-Ready | GrowQR";
  return {
    title: f.page > 1 ? `Page ${f.page}: ${base}` : base,
    description: `Browse ${await courses.total()} self-paced courses in data, AI, software, design, marketing and more. Each has a hands-on project, certificate and badge.`,
    alternates: { canonical: `${SITE_URL}/courses${f.cat ? "?cat=" + f.cat : ""}` },
    robots: (filtered && !f.cat) || f.q || f.page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await currentViewer();
  if (!databaseConfigured()) return <MarketShell user={null} active="courses"><p>Courses are not available right now. Please try again shortly.</p></MarketShell>;
  const f = await read(await searchParams);
  const res = await courses.search({ q: f.q, cat: f.cat, level: f.level, aud: f.aud, len: f.len, sort: f.sort, page: f.page, only: f.available ? lessons.nativeSlugs() : undefined });
  const total = await courses.total();
  const catName = f.cats.find((c) => c.key === f.cat)?.name ?? "";
  const params = { q: f.q, cat: f.cat, level: f.level, aud: f.aud, len: f.len, sort: f.sort, available: f.available };
  const qs = (over: Partial<typeof params & { page: number }> = {}, drop: string[] = []): string => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...over })) if (v !== "" && v !== undefined && v !== 1 && !drop.includes(k)) p.set(k, String(v));
    const s = p.toString();
    return "/courses" + (s ? "?" + s : "");
  };
  const chips: Array<[string, string]> = [];
  if (f.q) chips.push([`"${f.q}"`, qs({}, ["q"])]);
  if (f.cat) chips.push([catName, qs({}, ["cat"])]);
  if (f.level) chips.push([LEVELS[f.level], qs({}, ["level"])]);
  if (f.aud) chips.push([`For ${f.aud.toLowerCase()}s`, qs({}, ["aud"])]);
  if (f.len) chips.push([LENS[f.len], qs({}, ["len"])]);
  if (f.available) chips.push(["Lessons available now", qs({}, ["available"])]);
  const landing = chips.length === 0 && !f.sort && res.page === 1;
  const paths = landing ? await courses.paths() : [];
  const spot = landing ? await courses.featured(8) : [];
  const hours = landing ? await courses.totalHours() : 0;
  const sel = "min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[14px]";

  return (
    <MarketShell user={me} active="courses">
      <h1 className="text-[28px] sm:text-[34px] font-bold text-ink tracking-tight">{catName || "Courses to get internship-ready"}</h1>
      <p className="text-[15px] text-ink-3 mt-1.5 mb-6 max-w-2xl">{total} self-paced courses{landing ? `, ${hours.toLocaleString("en-IN")} hours of learning` : ""}. Each has a hands-on project, a certificate and a badge, and certified courses count toward your Skill Passport.</p>

      <form method="get" action="/courses" role="search" className="flex flex-wrap gap-2 mb-4">
        <label htmlFor="cq" className="sr-only">Search courses</label>
        <input id="cq" name="q" type="search" defaultValue={f.q} maxLength={80} placeholder="Search courses, e.g. python, excel, figma" className={`${sel} flex-1 min-w-[12rem] text-[16px]`} />
        <label htmlFor="ccat" className="sr-only">Category</label>
        <select id="ccat" name="cat" defaultValue={f.cat} className={sel}><option value="">All categories</option>{f.cats.map((c) => <option key={c.key} value={c.key}>{c.name} ({c.n})</option>)}</select>
        <label htmlFor="clevel" className="sr-only">Level</label>
        <select id="clevel" name="level" defaultValue={f.level} className={sel}><option value="">Any level</option>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label htmlFor="clen" className="sr-only">Length</label>
        <select id="clen" name="len" defaultValue={f.len} className={sel}><option value="">Any length</option>{Object.entries(LENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button type="submit" className="min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Search</button>
      </form>

      <p className="mb-3"><Link href={qs({ available: f.available ? "" : "1" })} aria-current={f.available ? "true" : undefined} className={`min-h-[40px] inline-flex items-center px-3.5 rounded-full border text-[13px] font-medium ${f.available ? "bg-ink text-white border-ink" : "border-emerald-700 text-emerald-900 bg-emerald-50"}`}>Lessons available now on GrowQR</Link></p>

      <nav aria-label="Audience" className="flex flex-wrap gap-2 mb-5">
        {Object.entries(AUDS).map(([k, v]) => (
          <Link key={k || "all"} href={qs({ aud: k })} aria-current={f.aud === k ? "true" : undefined} className={`min-h-[40px] inline-flex items-center px-3.5 rounded-full border text-[13px] ${f.aud === k ? "bg-ink text-white border-ink" : "border-black/[0.15] bg-white text-ink-2 hover:bg-cream-3"}`}>{v}</Link>
        ))}
      </nav>

      {chips.length ? (
        <ul className="flex flex-wrap gap-2 mb-4" aria-label="Active filters">
          {chips.map(([label, href]) => <li key={label}><Link href={href} aria-label={`Remove filter ${label}`} className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-orange-light text-orange-deep text-[13px] font-medium">{label} <span aria-hidden="true">&times;</span></Link></li>)}
          <li><Link href="/courses" className="inline-flex items-center min-h-[36px] px-3 text-[13px] underline text-ink-3">Clear all</Link></li>
        </ul>
      ) : null}

      {landing && paths.length ? (
        <section aria-labelledby="paths-h" className="mb-10">
          <h2 id="paths-h" className="text-[20px] font-bold text-ink mb-1">Career paths</h2>
          <p className="text-[14px] text-ink-3 mb-4">An ordered ladder of courses toward a role.</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paths.map((p) => (
              <li key={p.key} className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}>
                <h3 className="text-[16px] font-semibold">{p.title}</h3>
                <p className="text-[13px] opacity-90">{p.tag}</p>
                <p className="text-[12px] opacity-90 mt-2">{p.courses.length} courses &middot; {p.hours} hours</p>
                <ol className="mt-2 text-[13px] space-y-1 list-decimal pl-5">{p.courses.map((c) => <li key={c.slug}><Link href={`/courses/${c.slug}`} className="underline">{c.title}</Link></li>)}</ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {landing && spot.length ? (
        <section aria-labelledby="spot-h" className="mb-10">
          <h2 id="spot-h" className="text-[20px] font-bold text-ink mb-4">Popular right now</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{spot.map((c) => <CourseCard key={c.slug} course={c} />)}</ul>
        </section>
      ) : null}

      <section aria-labelledby="all-h">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="all-h" className="text-[20px] font-bold text-ink">{res.total} {res.total === 1 ? "course" : "courses"}</h2>
          <nav aria-label="Sort" className="flex items-center gap-2 text-[13px]">
            Sort:
            {[["", "Recommended"], ["short", "Shortest"], ["long", "Longest"], ["az", "A to Z"]].map(([k, v]) => <Link key={k || "rec"} href={qs({ sort: k })} aria-current={f.sort === k ? "true" : undefined} className={`min-h-[40px] inline-flex items-center px-3 rounded-full ${f.sort === k ? "bg-ink text-white" : "border border-black/[0.15] bg-white"}`}>{v}</Link>)}
          </nav>
        </div>
        {res.items.length ? (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{res.items.map((c) => <CourseCard key={c.slug} course={c} />)}</ul>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-8 text-center"><h3 className="text-[18px] font-semibold text-ink">No courses match</h3><p className="text-[14px] text-ink-3 mt-1 mb-4">Try a broader search.</p><Link href="/courses" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-orange text-white font-semibold text-[14px]">Clear filters</Link></div>
        )}
        {res.pages > 1 ? (
          <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {res.page > 1 ? <Link rel="prev" className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] bg-white text-[14px]" href={qs({ page: res.page - 1 })}>Previous</Link> : null}
            <span className="text-[14px] text-ink-3">Page {res.page} of {res.pages}</span>
            {res.page < res.pages ? <Link rel="next" className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] bg-white text-[14px]" href={qs({ page: res.page + 1 })}>Next</Link> : null}
          </nav>
        ) : null}
      </section>
    </MarketShell>
  );
}
