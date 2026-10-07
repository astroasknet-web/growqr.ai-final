/* eslint-disable @next/next/no-html-link-for-pages -- the old site navigated with plain links (full page loads); its scripts and styles rely on that */
import type { Metadata, Viewport } from "next";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession, type PortalUser } from "@/lib/portal/session";
import * as passport from "@/lib/portal/passport/profile";
import * as jobs from "@/lib/market/jobs";
import * as courses from "@/lib/market/courses";
import * as abroad from "@/lib/abroad/catalogue";
import { Icon } from "@/components/qrs/icon";
import { CatTile } from "@/components/qrs/course-art";
import { QrsCourseCard } from "@/components/qrs/cards";
import { QrsBehavior } from "@/components/qrs/behavior";
import { QrsHomeBehavior } from "@/components/qrs/home-behavior";
import { mathstudy, QrsFooter, QrsHeader, QrsStyles } from "@/components/qrs/shell";

// The portal's own home page (served at "/" when SITE_MODE=portal): the original qrscore home, section for section.
const TITLE = "Paid Internships for Students | GrowQR Internships";
const DESC = "Find verified paid internships and apply free. GrowQR matches students on proven skills and protects every stipend with escrow. Build your Skill Passport.";
export const metadata: Metadata = {
  title: TITLE, description: DESC, robots: { index: true, follow: true }, alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: "Verified paid internships, free to apply, with stipend escrow and transparent hiring.", url: "/", type: "website", images: ["/og-image.png"] },
  twitter: { card: "summary_large_image", title: TITLE, description: "Verified paid internships, free to apply, with stipend escrow and transparent hiring.", images: ["/og-image.png"] },
  icons: { icon: "/qrscore/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#4338ca" };
export const dynamic = "force-dynamic";

const CATEGORIES: Array<[string, string, string]> = [
  ["Software & Web", "code", "Frontend, backend, mobile"], ["Data & AI", "chart", "Analytics, ML, BI"], ["Design & Creative", "pen", "UI/UX, graphics, video"], ["Marketing", "megaphone", "SEO, social, content"],
  ["Finance & Accounts", "coins", "Audit, FinTech, equity"], ["HR & Operations", "users", "Talent, people ops"], ["Law & Policy", "scale", "Research, compliance"], ["Core Engineering", "cog", "Mech, civil, electrical"],
];
const STEPS: Record<string, Array<[string, string]>> = {
  student: [
    ["Build your Skill Passport", "Upload your resume and get an RQ Score. Your skills and score travel with you to every application."],
    ["Get matched, with reasons", "See why you fit each role and exactly which skill is missing, plus a course to close the gap."],
    ["Apply free, track honestly", "Every application shows its stage and the employer response time. No black hole."],
    ["Start paid, protected", "Stipends are held in escrow and released on approved timesheets."],
  ],
  employer: [
    ["Post a role in 5 minutes", "Pick a template, set the stipend and the skills that matter. Verification takes one business day."],
    ["Receive a vetted shortlist", "Candidates arrive ranked by verified skill scores, not by who wrote the longest cover letter."],
    ["Try before you hire", "Offer a short paid project and review real work before making an offer."],
    ["Pay only when they start", "Zero upfront risk on the Bounty plan. You pay after the intern completes 15 days."],
  ],
};
const FAQS: Array<[string, string]> = [
  ["Is GrowQR free for students?", "Yes. Browsing, applying and building your Skill Passport cost nothing. We never charge students a fee to be placed in an internship."],
  ["How do verified stipends work?", "For listings with the Verified Stipend badge, the employer deposits the first month into escrow before the internship begins. We release it to you once your timesheet is approved."],
  ["What is the Skill Passport?", "A scored profile of your skills and resume quality. Employers can filter on it directly, so a strong passport gets you noticed without a perfect CV."],
  ["How is my resume score calculated?", "Our RQ Score engine rates how clearly and convincingly your resume presents your education, experience, skills and impact. It is rule-based, so the same resume always gets the same score, and you get plain advice on what to improve first."],
  ["How do employers get verified?", "We check the business domain email and registration details, and review the first posting by hand. Listings that fail verification never go live."],
  ["What do employers pay?", "Starter is free with one active role. Growth is a monthly plan. Bounty has no upfront cost and charges only when a hired intern completes their first 15 days."],
];
const EBOOK_CHIPS: Array<[string, string]> = [["SAT Math", "/shop?cat=SAT%20Math%20practice"], ["JEE Maths", "/shop/category/jee-mathematics"], ["CAT Quant", "/shop/category/cat-quant-math"], ["IMO Olympiad", "/shop/category/imo-class-5-math"], ["CTET", "/shop/category/ctet-paper-1-math"], ["Case studies", "/shop/case-studies"]];
const inr = (n: number) => n.toLocaleString("en-IN");

