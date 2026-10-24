import FoundationSection from "@/components/home/FoundationSection";
import PersonalizedRoadmaps from "@/components/home/PersonalizedRoadmaps";
import Squad from "@/components/home/Squad";
import GlobalNetwork from "@/components/home/GlobalNetwork";
import ForceLive from "./ForceLive";
import Pricing from "@/components/home/Pricing";
import { TechEngine } from "@/components/home/TechEngine";
import PartnerStrip from "@/components/home/PartnerStrip";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { Count, RevealRoot, Switcher, WaitlistButton } from "./shared";
import { COUNTRIES, SCORE_URL } from "./data";
import { PassportCard } from "./ui";
import { InternshipMarquee } from "./InternshipBoard";
import { AgentOrbit, PassportBuilder, ScanPhone } from "./OptionBClient";
import Globe from "./Globe";

const KICK = "mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";
const KICK_D = "mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]";

export default function OptionB() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        {/* HERO */}
        <header className="relative isolate overflow-hidden px-6 pb-10 pt-32 text-center md:px-14 md:pt-40">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_62%,rgba(255,106,47,0.2),transparent_65%),linear-gradient(180deg,#FAFAF8,#FFF5EE)]" />
          <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-[0.1]" />
          <p data-rv className={KICK}><span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-orange" />Proof of skill, powered by QR Score</p>
          <h1 data-rv style={{ ["--d" as string]: ".06s" }} className="mx-auto max-w-[14ch] font-sans text-[clamp(3rem,8vw,6.8rem)] font-extrabold leading-[0.98] text-ink">
            One QR.<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">Every proof.</span>
          </h1>
          <p data-rv style={{ ["--d" as string]: ".12s" }} className="mx-auto mt-6 max-w-[36em] text-[clamp(1.08rem,1.8vw,1.28rem)] leading-relaxed text-ink-3">
            Resumes are claims. GrowQR turns them into a scored, proctored Skill Passport that any employer can verify in one scan, then matches you to verified, paid internships.
          </p>
          <div data-rv style={{ ["--d" as string]: ".18s" }} className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={SCORE_URL} className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:scale-[1.015] hover:bg-orange-dark">Score my resume, free <span aria-hidden>→</span></a>
            <WaitlistButton source="home-option-b-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
          </div>
          <div data-rv style={{ ["--d" as string]: ".2s" }} className="mx-auto mt-12 max-w-[820px]">
            <AgentOrbit><PassportCard autoFlip /></AgentOrbit>
          </div>
        </header>

        {/* STATS */}
        <div className="border-y border-black/[0.06] bg-white/70 backdrop-blur">
          <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4 md:px-14">
            {[[0, "₹", "application fees, ever"], [120, "", "courses across 18 fields"], [58, "", "partner universities"], [7, "", "countries mapped"]].map(([n, p, l]) => (
              <div key={String(l)} className="text-center"><dt className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none"><Count to={n as number} prefix={p as string} /></dt><dd className="mt-1 text-[0.92rem] text-ink-4">{l}</dd></div>
            ))}
          </dl>
        </div>

        {/* PASSPORT BUILDER */}
        <section className="px-6 py-24 md:px-14 md:py-32" aria-labelledby="hob-build">
          <div className="mx-auto mb-14 max-w-[780px] text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Skill Passport</span>
            <h2 data-rv id="hob-build" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Watch a passport <span className="text-orange">build itself</span></h2>
            <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">Five sections. Each one backed by evidence an employer can check. Scroll to see how.</p>
          </div>
          <PassportBuilder />
        </section>

        {/* EMPLOYER SCAN */}
        <section className="relative overflow-hidden bg-ink px-6 py-24 text-white md:px-14 md:py-32" aria-labelledby="hob-scan">
          <div aria-hidden className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-orange/30 blur-[110px]" />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <span data-rv className={KICK_D}>For employers</span>
              <h2 data-rv id="hob-scan" className="mb-5 font-sans text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.06] text-white">Scan. See the proof. <span className="text-orange">Shortlist.</span></h2>
              <p data-rv className="mb-7 max-w-[32em] text-[1.08rem] leading-relaxed text-white/70">No more guessing which resume is real. A single scan shows verified education, confirmed experience, proctored skill percentiles and checked impact.</p>
              <ul data-rv className="mb-8 grid gap-2.5 text-[1rem] text-white/80">
                {["Starter plan is free for 1 active role", "Bounty: ₹0 upfront, ₹10,000 per hire after 15 days", "Growth: ₹4,999 a month for 5 active roles"].map((t) => (<li key={t} className="flex gap-3"><span className="text-orange" aria-hidden>→</span>{t}</li>))}
              </ul>
              <a data-rv href="/employer/post" className="ho-btn ho-btn-pri">Post a role</a>
            </div>
            <div data-rv><ScanPhone /></div>
          </div>
        </section>

        {/* ROLES MARQUEE */}
        <section className="py-24 md:py-32" aria-labelledby="hob-roles">
          <div className="mx-auto mb-12 max-w-[780px] px-6 text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Verified internships</span>
            <h2 data-rv id="hob-roles" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Roles that <span className="text-orange">pay, and protect you</span></h2>
            <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">No application fees. Employers screened before they post.</p>
          </div>
          <div data-rv><InternshipMarquee /></div>
          <p className="mt-8 text-center"><a className="font-semibold text-orange-dark underline underline-offset-4" href={SCORE_URL}>Browse all internships</a></p>
        </section>

        {/* GLOBE */}
        <section className="relative overflow-hidden bg-[#0A0A0A] px-6 py-24 text-white md:px-14 md:py-32" aria-labelledby="hob-globe">
          <div aria-hidden className="absolute right-0 top-0 h-[460px] w-[460px] rounded-full bg-orange/25 blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.9fr,1.1fr]">
            <div>
              <span data-rv className={KICK_D}>Study abroad</span>
              <h2 data-rv id="hob-globe" className="mb-5 font-sans text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.06] text-white">58 universities. <span className="text-orange">Seven countries.</span></h2>
              <p data-rv className="mb-6 max-w-[32em] text-[1.08rem] leading-relaxed text-white/70">Requirements and fit for each destination, matched against your own passport.</p>
              <ul data-rv className="mb-7 grid grid-cols-2 gap-x-6 text-[0.95rem]">
                {COUNTRIES.map((c) => (<li key={c.name} className="flex justify-between border-b border-white/10 py-2"><span className="font-semibold">{c.name}</span><span className="text-[#FFB380]">{c.count}</span></li>))}
              </ul>
              <a data-rv href="/study-abroad" className="ho-btn ho-btn-pri">Explore universities</a>
            </div>
            <div data-rv><Globe dark /></div>
          </div>
        </section>

        {/* EXISTING SECTIONS, UNCHANGED */}
        {/* FROM THE LIVE SITE: the two sections selected for every option */}
        <FoundationSection />
        <PersonalizedRoadmaps />
        <Squad />
        <ForceLive><GlobalNetwork /></ForceLive>
        <Pricing />
        <TechEngine />
        <PartnerStrip />
        <FAQ />
        <FinalCTA />
      </EnterpriseContactProvider>
      <Switcher active="b" />
    </RevealRoot>
  );
}
