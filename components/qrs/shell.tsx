/* eslint-disable @next/next/no-html-link-for-pages -- the old site navigated with plain links (full page loads); its scripts and styles rely on that */
import type { ReactNode } from "react";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import { LogoutButton } from "@/components/portal/forms";
import * as courses from "@/lib/market/courses";
import { Icon } from "./icon";
import { QrsBehavior } from "./behavior";

/**
 * The original qrscore site chrome: header with the Courses / Study Abroad mega-menu, and the footer. Markup and class names are the PHP
 * site's own, and its stylesheets are loaded from public/qrscore (scoped under `.qrs`, see scripts/qrs-css.mjs).
 */
export const NAV_COUNTRIES: Record<string, string> = { usa: "USA", uk: "UK", canada: "Canada", germany: "Germany", australia: "Australia", france: "France", uae: "UAE" };
const go = (path: string, campaign: string) => `/go?c=${encodeURIComponent(campaign)}&p=${encodeURIComponent(path)}`;
export const mathstudy = go;

export function QrsStyles({ home = false }: { home?: boolean }) {
  const css = ["home", "app", "nav", "ebooks", ...(home ? ["abroad"] : []), "shell"];
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" precedence="qrs-font" />
      {css.map((f) => <link key={f} rel="stylesheet" href={`/qrscore/${f}.css?v=1`} precedence="qrs" />)}
    </>
  );
}

async function megaData() {
  const d = { courses: [] as courses.Course[], cats: [] as Array<{ key: string; name: string; n: number }>, total: 0 };
  if (!databaseConfigured()) return d;
  try {
    d.courses = (await courses.featured(8)).slice(0, 8);
    d.cats = (await courses.categories()).sort((a, b) => b.n - a.n).slice(0, 8);
    d.total = await courses.total();
  } catch {
    /* keep the menu usable with whatever we have */
  }
  return d;
}

async function viewer() {
  if (!databaseConfigured()) return null;
  try {
    return (await getSession())?.user ?? null;
  } catch {
    return null;
  }
}

export async function QrsHeader({ active = "" }: { active?: string }) {
  const [me, m] = await Promise.all([viewer(), megaData()]);
  const cur = (k: string) => (active === k ? { "aria-current": "page" as const } : {});
  return (
    <header className="nav" id="nav">
      <div className="wrap nav-in">
        <a className="logo" href="/" aria-label="GrowQR Internships home"><span className="logo-mark" aria-hidden="true">Q</span><span className="logo-text">Grow<b>QR</b></span></a>
        <nav className="menu" id="menu" aria-label="Primary">
          <a href="/internships" {...cur("internships")}>Internships</a>
          <div className={`has-mega${active === "courses" ? " is-current" : ""}`}>
            <button className="mega-btn" type="button" aria-expanded="false" aria-controls="mega-courses">Courses <Icon n="chev" /></button>
            <div className="mega" id="mega-courses" role="region" aria-label="Courses and study abroad">
              <div className="mega-col">
                <h2>Certification courses</h2>
                <ul>{m.courses.map((c) => <li key={c.slug}><a href={`/courses/${c.slug}`}>{c.title}</a></li>)}</ul>
                <a className="mega-all" href="/courses">View {m.total ? `all ${m.total}` : "all"} courses <Icon n="arrow" /></a>
              </div>
              <div className="mega-col">
                <h2>Career paths <span className="mega-tag">Get hired faster</span></h2>
                <ul>{courses.PATHS.map((p) => <li key={p.key}><a href="/courses#paths">{p.title}</a></li>)}</ul>
              </div>
              <div className="mega-col">
                <h2>Browse by field</h2>
                <ul>{m.cats.map((c) => <li key={c.key}><a href={`/courses?cat=${c.key}#all`}>{c.name}</a></li>)}</ul>
                <a className="mega-all" href="/courses#fields">All fields <Icon n="arrow" /></a>
              </div>
              <div className="mega-col mega-abroad">
                <h2><a href="/study-abroad">Study Abroad</a></h2>
                <ul>{Object.entries(NAV_COUNTRIES).map(([k, name]) => <li key={k}><a href={`/study-abroad/${k}`}>{name}</a></li>)}</ul>
                <a className="mega-all" href="/study-abroad">View all <Icon n="arrow" /></a>
              </div>
            </div>
          </div>
          <a href="/study-abroad" {...cur("abroad")}>Study Abroad <span className="nav-new">New</span></a>
          <a className="nav-ext" href={go("/shop", "nav")} target="_blank" rel="noopener noreferrer">E-books<span className="sr-only"> (opens MathStudy.in in a new tab)</span></a>
          <a href="/passport" {...cur("passport")}>Skill Passport</a>
          <a href="/#employers" {...cur("employers")}>For employers</a>
          <div className="menu-cta">
            {me ? (
              <>
                <a className="btn btn-primary" href="/account">Dashboard</a>
                <LogoutButton className="btn btn-ghost" />
              </>
            ) : (
              <>
                <a className="btn btn-ghost" href="/login">Log in</a>
                <a className="btn btn-primary" href="/signup">Sign up free</a>
              </>
            )}
          </div>
        </nav>
        <button className="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><Icon n="menu" /></button>
      </div>
    </header>
  );
}

export function QrsFooter({ home = false }: { home?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <a className="logo logo-l" href="/"><span className="logo-mark" aria-hidden="true">Q</span><span className="logo-text">Grow<b>QR</b></span></a>
          <p>Verified, paid internships with transparent hiring.</p>
        </div>
        <nav aria-label="Students"><h2>Students</h2>
          <a href="/internships">Browse internships</a>{!home ? <a href="/courses">Courses</a> : null}{!home ? <a href="/study-abroad">Study abroad</a> : null}
          <a href={go("/shop", "footer")} target="_blank" rel="noopener noreferrer">E-books (MathStudy.in)</a><a href="/resume-score">Free resume score</a>
          {home ? <a href="/#gigs">Micro-gigs</a> : null}<a href="/passport">Skill Passport</a>{!home ? <a href="/account">Student dashboard</a> : null}
        </nav>
        <nav aria-label="Employers"><h2>Employers</h2><a href="/employer/post">Post a role</a>{!home ? <a href="/employer">Employer dashboard</a> : null}<a href="/#employers">Pricing</a>{home ? <a href="/#how">How it works</a> : null}</nav>
        <nav aria-label="Company"><h2>Company</h2><a href="/#colleges">For colleges</a><a href="/#faq">FAQ</a><a href={go("/", "footer")} target="_blank" rel="noopener noreferrer">MathStudy.in</a><a href="/login">Log in</a></nav>
      </div>
      <div className="wrap foot-base"><span>&copy; {year} GrowQR. All rights reserved.</span>{home ? <span><a href="/privacy-policy">Privacy</a> &middot; <a href="/refund-policy">Terms</a></span> : <span>GrowQR Internships</span>}</div>
    </footer>
  );
}

/** Wraps a page whose body is built another way (Tailwind): old header on top, old footer below, the page itself untouched in between. */
export async function QrsChrome({ active = "", children }: { active?: string; children: ReactNode }) {
  return (
    <>
      <QrsStyles />
      <a className="qrs-skip" href="#main">Skip to content</a>
      <div className="qrs qrs-c"><QrsHeader active={active} /></div>
      {children}
      <div className="qrs qrs-c"><QrsFooter /></div>
      <QrsBehavior />
    </>
  );
}
