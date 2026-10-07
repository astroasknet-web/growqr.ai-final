import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseConfigured, val } from "@/lib/portal/db";
import { isVerified } from "@/lib/portal/auth";
import * as passport from "@/lib/portal/passport/profile";
import * as apps from "@/lib/market/applications";
import * as jobs from "@/lib/market/jobs";
import { Avatar, JobCard } from "@/components/market/job-card";
import { ApplyForm } from "@/components/market/apply-form";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { ResendVerification } from "@/components/portal/forms";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const clean = (s: string) => s.replace(/[^a-z0-9-]/g, "");
const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");
const dmy = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  if (!databaseConfigured()) return { title: "Internship | GrowQR" };
  const job = await jobs.bySlug(clean((await params).slug));
  if (!job) return { title: "Internship not found | GrowQR", robots: { index: false, follow: true } };
  const desc = `${job.title} in ${job.loc}, ${rupees(job.stipend)}/month for ${job.weeks} weeks. ${job.about}`;
  return {
    title: `${job.title} at ${job.company} | GrowQR Internships`,
    description: Array.from(desc).slice(0, 155).join(""),
    alternates: { canonical: `${SITE_URL}/internships/${job.slug}` },
    robots: { index: true, follow: true },
  };
}

function List({ title, items }: { title: string; items: string[] }) {
  return items.length ? (
    <>
      <h3 className="text-[16px] font-semibold text-ink mt-5 mb-2">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 text-[15px] text-ink-2">{items.map((d) => <li key={d}>{d}</li>)}</ul>
    </>
  ) : null;
}

