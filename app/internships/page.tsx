import type { Metadata } from "next";
import Link from "next/link";
import { databaseConfigured } from "@/lib/portal/db";
import * as passport from "@/lib/portal/passport/profile";
import * as apps from "@/lib/market/applications";
import * as jobs from "@/lib/market/jobs";
import * as saved from "@/lib/market/saved";
import * as listing from "@/lib/market/listing";
import { JobCard } from "@/components/market/job-card";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { SearchBox } from "@/components/market/search-box";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const f = listing.parseFilters(await searchParams);
  const filtered = f.q || f.cat || f.loc.length || f.mode.length || f.min || f.weeks || f.verified || f.ppo || f.fresh || f.short || f.saved || f.page > 1;
  return {
    title: "Paid internships for students and freshers | GrowQR",
    description: "Browse paid internships with a visible stipend, see how well your Skill Passport matches each role, and apply free. No placement fees, ever.",
    alternates: { canonical: `${SITE_URL}/internships` },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

const chip = "inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-orange-light text-orange-deep text-[13px] font-medium";
const box = "flex items-center gap-2.5 min-h-[36px] text-[14px] text-ink-2";

export default async function InternshipsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await currentViewer();
  if (!databaseConfigured()) {
    return <MarketShell user={null} active="internships"><p>Internships are not available right now. Please try again shortly.</p></MarketShell>;
  }
  const isStudent = me?.role === "student";
  const profile = isStudent ? await passport.profile(me!.id) : null;
  const all = (await jobs.live()).map((j) => ({ ...j, match: passport.match(j.skills, profile).score }));
  const savedIds = isStudent ? await saved.ids(me!.id) : [];
  const appliedIds = isStudent ? await apps.appliedJobIds(me!.id) : [];
  const f = listing.parseFilters(sp);
  const L = listing.run(all, f, { isStudent, hasProfile: Boolean(profile), savedIds });
  const u = (change: Parameters<typeof listing.url>[2] = {}) => listing.url(f, L.defaultSort, change);
  const here = u({});
  const pageUrl = (n: number) => (n === 1 ? here : here + (here.includes("?") ? "&" : "?") + "page=" + n);
  const count = (fn: (j: jobs.Job) => boolean) => all.filter(fn).length;
  const s = L.search;

  const filterForm = (idp: string) => (
    <form method="get" action="/internships" className="mt-2">
      {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
      {f.cat ? <input type="hidden" name="cat" value={f.cat} /> : null}
      {f.sort && f.sort !== L.defaultSort ? <input type="hidden" name="sort" value={f.sort} /> : null}
      <fieldset className="mb-3"><legend className="text-[13px] font-semibold text-ink mb-1">Location</legend>
        {listing.LOCATIONS.map((l) => <label key={l} className={box}><input type="checkbox" name="loc" value={l} defaultChecked={f.loc.includes(l)} />{l} <span className="text-ink-4">{count((j) => j.loc === l)}</span></label>)}
      </fieldset>
      <fieldset className="mb-3"><legend className="text-[13px] font-semibold text-ink mb-1">Work mode</legend>
        {listing.MODES.map((m) => <label key={m} className={box}><input type="checkbox" name="mode" value={m} defaultChecked={f.mode.includes(m)} />{m}</label>)}
      </fieldset>
      <div className="mb-3">
        <label htmlFor={`min-${idp}`} className="text-[13px] font-semibold text-ink block mb-1">Minimum stipend</label>
        <select id={`min-${idp}`} name="min" defaultValue={f.min || ""} className="w-full min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[15px]">
          <option value="">Any</option>
          {listing.MIN_STIPENDS.map((n) => <option key={n} value={n}>₹{n.toLocaleString("en-IN")}+ / month</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor={`weeks-${idp}`} className="text-[13px] font-semibold text-ink block mb-1">Duration</label>
        <select id={`weeks-${idp}`} name="weeks" defaultValue={f.weeks || ""} className="w-full min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[15px]">
          <option value="">Any</option>
          {listing.MAX_WEEKS.map((n) => <option key={n} value={n}>Up to {n} weeks</option>)}
        </select>
      </div>
      <fieldset className="mb-4"><legend className="text-[13px] font-semibold text-ink mb-1">More</legend>
        <label className={box}><input type="checkbox" name="verified" value="1" defaultChecked={f.verified} />Verified stipend</label>
        <label className={box}><input type="checkbox" name="ppo" value="1" defaultChecked={f.ppo} />PPO possible</label>
        <label className={box}><input type="checkbox" name="new" value="1" defaultChecked={f.fresh} />New this week</label>
        <label className={box}><input type="checkbox" name="short" value="1" defaultChecked={f.short} />8 weeks or less</label>
        {isStudent ? <label className={box}><input type="checkbox" name="saved" value="1" defaultChecked={f.saved} />Saved only</label> : null}
      </fieldset>
      <button type="submit" className="w-full min-h-[44px] rounded-lg bg-ink text-white font-semibold text-[14px]">Apply filters</button>
    </form>
  );

  return (
    <MarketShell user={me} active="internships">
      <h1 className="text-[28px] sm:text-[34px] font-bold text-ink tracking-tight">Paid internships</h1>
      <p className="text-[15px] text-ink-3 mt-1.5 mb-6 max-w-2xl">Every role shows its stipend. Apply free, and see how well your Skill Passport matches before you do. We never charge placement fees.</p>

      <SearchBox defaultValue={f.q} preserve={{ ...(f.cat ? { cat: f.cat } : {}), ...(f.loc.length ? { loc: f.loc } : {}), ...(f.mode.length ? { mode: f.mode } : {}) }} />

      <nav aria-label="Fields" className="flex flex-wrap gap-2 mt-4">
        {listing.CATEGORIES.map(([name]) => (
          <Link key={name} href={u({ set: { cat: f.cat === name ? "" : name } })} aria-current={f.cat === name ? "true" : undefined} className={`min-h-[40px] inline-flex items-center px-3.5 rounded-full border text-[13px] ${f.cat === name ? "bg-ink text-white border-ink" : "border-black/[0.15] bg-white text-ink-2 hover:bg-cream-3"}`}>
            {name} <span className="ml-1.5 text-ink-4">{count((j) => j.cat === name)}</span>
          </Link>
        ))}
      </nav>

      <div className="grid lg:grid-cols-[16rem_1fr] gap-6 mt-6 items-start">
        <aside aria-label="Filters">
          <details className="lg:hidden bg-white rounded-2xl border border-black/[0.08] p-4">
            <summary className="font-semibold text-ink min-h-[44px] flex items-center cursor-pointer">Filters{L.chips.length ? ` (${L.chips.length} active)` : ""}</summary>
            {filterForm("m")}
          </details>
          <div className="hidden lg:block bg-white rounded-2xl border border-black/[0.08] p-4">
            <h2 className="font-semibold text-ink mb-2">Filters</h2>
            {filterForm("d")}
          </div>
        </aside>

        <section aria-labelledby="results-h">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 id="results-h" className="text-[18px] font-semibold text-ink">{L.total} {L.total === 1 ? "internship" : "internships"}</h2>
            <form method="get" action="/internships" className="flex items-center gap-2">
              {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
              {f.cat ? <input type="hidden" name="cat" value={f.cat} /> : null}
              {f.loc.map((l) => <input key={l} type="hidden" name="loc" value={l} />)}
              {f.mode.map((m) => <input key={m} type="hidden" name="mode" value={m} />)}
              {f.min ? <input type="hidden" name="min" value={f.min} /> : null}
              {f.weeks ? <input type="hidden" name="weeks" value={f.weeks} /> : null}
              {f.verified ? <input type="hidden" name="verified" value="1" /> : null}
              {f.ppo ? <input type="hidden" name="ppo" value="1" /> : null}
              {f.fresh ? <input type="hidden" name="new" value="1" /> : null}
              {f.short ? <input type="hidden" name="short" value="1" /> : null}
              {f.saved ? <input type="hidden" name="saved" value="1" /> : null}
              <label htmlFor="sort" className="text-[13px] text-ink-3">Sort</label>
              <select id="sort" name="sort" defaultValue={L.sort} className="min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[14px]">
                {s.mode !== "all" ? <option value="relevance">Best match for search</option> : null}
                {profile ? <option value="match">Best match for you</option> : null}
                <option value="new">Newest</option>
                <option value="stipend">Highest stipend</option>
                <option value="deadline">Closing soon</option>
              </select>
              <button type="submit" className="min-h-[44px] px-4 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Sort</button>
            </form>
          </div>

          {L.chips.length ? (
            <ul className="flex flex-wrap gap-2 mb-4" aria-label="Active filters">
              {L.chips.map((c) => <li key={c.label}><Link className={chip} href={u({ drop: c.drop, arrayVal: c.arrayVal })} aria-label={`Remove filter ${c.label}`}>{c.label} <span aria-hidden="true">&times;</span></Link></li>)}
              <li><Link className="inline-flex items-center min-h-[36px] px-3 text-[13px] underline text-ink-3" href="/internships">Clear all</Link></li>
            </ul>
          ) : null}

          {s.mode === "corrected" ? <p className="mb-4 text-[14px] text-ink-2" role="status">No results for &ldquo;{s.original}&rdquo;. Showing results for <Link className="underline font-medium" href={u({ set: { q: s.corrected ?? "" } })}>{s.corrected}</Link>.</p> : null}
          {s.mode === "related" ? <p className="mb-4 text-[14px] text-ink-2" role="status">Nothing matched every word in &ldquo;{s.original}&rdquo;. These roles match part of it.</p> : null}

          {L.items.length ? (
            <ul className="grid gap-4">
              {L.items.map((j) => <JobCard key={j.id} job={j} terms={s.terms} saved={savedIds.includes(j.id)} canSave={isStudent} applied={appliedIds.includes(j.id)} back={pageUrl(L.page)} />)}
            </ul>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.08] p-8 text-center">
              <h3 className="text-[18px] font-semibold text-ink">No internships match</h3>
              <p className="text-[14px] text-ink-3 mt-1 mb-4">Try fewer filters or a broader search.</p>
              <Link href="/internships" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[14px]">Clear filters</Link>
            </div>
          )}

          {L.pages > 1 ? (
            <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {L.page > 1 ? <Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] bg-white text-[14px]" href={pageUrl(L.page - 1)} rel="prev">Previous</Link> : null}
              <span className="text-[14px] text-ink-3">Page {L.page} of {L.pages}</span>
              {L.page < L.pages ? <Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] bg-white text-[14px]" href={pageUrl(L.page + 1)} rel="next">Next</Link> : null}
            </nav>
          ) : null}
        </section>
      </div>
    </MarketShell>
  );
}