export default async function QrsHome() {
  let me: PortalUser | null = null;
  let internships: Array<jobs.Job & { match: number | null }> = [];
  let featured: courses.Course[] = [];
  let cats: Array<{ key: string; name: string; c1: string; c2: string; n: number }> = [];
  let allCats = 0;
  let total = 0;
  let countries: Array<abroad.Country & { n: number }> = [];
  let uniTotal = 0;
  if (databaseConfigured()) {
    try {
      me = (await getSession())?.user ?? null;
      const profile = me?.role === "student" ? await passport.profile(me.id) : null;
      internships = (await jobs.live()).slice(0, 6).map((j) => ({ ...j, match: me?.role === "student" ? passport.match(j.skills, profile).score : null }));
      featured = await courses.featured(6);
      const all = await courses.categories();
      allCats = all.length;
      cats = [...all].sort((a, b) => b.n - a.n).slice(0, 8);
      total = await courses.total();
      countries = Object.values(await abroad.countries());
      uniTotal = await abroad.totalUniversities();
    } catch (e) {
      console.error("[home]", (e as Error).message); // the page still renders without the data sections
    }
  }
  const isStudent = me?.role === "student";
  const checkUrl = isStudent ? "/passport" : "/resume-score";
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "GrowQR Internships", url: "/" },
      { "@type": "FAQPage", mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };

  return (
    <>
      <QrsStyles home />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="qrs">
        <a className="skip" href="#main">Skip to content</a>
        <div className="announce"><div className="wrap"><span><strong>New:</strong> Verified-stipend internships, with the first month held in escrow.</span><a href="#how">See how it works <Icon n="arrow" /></a></div></div>
        <QrsHeader />

        <main id="main">
          <section className="hero">
            <div className="hero-bg" aria-hidden="true" />
            <div className="wrap hero-grid">
              <div className="hero-copy">
                <p className="eyebrow"><Icon n="shield" /> Free for students. Always.</p>
                <h1>Your first internship, <span className="grad">verified and paid.</span></h1>
                <p className="lead">Prove your skills once, get matched to real roles, and know your stipend is protected before you start. No placement fees, no ghosting.</p>
                <form className="search" id="search" role="search" aria-label="Search internships">
                  <div className="s-field"><Icon n="search" /><label className="sr" htmlFor="q">Role or skill</label><input id="q" name="q" type="search" placeholder="Role or skill, e.g. React" autoComplete="off" /></div>
                  <div className="s-field"><Icon n="pin" /><label className="sr" htmlFor="loc">Location</label>
                    <select id="loc" name="loc"><option value="">Anywhere</option><option>Remote</option><option>Bengaluru</option><option>Mumbai</option><option>Pune</option></select></div>
                  <button className="btn btn-primary btn-lg" type="submit">Search</button>
                </form>
                <div className="chips-row"><span className="chips-label">Popular:</span>
                  <ul className="chips" id="chips">
                    <li><button type="button" data-q="React">React</button></li><li><button type="button" data-q="Data">Data analysis</button></li>
                    <li><button type="button" data-q="SEO">Content &amp; SEO</button></li><li><button type="button" data-q="Figma">UI/UX</button></li>
                    <li><button type="button" data-loc="Remote">Work from home</button></li>
                  </ul></div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="float f-main">
                  <div className="f-head"><span className="av">NL</span><div><b>Frontend Developer Intern</b><small>Northwind Labs &middot; Remote</small></div></div>
                  <div className="meter"><span style={{ "--v": "91%" } as React.CSSProperties} /></div>
                  <div className="f-row"><span>Your match</span><b>91%</b></div>
                  <ul className="f-list"><li className="ok"><Icon n="check" /> React, CSS, Git</li><li className="miss"><Icon n="plus" /> Missing: Testing basics</li></ul>
                </div>
                <div className="float f-badge"><Icon n="wallet" /> <div><b>&#8377;18,000 / month</b><small>Escrow funded</small></div></div>
                <div className="float f-pass"><div className="ring" style={{ "--v": 82 } as React.CSSProperties}><b>82</b></div><div><b>Skill Passport</b><small>Illustrative score</small></div></div>
              </div>
            </div>
          </section>

          <section className="promises" aria-label="Our commitments"><div className="wrap promises-grid">
            <div><Icon n="wallet" /><b>&#8377;0</b><span>to apply or get placed</span></div><div><Icon n="shield" /><b>Escrow</b><span>protected stipends</span></div>
            <div><Icon n="clock" /><b>7 days</b><span>max wait before a reply or auto-resurface</span></div><div><Icon n="check" /><b>Verified</b><span>employers only</span></div>
          </div></section>

          <section className="sec" id="categories"><div className="wrap">
            <header className="sec-head"><p className="kicker">Explore</p><h2>Find internships by field</h2><p>Pick a track and see roles matched to what you can already do.</p></header>
            <ul className="cat-grid">{CATEGORIES.map((c) => (
              <li key={c[0]}><a className="cat" href="#internships" data-cat={c[0]}><span className="cat-ic"><Icon n={c[1]} /></span><span className="cat-t">{c[0]}</span><span className="cat-s">{c[2]}</span></a></li>
            ))}</ul>
          </div></section>

          <section className="sec sec-alt" id="internships"><div className="wrap">
            <header className="sec-head sec-head-row">
              <div><p className="kicker">Latest</p><h2>Internships hiring now</h2><p>Listings marked Sample are fictional demo roles while the platform is in preview.</p></div>
              <div className="tabs" role="group" aria-label="Filter by category" id="tabs">
                <button type="button" aria-pressed="true" data-cat="">All</button>
                {CATEGORIES.map((c) => <button key={c[0]} type="button" aria-pressed="false" data-cat={c[0]}>{c[0]}</button>)}
              </div>
            </header>
            <p className="status" id="status" role="status" aria-live="polite" />
            <ul className="jobs" id="jobs">{internships.map((j) => (
              <li key={j.id} className="job" data-cat={j.cat} data-loc={j.loc} data-text={`${j.title} ${j.company} ${j.skills.join(" ")}`.toLowerCase()}>
                <article>
                  <div className="job-top">
                    <span className="av" style={{ background: j.color }} aria-hidden="true">{j.ini}</span>
                    <div><h3><a className="stretch" href={`/internships/${j.slug}`}>{j.title}</a></h3><p className="co">{j.company}</p></div>
                    {j.match !== null ? <span className="match" title="Based on your Skill Passport">{j.match}% match</span> : null}
                  </div>
                  <ul className="meta"><li><Icon n="pin" /> {j.loc}</li><li><Icon n="wallet" /> &#8377;{inr(j.stipend)}/mo</li><li><Icon n="clock" /> {j.weeks} weeks</li></ul>
                  <ul className="skills">{j.skills.slice(0, 4).map((s) => <li key={s}>{s}</li>)}</ul>
                  <div className="job-foot">
                    <span className={`tag ${j.badge === "Verified stipend" ? "tag-ok" : j.badge === "Paid internship" ? "tag-n" : "tag-pp"}`}><Icon n={j.badge === "Verified stipend" ? "shield" : j.badge === "Paid internship" ? "wallet" : "bolt"} /> {j.badge}</span>
                    <span className="btn btn-soft" aria-hidden="true">View &amp; apply</span>
                  </div>
                </article>
              </li>
            ))}</ul>
            <p className="empty" id="empty" hidden>No sample roles match that search. Try a broader keyword.</p>
            <p className="center"><a className="btn btn-outline" href="/internships">Browse all internships <Icon n="arrow" /></a></p>
          </div></section>

          {featured.length ? (
            <section className="sec courses-sec" id="courses"><div className="wrap">
              <header className="courses-hero">
                <div><p className="kicker">Upskill</p><h2>Learn the skills employers ask for</h2><p>Close the gap on your Skill Passport with self-paced courses. Each one ends in a hands-on project, a certificate and a badge.</p></div>
                <ul className="cs-stats" aria-label="Course library"><li><b>{total}</b><span>courses</span></li><li><b>{allCats}</b><span>fields</span></li><li><b>100%</b><span>self-paced</span></li><li><b><Icon n="award" /></b><span>certificate and badge</span></li></ul>
              </header>
              <h3 className="cs-sub">Popular right now</h3>
              <ul className="courses courses-3">{featured.map((c, i) => <QrsCourseCard key={c.slug} c={c} n={i} />)}</ul>
              <h3 className="cs-sub">Browse by field</h3>
              <ul className="cat-tiles">{cats.map((cc) => (
                <li key={cc.key}><a href={`/courses?cat=${cc.key}`}><CatTile cat={cc.key} c1={cc.c1} c2={cc.c2} /><span className="ct-t"><b>{cc.name}</b><small>{cc.n} courses</small></span></a></li>
              ))}</ul>
              <p className="center"><a className="btn btn-primary btn-lg" href="/courses">See all {total} courses <Icon n="arrow" /></a></p>
            </div></section>
          ) : null}

          {countries.length ? (
            <section className="sec sa-home" id="study-abroad"><div className="wrap">
              <header className="sec-head sec-head-row">
                <div><p className="kicker">Study abroad</p><h2>Your degree abroad, planned step by step</h2><p>Explore {uniTotal} universities in {countries.length} countries, see which are a Safe, Target or Reach for you, and track your application from documents to visa.</p></div>
                <a className="btn btn-outline" href="/study-abroad">All destinations <Icon n="arrow" /></a>
              </header>
              <ul className="dest-grid dest-grid-home">
                {countries.map((c) => (
                  <li key={c.key}><a className="dest" href={`/study-abroad/${c.key}`} style={{ "--c1": c.c1, "--c2": c.c2 } as React.CSSProperties}>
                    <span className="dest-top"><span className="cn-tile lg" style={{ background: `linear-gradient(135deg,${c.c1},${c.c2})` }} aria-hidden="true">{c.code}</span><span className="dest-name"><b>{c.name}</b><small>{c.n} universities</small></span></span>
                    <span className="dest-tag">{String(c.tagline ?? "")}</span><span className="dest-go">Explore <Icon n="arrow" /></span></a></li>
                ))}
                <li><a className="dest dest-cta" href={isStudent ? "/abroad/profile" : "/signup"}>
                  <span className="dest-top"><span className="cn-tile lg" style={{ background: "linear-gradient(135deg,#4338ca,#0d9488)" }} aria-hidden="true"><Icon n="star" /></span><span className="dest-name"><b>Find my best fit</b><small>Free, takes 5 minutes</small></span></span>
                  <span className="dest-tag">Share your marks, English score and budget. We label every university Safe, Target or Reach for you.</span><span className="dest-go">Get my matches <Icon n="arrow" /></span></a></li>
              </ul>
            </div></section>
          ) : null}

          <section className="sec" id="how"><div className="wrap">
            <header className="sec-head center-head"><p className="kicker">How it works</p><h2>Four steps, no surprises</h2></header>
            <div className="seg" role="group" aria-label="Choose audience" id="seg">
              <button type="button" aria-pressed="true" data-aud="student">I&rsquo;m a student</button><button type="button" aria-pressed="false" data-aud="employer">I&rsquo;m hiring</button>
            </div>
            {Object.entries(STEPS).map(([aud, list]) => (
              <ol key={aud} className="steps" data-aud={aud} hidden={aud === "employer"}>{list.map((s, i) => <li key={s[0]}><span className="n">{i + 1}</span><h3>{s[0]}</h3><p>{s[1]}</p></li>)}</ol>
            ))}
          </div></section>

          <section className="sec passport" id="passport"><div className="wrap pass-grid">
            <div>
              <p className="kicker kicker-light">Skill Passport</p><h2>Let your skills do the talking</h2>
              <p className="lead-l">Most hiring starts with a CV that nobody has time to read. Your Skill Passport replaces guesswork with a proctored, scored profile that employers can filter on directly.</p>
              <ul className="ticks"><li><Icon n="check" /> Your resume scored by the GrowQR quality engine</li><li><Icon n="check" /> Skill percentile by field, not a vague badge</li><li><Icon n="check" /> Exact gaps, each with a course to close it</li><li><Icon n="check" /> Completed projects added automatically</li></ul>
              <a className="btn btn-light btn-lg" href={checkUrl}>Check your resume score free <Icon n="arrow" /></a>
            </div>
            <div className="pass-card" aria-hidden="true">
              <div className="pc-head"><span>RQ Score</span><b>Strong</b></div>
              <div className="pc-score"><div className="ring ring-lg" style={{ "--v": 78 } as React.CSSProperties}><b>78</b></div></div>
              <ul className="bars">{([["Education", 85], ["Experience", 60], ["Skills", 82], ["Projects", 90], ["Impact", 68]] as const).map(([l, v]) => <li key={l}><span>{l}</span><i style={{ "--v": `${v}%` } as React.CSSProperties} /></li>)}</ul>
              <p className="pc-note">Illustrative example of a report</p>
            </div>
          </div></section>

          <section className="sec sec-alt" id="why"><div className="wrap">
            <header className="sec-head center-head"><p className="kicker">Why GrowQR</p><h2>The usual internship hunt, fixed</h2></header>
            <div className="table-wrap"><table className="cmp">
              <thead><tr><th scope="col">What you care about</th><th scope="col">Typical portal</th><th scope="col" className="us">GrowQR</th></tr></thead>
              <tbody>{([["Fees for students", "Often hidden or upsold", "None, ever"], ["Stipend safety", "Trust the employer", "Escrow on verified roles"], ["Employer replies", "Application black hole", "Stage tracking and response rates"], ["How you are judged", "CV and luck", "Verified skill scores"], ["Why you matched", "Unexplained", "Shown, with gaps and fixes"]] as const).map(([a, b, c]) => (
                <tr key={a}><th scope="row">{a}</th><td><Icon n="x" /> {b}</td><td className="us"><Icon n="check" /> {c}</td></tr>
              ))}</tbody>
            </table></div>
          </div></section>

          <section className="sec" id="gigs"><div className="wrap split">
            <div><p className="kicker">Micro-gigs</p><h2>Earn this week, not next semester</h2>
              <p className="lead-d">Short paid projects of 10 to 40 hours: scrape a dataset, design five templates, fix a landing page. Each completed gig lands in your portfolio with a verified badge, which makes your next application stronger.</p>
              <a className="btn btn-primary" href="#">Explore gigs <Icon n="arrow" /></a></div>
            <ul className="gig-list" aria-label="Example gigs">
              <li><b>Python scraper for a price list</b><span>&#8377;3,500 &middot; 12 hrs</span></li><li><b>5 Instagram carousel templates</b><span>&#8377;2,500 &middot; 8 hrs</span></li>
              <li><b>Landing page copy and meta tags</b><span>&#8377;1,800 &middot; 6 hrs</span></li><li className="note">Sample gigs for illustration</li>
            </ul>
          </div></section>

          <section className="sec sec-dark" id="employers"><div className="wrap">
            <header className="sec-head center-head"><p className="kicker kicker-light">For employers</p><h2>Hire interns without the screening grind</h2><p>Verified candidates, ranked by proven skill. Choose the model that suits your risk appetite.</p></header>
            <ul className="plans">
              <li className="plan"><h3>Starter</h3><p className="price">Free</p><ul><li>1 active role</li><li>Basic filters</li><li>Verified company badge</li></ul><a className="btn btn-outline-l" href="/employer/post">Post a role</a></li>
              <li className="plan plan-hot"><span className="ribbon">Zero risk</span><h3>Bounty</h3><p className="price">&#8377;0 <small>upfront</small></p><ul><li>Pay &#8377;10,000 only per hire</li><li>Charged after 15 days on the job</li><li>Skill-ranked shortlist</li></ul><a className="btn btn-light" href="/signup?role=employer">Start hiring</a></li>
              <li className="plan"><h3>Growth</h3><p className="price">&#8377;4,999 <small>/ month</small></p><ul><li>5 active roles</li><li>Pre-ranked candidates</li><li>30-day replacement guarantee</li></ul><a className="btn btn-outline-l" href="/signup?role=employer">Talk to us</a></li>
            </ul>
            <p className="fine">Plan details are indicative for the preview and may change at launch.</p>
          </div></section>

          <section className="ebk home" aria-labelledby="ebk-home"><div className="wrap ebk-in">
            <div className="ebk-copy"><p className="ebk-eyebrow">From MathStudy.in</p><h2 id="ebk-home">Practice e-books for exams that open doors</h2>
              <p>Chapter-wise question banks and full practice papers for SAT, JEE, CAT, IMO and CTET, written and checked by teachers. Priced for students, with instant download.</p></div>
            <div className="ebk-act">
              <ul className="ebk-chips">{EBOOK_CHIPS.map(([l, p]) => <li key={l}><a href={mathstudy(p, "home")} target="_blank" rel="noopener noreferrer">{l}<span className="sr-only"> (opens MathStudy.in in a new tab)</span></a></li>)}</ul>
              <a className="btn btn-primary" href={mathstudy("/shop", "home")} target="_blank" rel="noopener noreferrer">Browse all e-books<span className="sr-only"> (opens MathStudy.in in a new tab)</span></a>
            </div>
          </div></section>

          <section className="sec" id="colleges"><div className="wrap colleges">
            <div className="col-ic"><Icon n="cap" /></div>
            <div><h2>Running a placement cell?</h2><p className="lead-d">Campus Connect gives your institution a branded placement portal, free Pro access for every enrolled student, and analytics that show exactly where your students are in the hiring pipeline.</p>
              <a className="btn btn-outline" href="#">Partner with GrowQR <Icon n="arrow" /></a></div>
          </div></section>

          <section className="sec sec-alt" id="faq"><div className="wrap narrow">
            <header className="sec-head center-head"><p className="kicker">FAQ</p><h2>Straight answers</h2></header>
            <div className="faq">{FAQS.map((f) => <details key={f[0]}><summary>{f[0]}<Icon n="plus" /></summary><p>{f[1]}</p></details>)}</div>
          </div></section>

          <section className="cta"><div className="wrap">
            <h2>Start with a free resume score</h2><p>It takes two minutes and shows you exactly where to improve before you apply.</p>
            <div className="cta-btns"><a className="btn btn-light btn-lg" href={checkUrl}>Score my resume</a><a className="btn btn-outline-l btn-lg" href="/signup">Create free account</a></div>
          </div></section>
        </main>

        <QrsFooter home />
      </div>
      <QrsBehavior />
      <QrsHomeBehavior />
    </>
  );
}