export default async function InternshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = clean((await params).slug);
  const me = await currentViewer();
  if (!databaseConfigured()) notFound();
  const job = slug ? await jobs.bySlug(slug, me) : null;
  if (!job) notFound();
  const isStudent = me?.role === "student";
  const profile = isStudent ? await passport.profile(me!.id) : null;
  const m = passport.match(job.skills, profile);
  const existing = isStudent ? await apps.existing(job.id, me!.id) : null;
  const isLive = job.status === "live";
  const hasResume = profile ? ((await val<string>("SELECT resume_text FROM student_profiles WHERE user_id = $1", [me!.id])) ?? "") !== "" : false;
  const related = (await jobs.live()).filter((j) => j.cat === job.cat && j.slug !== job.slug).slice(0, 3).map((j) => ({ ...j, match: passport.match(j.skills, profile).score }));
  const postedLabel = job.posted === 0 ? "today" : job.posted === 1 ? "yesterday" : `${job.posted} days ago`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "JobPosting", title: job.title, description: job.about, employmentType: "INTERN",
        datePosted: new Date(Date.now() - job.posted * 86400000).toISOString().slice(0, 10), validThrough: job.deadline,
        hiringOrganization: { "@type": "Organization", name: job.company },
        jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.loc, addressCountry: "IN" } },
        baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", value: job.stipend, unitText: "MONTH" } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Internships", item: `${SITE_URL}/internships` },
          { "@type": "ListItem", position: 3, name: job.title },
        ],
      },
    ],
  };

  return (
    <MarketShell user={me} active="internships">
      {isLive ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonld) }} /> : null}
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3 mb-4">
        <Link href="/" className="underline">Home</Link> / <Link href="/internships" className="underline">Internships</Link> / <span aria-current="page">{job.title}</span>
      </nav>
      {!isLive ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900" role="status">Preview only. This role is <b>{job.status}</b> and is not visible to students.</p> : null}
      {job.sample ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900" role="status">Sample listing: this is a fictional demo role. Applications to it are saved to your account but no employer receives them.</p> : null}

      <header className="flex gap-4 items-center">
        <Avatar job={job} size="lg" />
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-ink tracking-tight leading-tight">{job.title}</h1>
          <p className="text-[15px] text-ink-3">{job.company} &middot; {job.loc} ({job.mode})</p>
        </div>
      </header>
      <ul className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
        {[["Stipend", `${rupees(job.stipend)} / month`], ["Duration", `${job.weeks} weeks`], ["Openings", String(job.openings)], ["Apply by", dmy(job.deadline)], ["Applicants", String(job.applicants)]].map(([k, v]) => (
          <li key={k} className="bg-white rounded-xl border border-black/[0.08] px-4 py-3"><span className="block text-[12px] text-ink-4">{k}</span><b className="text-[15px] text-ink">{v}</b></li>
        ))}
      </ul>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 mt-6 items-start">
        <div className="space-y-6 min-w-0">
          <article className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7">
            <h2 className="text-[20px] font-bold text-ink mb-2">About the internship</h2>
            <p className="text-[15px] text-ink-2 whitespace-pre-line">{job.about}</p>
            <List title="What you will do" items={job.do} />
            <List title="Who we are looking for" items={job.req} />
            <List title="Perks" items={job.perks} />
            <h3 className="text-[16px] font-semibold text-ink mt-5 mb-2">Skills</h3>
            <ul className="flex flex-wrap gap-2">{job.skills.map((s) => <li key={s} className="px-3 py-1.5 rounded-full bg-cream-3 text-[13px] text-ink-2">{s}</li>)}</ul>
          </article>

          {existing ? (
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5"><h2 className="text-[18px] font-bold text-ink">You have applied</h2><p className="text-[15px] text-ink-3 mt-1">Current status: <b>{existing.status}</b>. <Link className="underline" href="/applications">See the full history</Link>.</p></div>
          ) : !isStudent ? (
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5">
              <h2 className="text-[18px] font-bold text-ink">Apply for this internship</h2>
              {me ? <p className="text-[15px] text-ink-3 mt-1">You are signed in as {me.role}. Only student accounts can apply.</p> : (
                <>
                  <p className="text-[15px] text-ink-3 mt-1 mb-4">Free to apply. Create a student account or log in to continue.</p>
                  <p className="flex flex-wrap gap-3">
                    <Link href="/signup" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[14px]">Create free account</Link>
                    <Link href={`/login?next=${encodeURIComponent(`/internships/${job.slug}`)}`} className="inline-flex items-center min-h-[44px] px-5 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Log in</Link>
                  </p>
                </>
              )}
            </div>
          ) : isLive && !isVerified(me) ? (
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5">
              <h2 className="text-[18px] font-bold text-ink">Confirm your email to apply</h2>
              <p className="text-[15px] text-ink-3 mt-1 mb-4">We sent a confirmation link to <b>{me!.email}</b>. It takes one click, and it keeps fake accounts away from employers.</p>
              <ResendVerification />
            </div>
          ) : isLive ? (
            <ApplyForm slug={job.slug} question={job.q} company={job.company} defaultPhone={profile?.phone ?? ""} hasPassportResume={hasResume} passportResumeName={profile?.resume_name ?? ""} />
          ) : null}
        </div>

        <aside aria-label="Match and employer details" className="space-y-6">
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5">
            {m.score !== null ? (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <b className="text-[34px] text-ink leading-none">{m.score}%</b>
                  <div><h2 className="text-[16px] font-semibold text-ink">Why you match</h2><p className="text-[12px] text-ink-4">75% skill overlap, 25% RQ Score</p></div>
                </div>
                <ul className="space-y-1.5 text-[14px]">
                  {m.have.map((s) => <li key={s} className="text-emerald-800">&#10003; You have {s}{m.via.includes(s) ? " (via a course)" : ""}</li>)}
                  {m.miss.map((s) => <li key={s} className="text-ink-2">+ Gap: {s} <Link className="underline" href={`/courses?q=${encodeURIComponent(s)}`}>Find a course</Link></li>)}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-[16px] font-semibold text-ink">Your match</h2>
                <p className="text-[14px] text-ink-3 mt-1 mb-3">{isStudent ? "Score your resume to see how well you match and which skills you are missing." : "Create a student account and score your resume to see how well you match."}</p>
                <Link href={isStudent ? "/passport" : "/signup"} className="flex items-center justify-center min-h-[44px] rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">{isStudent ? "Build my Skill Passport" : "Create free account"}</Link>
              </>
            )}
            {isStudent && !existing && isLive ? <a href="#apply" className="mt-4 flex items-center justify-center min-h-[44px] rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[14px]">Apply now</a> : null}
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5">
            <h2 className="text-[16px] font-semibold text-ink mb-2">About {job.company}</h2>
            <ul className="space-y-1.5 text-[14px] text-ink-2">
              <li>{job.sample ? "Sample employer" : "Verified employer"}</li>
              <li>{job.badge}</li>
              {job.resp !== null ? <li>Replies to {job.resp}% of applicants within 7 days</li> : null}
              <li>Posted {postedLabel}</li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-10" aria-labelledby="more-h">
          <h2 id="more-h" className="text-[20px] font-bold text-ink mb-4">More in {job.cat}</h2>
          <ul className="grid gap-4 md:grid-cols-3">{related.map((r) => <JobCard key={r.id} job={r} back={`/internships/${job.slug}`} />)}</ul>
        </section>
      ) : null}
    </MarketShell>
  );
}
