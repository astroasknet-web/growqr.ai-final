import type { Metadata } from "next";
import Link from "next/link";
import { databaseConfigured } from "@/lib/portal/db";
import * as courses from "@/lib/market/courses";
import * as learning from "@/lib/market/learning";
import * as lessons from "@/lib/market/lessons";
import { CatalogCard, type Progress } from "@/components/market/catalog";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const AUDS: Record<string, string> = { "": "Everyone", College: "College students", Fresher: "Freshers", Mid: "Mid-career", Senior: "Senior leaders", Founder: "Founders" };
const LENS: Record<string, string> = { short: "Up to 15 hours", medium: "15 to 40 hours", long: "40+ hours" };
const LEVELS: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const SORTS: Array<[string, string]> = [["", "Recommended"], ["short", "Shortest first"], ["long", "Longest first"], ["az", "A to Z"]];

async function read(sp: SP) {
  const cats = (await courses.categories()).filter((c) => c.n > 0); // never show an empty category
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

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";
const field = `min-h-[44px] rounded-lg border border-black/[0.18] bg-white px-3 text-[14px] text-ink ${focus}`;

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await currentViewer();
  if (!databaseConfigured()) return <MarketShell user={null} active="courses"><p>Courses are not available right now. Please try again shortly.</p></MarketShell>;
  const f = await read(await searchParams);
  const native = lessons.nativeSlugs();
  const res = await courses.search({ q: f.q, cat: f.cat, level: f.level, aud: f.aud, len: f.len, sort: f.sort, page: f.page, only: f.available ? native : undefined });
  const total = await courses.total();
  const catName = f.cats.find((c) => c.key === f.cat)?.name ?? "";

  // What this student has already done, so each card can say Start, Continue or Review. Anyone else just sees Start / Explore.
  const mine = new Map<string, Progress>();
  if (me?.role === "student") for (const e of await learning.forUser(me.id)) mine.set(e.slug, { status: e.status, progress: e.progress });

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
  if (f.aud) chips.push([AUDS[f.aud], qs({}, ["aud"])]);
  if (f.len) chips.push([LENS[f.len], qs({}, ["len"])]);
  if (f.available) chips.push(["Lessons available now", qs({}, ["available"])]);
  const landing = chips.length === 0 && !f.sort && res.page === 1;
  const paths = landing ? await courses.paths() : [];
  const spot = landing ? await courses.featured(8) : [];
  const live = landing ? (await courses.bySlugs(native)) : [];
  const hours = landing ? await courses.totalHours() : 0;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: catName ? `${catName} courses` : "Courses to get internship-ready",
    url: `${SITE_URL}/courses${f.cat ? "?cat=" + f.cat : ""}`,
    mainEntity: { "@type": "ItemList", itemListElement: res.items.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/courses/${c.slug}`, name: c.title })) },
  };

  return (
    <MarketShell user={me} active="courses">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemList) }} />

      {/* Hero: what this is, and the search that starts discovery */}
      <section aria-labelledby="hero-h" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1410] via-[#2a1a10] to-[#3b1f10] px-5 py-8 text-white sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-light">GrowQR Learning</p>
          <h1 id="hero-h" className="mt-2 text-[28px] font-bold leading-tight tracking-tight !text-white sm:text-[40px]">{catName ? `${catName} courses` : "Learn the skills employers hire for"}</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-white/85 sm:text-[17px]">
            {total} self-paced courses across {f.cats.length} fields. Learn at your own pace, pass short quizzes, finish a hands-on project and add the result to your Skill Passport.
          </p>
          <form method="get" action="/courses" role="search" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
            {f.cat ? <input type="hidden" name="cat" value={f.cat} /> : null}
            {f.available ? <input type="hidden" name="available" value="1" /> : null}
            <label htmlFor="cq" className="sr-only">Search courses</label>
            <input id="cq" name="q" type="search" defaultValue={f.q} maxLength={80} placeholder="Search a course, skill or topic, e.g. python, excel, figma" className={`min-h-[52px] flex-1 rounded-xl border-0 bg-white px-4 text-[16px] text-ink placeholder:text-ink-3 ${focus}`} />
            <button type="submit" className={`min-h-[52px] rounded-xl bg-orange-deep px-7 text-[15px] font-semibold text-white hover:bg-orange-dark ring-1 ring-white/30 ${focus}`}>Search courses</button>
          </form>
          <dl className="mt-7 grid max-w-xl grid-cols-3 gap-4 text-center sm:text-left">
            {[[String(total), "courses"], [landing ? hours.toLocaleString("en-IN") : String(f.cats.length), landing ? "hours of learning" : "fields"], [String(native.length), "with full lessons now"]].map(([n, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="text-[22px] font-bold sm:text-[26px]">{n}</dd><dd className="text-[12px] text-white/75 sm:text-[13px]">{l}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* Fields: only fields that have courses */}
      <nav aria-label="Fields" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-2 pb-2 sm:min-w-0 sm:flex-wrap">
          <li><Link href={qs({ cat: "" })} aria-current={f.cat === "" ? "true" : undefined} className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-[13.5px] font-medium ${focus} ${f.cat === "" ? "border-ink bg-ink text-white" : "border-black/[0.16] bg-white text-ink-2 hover:bg-cream-3"}`}>All fields</Link></li>
          {f.cats.map((c) => (
            <li key={c.key}>
              <Link href={qs({ cat: c.key })} aria-current={f.cat === c.key ? "true" : undefined} className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium ${focus} ${f.cat === c.key ? "border-ink bg-ink text-white" : "border-black/[0.16] bg-white text-ink-2 hover:bg-cream-3"}`}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: c.c1 }} />{c.name}<span className={f.cat === c.key ? "text-white/75" : "text-ink-3"}>{c.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Filters */}
      <form method="get" action="/courses" aria-label="Filter courses" className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 sm:p-4">
        {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
        {f.cat ? <input type="hidden" name="cat" value={f.cat} /> : null}
        {f.sort ? <input type="hidden" name="sort" value={f.sort} /> : null}
        <div><label htmlFor="clevel" className="mb-1 block text-[12px] font-medium text-ink-3">Level</label>
          <select id="clevel" name="level" defaultValue={f.level} className={field}><option value="">Any level</option>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="clen" className="mb-1 block text-[12px] font-medium text-ink-3">Length</label>
          <select id="clen" name="len" defaultValue={f.len} className={field}><option value="">Any length</option>{Object.entries(LENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="caud" className="mb-1 block text-[12px] font-medium text-ink-3">Best for</label>
          <select id="caud" name="aud" defaultValue={f.aud} className={field}>{Object.entries(AUDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <label className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-1 text-[14px] text-ink-2">
          <input type="checkbox" name="available" value="1" defaultChecked={Boolean(f.available)} className="h-5 w-5 accent-orange-deep" />Lessons available now
        </label>
        <button type="submit" className={`min-h-[44px] rounded-lg bg-ink px-5 text-[14px] font-semibold text-white hover:bg-orange-deep ${focus}`}>Apply filters</button>
      </form>

      {chips.length ? (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map(([label, href]) => <li key={label}><Link href={href} aria-label={`Remove filter ${label}`} className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-orange-light px-3 text-[13px] font-medium text-orange-deep ${focus}`}>{label} <span aria-hidden="true">&times;</span></Link></li>)}
          <li><Link href="/courses" className={`inline-flex min-h-[36px] items-center px-3 text-[13px] text-ink-3 underline ${focus}`}>Reset all</Link></li>
        </ul>
      ) : null}

      {landing && live.length ? (
        <section aria-labelledby="live-h" className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><h2 id="live-h" className="text-[22px] font-bold text-ink">Start learning today</h2><p className="text-[14px] text-ink-3">Full lessons, quizzes and a capstone, ready on GrowQR now.</p></div>
            <Link href="/courses?available=1" className={`text-[14px] font-semibold text-orange-deep underline underline-offset-2 ${focus}`}>See all available</Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{live.map((c) => <CatalogCard key={c.slug} course={c} progress={mine.get(c.slug)} />)}</ul>
        </section>
      ) : null}

      {landing && paths.length ? (
        <section aria-labelledby="paths-h" className="mt-12">
          <h2 id="paths-h" className="text-[22px] font-bold text-ink">Career paths</h2>
          <p className="mb-4 text-[14px] text-ink-3">An ordered ladder of courses toward a role.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paths.map((p) => (
              <li key={p.key} className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                <span aria-hidden="true" className="mb-3 block h-1.5 w-12 rounded-full" style={{ background: p.c1 }} />
                <h3 className="text-[16px] font-semibold text-ink">{p.title}</h3>
                <p className="text-[13px] text-ink-3">{p.tag}</p>
                <p className="mt-2 text-[12px] text-ink-3">{p.courses.length} courses &middot; {p.hours} hours</p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13.5px] text-ink-2">{p.courses.map((c) => <li key={c.slug}><Link href={`/courses/${c.slug}`} className={`rounded hover:underline ${focus}`}>{c.title}</Link></li>)}</ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {landing && spot.length ? (
        <section aria-labelledby="spot-h" className="mt-12">
          <h2 id="spot-h" className="mb-4 text-[22px] font-bold text-ink">Popular right now</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{spot.map((c) => <CatalogCard key={c.slug} course={c} progress={mine.get(c.slug)} />)}</ul>
        </section>
      ) : null}

      <section aria-labelledby="all-h" className="mt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="all-h" className="text-[22px] font-bold text-ink">{landing ? "All courses" : catName || "Results"} <span className="text-[16px] font-medium text-ink-3">({res.total})</span></h2>
          <nav aria-label="Sort" className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
            Sort by
            {SORTS.map(([k, v]) => <Link key={k || "rec"} href={qs({ sort: k })} aria-current={f.sort === k ? "true" : undefined} className={`inline-flex min-h-[40px] items-center rounded-full px-3.5 ${focus} ${f.sort === k ? "bg-ink text-white" : "border border-black/[0.16] bg-white text-ink-2 hover:bg-cream-3"}`}>{v}</Link>)}
          </nav>
        </div>
        {res.items.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{res.items.map((c) => <CatalogCard key={c.slug} course={c} progress={mine.get(c.slug)} />)}</ul>
        ) : (
          <div className="rounded-2xl border border-black/[0.08] bg-white p-10 text-center">
            <h3 className="text-[18px] font-semibold text-ink">No courses match</h3>
            <p className="mb-4 mt-1 text-[14px] text-ink-3">Try a broader search or remove a filter.</p>
            <Link href="/courses" className={`inline-flex min-h-[44px] items-center rounded-lg bg-orange-deep px-5 text-[14px] font-semibold text-white hover:bg-ink ${focus}`}>Reset all filters</Link>
          </div>
        )}
        {res.pages > 1 ? (
          <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {res.page > 1 ? <Link rel="prev" className={`inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.18] bg-white px-4 text-[14px] ${focus}`} href={qs({ page: res.page - 1 })}>Previous</Link> : null}
            <span className="text-[14px] text-ink-3">Page {res.page} of {res.pages}</span>
            {res.page < res.pages ? <Link rel="next" className={`inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.18] bg-white px-4 text-[14px] ${focus}`} href={qs({ page: res.page + 1 })}>Next</Link> : null}
          </nav>
        ) : null}
      </section>
    </MarketShell>
  );
}
