import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, PlayCircle, Radio, Route as RouteIcon } from "lucide-react";
import Globe from "@/components/home-options/Globe";
import InternshipBoard from "@/components/home-options/InternshipBoard";
import { COUNTRIES } from "@/components/home-options/data";
import { EBOOKS_URL, LIBRARY_TOPICS, portal } from "./data";

const WRAP = "mx-auto max-w-[1180px]";
const H2 = "text-[clamp(2rem,4.2vw,3.2rem)] font-semibold leading-[1.07] tracking-tight";

export function Abroad() {
  const total = COUNTRIES.reduce((n, c) => n + c.count, 0);
  return (
    <section id="abroad" className="hx-v-abroad scroll-mt-24 overflow-hidden bg-[var(--hx-navy)] px-6 py-24 text-white md:px-14 md:py-32" aria-labelledby="hx-abroad">
      <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-[0.9fr,1.1fr]`}>
        <div>
          <p data-rv className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--v)]">Overseas Education</p>
          <h2 data-rv id="hx-abroad" className={`${H2} text-white`}>Think Beyond Borders. <span className="hx-grad-text">Study Around the World.</span></h2>
          <p data-rv className="mt-4 max-w-[32em] text-[1.05rem] leading-relaxed text-white/70">Explore {total} universities across {COUNTRIES.length} destinations, understand requirements, and prepare your application documents.</p>
          <ul data-rv className="mt-6 grid grid-cols-2 gap-x-6 text-[0.94rem]">
            {COUNTRIES.map((c) => <li key={c.name} className="flex justify-between border-b border-white/10 py-2"><Link href={portal(`/study-abroad/${c.name.toLowerCase()}`)} className="font-semibold hover:text-[var(--v)]">{c.name}</Link><span className="text-white/55">{c.count}</span></li>)}
          </ul>
          <Link data-rv href={portal("/study-abroad")} className="hx-btn hx-btn-pri mt-8">Start My Study Abroad Journey <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <p data-rv className="mt-4 text-[0.8rem] text-white/45">Guidance only. We do not guarantee admission, scholarships or visas.</p>
        </div>
        <div data-rv><Globe dark /></div>
      </div>
    </section>
  );
}

export function Opportunities() {
  return (
    <section id="internships" className="hx-v-internships scroll-mt-24 bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-intern">
      <div className={WRAP}>
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <h2 data-rv id="hx-intern" className={`${H2} text-[var(--hx-text)]`}>Experience Today. <span className="hx-grad-text">Lead Tomorrow.</span></h2>
          <p data-rv className="mt-4 text-[1.05rem] text-[var(--hx-muted)]">Verified employers, no application fees. Slide the score to see which roles open up.</p>
        </div>
        <div data-rv><InternshipBoard initial={72} href={portal("/internships")} /></div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[0.84rem] text-[var(--hx-muted)]">Sample listings shown here. Live roles are on the internships page.</p>
          <Link href={portal("/internships")} className="hx-btn hx-btn-dark">Find Your Next Opportunity <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </div>
    </section>
  );
}

const LEARN = [
  { icon: GraduationCap, t: "Self-paced courses", d: "Structured lessons, knowledge checks and progress tracking.", href: portal("/courses"), cta: "Browse courses" },
  { icon: RouteIcon, t: "Career paths", d: "Follow a sequence of courses toward a role.", href: portal("/courses#paths"), cta: "See paths" },
  { icon: Radio, t: "Live sessions", d: "Workshops and events with experts you can join live.", href: portal("/events"), cta: "See sessions" },
  { icon: PlayCircle, t: "Practice tests", d: "IELTS and GRE practice, marked instantly.", href: portal("/practice-tests"), cta: "Practise" },
];

export function Learn() {
  return (
    <section id="learn" className="hx-v-courses scroll-mt-24 bg-[var(--hx-soft)] px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-learn">
      <div className={WRAP}>
        <div className="mb-12 max-w-[720px]">
          <h2 data-rv id="hx-learn" className={`${H2} text-[var(--hx-text)]`}>Learn Something That <span className="hx-grad-text">Changes Everything.</span></h2>
          <p data-rv className="mt-4 text-[1.05rem] text-[var(--hx-muted)]">Courses and live classes work together: learn at your pace, then ask questions live.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEARN.map((l, i) => (
            <li key={l.t} data-rv style={{ ["--d" as string]: `${i * 0.06}s` }}>
              <Link href={l.href} className="hx-tile group flex h-full flex-col p-6">
                <span className="hx-chip"><l.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-5 text-[1.1rem] font-semibold text-[var(--hx-text)]">{l.t}</h3>
                <p className="mt-1.5 flex-1 text-[0.92rem] leading-relaxed text-[var(--hx-muted)]">{l.d}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-[var(--hx-text)] group-hover:text-[var(--v)]">{l.cta} <ArrowRight className="h-4 w-4" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
        <div data-rv className="mt-8"><Link href={portal("/courses")} className="hx-btn hx-btn-dark">Explore Learning <ArrowRight className="h-4 w-4" aria-hidden /></Link></div>
      </div>
    </section>
  );
}

export function Library() {
  return (
    <section id="library" className="hx-v-ebooks scroll-mt-24 bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-lib">
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-[1fr,1fr]`}>
        <div>
          <p data-rv className="mb-3 inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#a77f10]"><BookOpen className="h-4 w-4" aria-hidden /> E-Books</p>
          <h2 data-rv id="hx-lib" className={`${H2} text-[var(--hx-text)]`}>A World of Knowledge, <span className="hx-grad-text">One Click Away.</span></h2>
          <p data-rv className="mt-4 max-w-[34em] text-[1.05rem] leading-relaxed text-[var(--hx-muted)]">Study guides and learning resources from MathStudy. Browsing, purchases and downloads happen on mathstudy.in.</p>
          <a data-rv href={EBOOKS_URL} target="_blank" rel="noopener noreferrer" className="hx-btn hx-btn-dark mt-8">Explore the Library <ArrowRight className="h-4 w-4" aria-hidden /></a>
        </div>
        <ul className="grid grid-cols-2 gap-3" aria-label="Library topics">
          {LIBRARY_TOPICS.map((t, i) => (
            <li key={t} data-rv style={{ ["--d" as string]: `${i * 0.06}s` }}>
              <a href={EBOOKS_URL} target="_blank" rel="noopener noreferrer" className="hx-tile group flex h-full min-h-[140px] flex-col justify-end p-5">
                <span aria-hidden className="absolute right-5 top-5 h-14 w-10 rounded-sm bg-gradient-to-b from-[var(--v)] to-[var(--v2)] shadow-md" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 6}deg)` }} />
                <span className="text-[1rem] font-semibold text-[var(--hx-text)]">{t}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", t: "Discover", d: "Find the services that match your goals." },
  { n: "02", t: "Learn", d: "Build skills through courses, classes and resources." },
  { n: "03", t: "Advance", d: "Move on to internships, stronger applications and global education." },
];

export function HowItWorks3() {
  return (
    <section className="bg-[var(--hx-soft)] px-6 py-24 md:px-14 md:py-28" aria-labelledby="hx-how">
      <div className={WRAP}>
        <h2 data-rv id="hx-how" className={`${H2} mb-12 text-center text-[var(--hx-text)]`}>Discover <span className="hx-grad-text">→ Learn → Advance</span></h2>
        <ol className="relative grid gap-4 md:grid-cols-3">
          <span aria-hidden className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-[var(--hx-violet)] to-[var(--hx-cyan)] md:block" />
          {STEPS.map((s, i) => (
            <li key={s.n} data-rv style={{ ["--d" as string]: `${i * 0.08}s` }} className="relative rounded-3xl border border-slate-200 bg-white p-7">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--hx-navy)] text-[0.95rem] font-semibold text-white">{s.n}</span>
              <h3 className="text-[1.25rem] font-semibold text-[var(--hx-text)]">{s.t}</h3>
              <p className="mt-1.5 text-[0.95rem] text-[var(--hx-muted)]">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Trust({ templateCount }: { templateCount: number }) {
  const unis = COUNTRIES.reduce((n, c) => n + c.count, 0);
  const facts: [string, string][] = [
    [String(COUNTRIES.length), "study destinations"],
    [String(unis), "universities listed"],
    [String(templateCount), "resume template options"],
    ["0", "application fees on internships"],
  ];
  return (
    <section className="bg-[var(--hx-navy)] px-6 py-16 text-white md:px-14" aria-label="GrowQR in numbers">
      <dl className={`${WRAP} grid grid-cols-2 gap-8 md:grid-cols-4`}>
        {facts.map(([n, l]) => (
          <div key={l} data-rv className="text-center">
            <dt className="hx-grad-text text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-none">{n}</dt>
            <dd className="mt-2 text-[0.9rem] text-white/60">{l}</dd>
          </div>
        ))}
      </dl>
      {/* Learner counts and testimonials are left out until real, permissioned data exists. */}
    </section>
  );
}

export function FinalCTA3() {
  return (
    <section className="hx-hero relative isolate overflow-hidden px-6 py-28 text-center text-white md:px-14 md:py-36" aria-labelledby="hx-final">
      <div className="relative z-10 mx-auto max-w-[760px]">
        <CalendarDays className="mx-auto mb-6 h-8 w-8 text-[var(--hx-cyan)]" aria-hidden />
        <h2 data-rv id="hx-final" className="text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.05] text-white">Your Next Chapter <span className="hx-grad-text">Starts Here.</span></h2>
        <p data-rv className="mx-auto mt-5 max-w-[34em] text-[1.08rem] leading-relaxed text-white/75">Whether you&rsquo;re building skills, preparing for your career, or planning an international education journey, take the first step today.</p>
        <div data-rv className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="https://app.growqr.ai/signup" className="hx-btn hx-btn-pri">Get Started <ArrowRight className="h-4 w-4" aria-hidden /></a>
          <a href="#pillars" className="hx-btn hx-btn-ghost">Explore the Platform</a>
        </div>
      </div>
    </section>
  );
}
