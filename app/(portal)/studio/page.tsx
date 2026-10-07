import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/portal/guard";
import { getSession } from "@/lib/portal/session";
import { databaseConfigured } from "@/lib/portal/db";
import * as passport from "@/lib/portal/passport/profile";
import * as access from "@/lib/studio/access";
import * as pay from "@/lib/studio/pay";
import { html } from "@/lib/studio/renderer";
import { fromProfile, sample, type ResumeData } from "@/lib/studio/resume-data";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";
import { PortalPage } from "@/components/portal/shell";
import { StudioScripts } from "@/components/studio/studio-ui";
import { StudioStyles, TemplateCard, UpgradeDialog } from "@/components/studio/studio-parts";
import { savePrefsAction, useTemplateAction } from "./actions";

export const metadata: Metadata = { title: "Resume Studio | GrowQR" };
export const dynamic = "force-dynamic";

const fmtDay = (s: string, withYear = false) =>
  new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

function Select({ name, label, opts, cur }: { name: string; label: string; opts: Record<string, string>; cur: string }) {
  return (
    <div className="fld">
      <label htmlFor={`g-${name}`}>{label}</label>
      <select id={`g-${name}`} name={name} defaultValue={cur}>
        {!("" in opts) ? <option value="">Choose...</option> : null}
        {Object.entries(opts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser("student");
  const sp = await searchParams;
  if (!databaseConfigured()) return null;
  const uid = me.id;
  const csrf = (await getSession())?.csrf ?? "";
  const pro = await access.isPro(uid);
  const sub = pro ? await access.subscription(uid) : null;

  const profile = await passport.profile(uid);
  const rq = profile?.rq ?? null;
  const rqScore = profile && profile.rq_overall !== null ? Number(profile.rq_overall) : null;
  const resumes = await store.resumes(uid);
  let thumbData: ResumeData | null = null;
  if (resumes.length) thumbData = (await store.find(uid, resumes[0].id))?.data ?? null;
  const yours = thumbData !== null || rq !== null;
  if (thumbData === null) thumbData = rq ? fromProfile(rq, me, await store.resumeText(uid)) : sample();
  const prefs = store.guessPrefs(rq, await store.prefs(uid));
  const rec = templates.recommend(prefs, rqScore, pro);
  const popular = templates.popular(await store.usage(), rec);
  const wait = await access.secondsUntilNextSave(uid, pro);

  // gallery filters
  const fFormat = sp.format && (sp.format in templates.FORMATS || sp.format in templates.REGIONS) ? sp.format : "";
  const fStyle = sp.style && sp.style in templates.STYLES ? sp.style : "";
  const fAts = sp.ats === "safe" ? "safe" : "";
  const fShow = sp.show === "free" || sp.show === "locked" ? sp.show : "";
  const all = Object.values(templates.all()).filter(
    (t) => (fFormat === "" || t.format === fFormat) && (fStyle === "" || t.style === fStyle) && (fAts === "" || t.ats === "safe") && (fShow === "" || (fShow === "free") === t.free),
  );
  const filterUrl = (o: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ format: fFormat, style: fStyle, ats: fAts, show: fShow, ...o })) if (v !== "") q.set(k, v);
    const s = q.toString();
    return `/studio${s ? "?" + s : ""}#all`;
  };

  const card = (t: templates.Template, badge?: string) => (
    <TemplateCard key={t.id} t={t} open={t.free || pro} thumbHtml={t.free || pro ? html(thumbData!, t, true) : ""} badge={badge} useAction={useTemplateAction} />
  );
  const plan = { priceInr: access.priceInr(), planLabel: access.planLabel(), cooldownHours: access.cooldownHours(), lifetime: access.isLifetime(), payEnabled: pay.enabled() };
  const days = sub ? (Date.parse(sub.ends_at.replace(" ", "T") + "Z") - Date.now()) / 86400000 : 0;

  return (
    <PortalPage user={me} active="studio" title="Resume Studio" subtitle="Pick a format, watch your RQ Score rise as you edit, and tailor it to any job." wide="full">
      <StudioStyles />
      <div className="studio-root sh" data-csrf={csrf} data-pay={pay.enabled() ? "1" : "0"}>
        {sp.locked ? <p className="notice notice-warn" role="alert">That template is part of Resume Studio Pro.</p> : null}

        <section className={`sh-plan ${pro ? "is-pro" : ""}`} aria-label="Your plan">
          <div>
            <b>{pro ? "Resume Studio Pro" : "Free plan"}</b>
            <p>
              {pro
                ? access.isLifetimeDays(days) ? "All 45 templates and unlimited updates, yours for life." : `All 45 templates and unlimited updates until ${fmtDay(sub!.ends_at, true)}.`
                : <>8 of 45 templates &middot; one saved update every {access.cooldownHours()} hours &middot; {wait > 0 ? <b>next update in {access.countdown(wait)}</b> : <b>your update is available now</b>}.</>}
            </p>
          </div>
          {!pro ? <button className="btn btn-primary" type="button" data-upgrade>Unlock all 45 &middot; &#8377;{access.priceInr()} once</button> : null}
        </section>

        {resumes.length ? (
          <section className="panel sh-mine" aria-labelledby="mine-h">
            <h2 id="mine-h">Your resume</h2>
            {resumes.map((r) => {
              const t = templates.get(r.template);
              return (
                <div className="sh-row" key={r.id}>
                  <div><b>{r.title}</b><small>{t?.name ?? ""} &middot; {Number(r.saves)} saved update{Number(r.saves) === 1 ? "" : "s"} &middot; edited {fmtDay(r.updated_at)}</small></div>
                  <div className="sh-row-score">{r.score !== null ? <><span className="sh-pill">{Math.round(Number(r.score))}</span> {r.grade}</> : null}</div>
                  <Link className="btn btn-primary" href={`/studio/edit/${r.id}`}>Open editor</Link>
                </div>
              );
            })}
          </section>
        ) : null}

        <section className="panel sh-guide" aria-labelledby="guide-h">
          <h2 id="guide-h">Which format suits you?</h2>
          <p className="muted">Answer four quick questions and we will rank the templates for you. Your RQ Score{rqScore !== null ? ` (${Math.round(rqScore)})` : ""} is part of the advice.</p>
          <form action={savePrefsAction} className="sh-form">
            <Select name="region" label="Where will you apply?" opts={templates.regionOptions()} cur={prefs.region} />
            <Select name="level" label="Your career level" opts={templates.LEVELS} cur={prefs.level} />
            <Select name="industry" label="Your field" opts={templates.INDUSTRIES} cur={prefs.industry} />
            <Select name="goal" label="Your goal" opts={templates.GOALS} cur={prefs.goal} />
            <button className="btn btn-primary" type="submit">Show my recommendations</button>
          </form>
        </section>

        <section id="recommended" aria-labelledby="rec-h">
          <h2 id="rec-h">Recommended for you</h2>
          <div className="sh-grid">{rec.map((id, i) => card(templates.get(id)!, i === 0 ? "Best match" : "Recommended"))}</div>
          {!yours ? <p className="muted sh-note">These previews use sample content. Score your resume in your <Link href="/passport">Skill Passport</Link> and they will show your own.</p> : null}
        </section>

        <section aria-labelledby="pop-h">
          <h2 id="pop-h">Popular right now</h2>
          <div className="sh-grid">{popular.map((id) => card(templates.get(id)!, "Popular"))}</div>
        </section>

        <section id="all" aria-labelledby="all-h">
          <div className="sh-allhead"><h2 id="all-h">All 45 formats <small>({all.length} shown)</small></h2></div>
          <nav className="sh-filters" aria-label="Filter templates">
            <a href={filterUrl({ show: "" })} aria-current={fShow === "" ? "true" : undefined}>All</a>
            <a href={filterUrl({ show: "free" })} aria-current={fShow === "free" ? "true" : undefined}>Free (8)</a>
            <a href={filterUrl({ show: "locked" })} aria-current={fShow === "locked" ? "true" : undefined}>Pro (37)</a>
            <a href={filterUrl({ ats: fAts === "safe" ? "" : "safe" })} aria-current={fAts === "safe" ? "true" : undefined}>ATS-friendly only</a>
            <form method="get" action="/studio#all" className="sh-selects">
              <label className="sr-only" htmlFor="f-format">Format or region</label>
              <select id="f-format" name="format" defaultValue={fFormat} data-autosubmit>
                <option value="">Any format or region</option>
                <optgroup label="Formats">{Object.entries(templates.FORMATS).map(([k, f]) => <option key={k} value={k}>{f[0]}</option>)}</optgroup>
                <optgroup label="Regions">{Object.entries(templates.REGIONS).map(([k, f]) => <option key={k} value={k}>{f[0]}</option>)}</optgroup>
              </select>
              <label className="sr-only" htmlFor="f-style">Style</label>
              <select id="f-style" name="style" defaultValue={fStyle} data-autosubmit>
                <option value="">Any style</option>
                {Object.entries(templates.STYLES).map(([k, s]) => <option key={k} value={k}>{s[0]}</option>)}
              </select>
              {fAts ? <input type="hidden" name="ats" value={fAts} /> : null}
              {fShow ? <input type="hidden" name="show" value={fShow} /> : null}
              <noscript><button className="btn btn-outline btn-sm" type="submit">Apply</button></noscript>
            </form>
          </nav>
          <div className="sh-grid sh-grid-all">
            {all.map((t) => card(t))}
            {!all.length ? <p className="muted">No templates match those filters. <a href="/studio#all">Clear filters</a></p> : null}
          </div>
        </section>

        <section className="panel sh-fine" aria-labelledby="fine-h">
          <h2 id="fine-h">Good to know</h2>
          <ul>
            <li><b>Formats differ by country.</b> The US and Canada skip photos, age and marital status; Germany, the Gulf and India often include a few optional personal details. Templates only show the details that region customarily uses.</li>
            <li><b>ATS-friendly</b> means applicant-tracking systems read it reliably. Two-column and colour-band templates look sharper but can confuse strict systems, so we label them.</li>
            <li><b>Downloads:</b> PDF (use Print / Save as PDF, which keeps every language and script), Word and plain text. Exports are of your last <em>saved</em> update.</li>
          </ul>
        </section>

        <UpgradeDialog plan={plan} />
      </div>
      <StudioScripts srcs={[...(!pro && pay.enabled() ? ["https://checkout.razorpay.com/v1/checkout.js"] : []), "/studio/studio.js?v=1"]} />
    </PortalPage>
  );
}
