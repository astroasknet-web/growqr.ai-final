import Squad from "@/components/home/Squad";
import GlobalNetwork from "@/components/home/GlobalNetwork";
import ForceLive from "./ForceLive";
import Pricing from "@/components/home/Pricing";
import { TechEngine } from "@/components/home/TechEngine";
import PartnerStrip from "@/components/home/PartnerStrip";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { Count, QrArt, RevealRoot, ScoreDemo, Switcher, Tilt, WaitlistButton } from "./shared";
import { INTERNSHIPS, SCORE_URL, type AgentKey } from "./data";
import { AgentAvatar, PassportCard } from "./ui";
import { InternshipCard } from "./InternshipBoard";
import { PinnedStory } from "./OptionCClient";
import Globe from "./Globe";

const KICK = "mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";

export default function OptionC() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        {/* HERO */}
        <header className="relative isolate overflow-hidden px-6 pb-24 pt-32 md:px-14 md:pb-32 md:pt-40">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_20%,rgba(255,106,47,0.28),transparent_60%),radial-gradient(60%_50%_at_10%_90%,rgba(255,176,32,0.22),transparent_60%),linear-gradient(180deg,#FFF5EE,#FAFAF8)]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-6 -z-10 select-none font-serif text-[clamp(14rem,38vw,36rem)] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,106,47,0.22)]">85</span>
          <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1.05fr,0.95fr]">
            <div>
              <p data-rv className={KICK}><span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-orange" />GrowQR × QR Score</p>
              <h1 data-rv style={{ ["--d" as string]: ".06s" }} className="font-sans text-[clamp(3rem,7.6vw,6.4rem)] font-extrabold leading-[0.98] text-ink">
                Your career,<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">scored.</span>
              </h1>
              <p data-rv style={{ ["--d" as string]: ".12s" }} className="mt-6 max-w-[30em] text-[clamp(1.08rem,1.7vw,1.26rem)] leading-relaxed text-ink-3">
                From a free resume score to a verified Skill Passport to your first paid internship, with AI agents and human experts guiding every step.
              </p>
              <div data-rv style={{ ["--d" as string]: ".18s" }} className="mt-9 flex flex-wrap gap-3">
                <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:scale-[1.015] hover:bg-orange-dark">Score my resume, free <span aria-hidden>→</span></a>
                <WaitlistButton source="home-option-c-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
              </div>
              <dl data-rv style={{ ["--d" as string]: ".24s" }} className="mt-10 grid max-w-[460px] grid-cols-3 gap-4">
                {[["₹0", "fees for students"], ["116", "courses"], ["58", "universities"]].map(([n, l]) => (<div key={l}><dt className="font-sans text-[1.9rem] font-extrabold leading-none">{n}</dt><dd className="text-[0.84rem] text-ink-4">{l}</dd></div>))}
              </dl>
            </div>

            {/* orbit art */}
            <div data-rv style={{ ["--d" as string]: ".12s" }} className="relative mx-auto aspect-square w-full max-w-[520px]">
              <span aria-hidden className="absolute inset-[4%] animate-orbit rounded-full border border-dashed border-orange/40" />
              <span aria-hidden className="absolute inset-[16%] animate-orbit-reverse rounded-full border border-orange/25" />
              <span aria-hidden className="absolute inset-[28%] rounded-full bg-orange/10 blur-2xl" />
              {(["mira", "sage", "vera", "scout", "lyra", "kai"] as AgentKey[]).map((k, i) => {
                const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return <span key={k} className="ho-bob absolute" style={{ left: `${50 + Math.cos(a) * 46}%`, top: `${50 + Math.sin(a) * 46}%`, transform: "translate(-50%,-50%)", animationDelay: `${-i * 0.7}s` }}><AgentAvatar k={k} size={58} /></span>;
              })}
              <Tilt max={14} className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-[28px] bg-white p-3.5 shadow-[0_40px_90px_-30px_rgba(255,106,47,0.65)] ring-1 ring-black/10">
                  <QrArt seed={86} fg="#1A1A1A" />
                  <div className="mt-2.5 flex items-center justify-between px-1 text-[0.64rem] font-bold uppercase tracking-[0.14em]"><span className="text-ink-4">QR Score</span><span className="text-orange">85 / 100</span></div>
                </div>
              </Tilt>
              <span className="ho-bob absolute -right-1 top-[18%] hidden rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.78rem] font-semibold shadow-card sm:block" style={{ animationDelay: "-1s" }}>Strong match<span className="block font-normal text-ink-4">Backend Intern · ₹22,000/mo</span></span>
              <span className="ho-bob absolute -left-2 bottom-[16%] hidden rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.78rem] font-semibold shadow-card sm:block" style={{ animationDelay: "-3s" }}>🛡 Escrow protected<span className="block font-normal text-ink-4">First month held safe</span></span>
            </div>
          </div>
        </header>

        {/* PINNED STORY */}
        <section className="px-6 py-20 md:px-14 md:py-28" aria-labelledby="hoc-story">
          <div className="mx-auto mb-16 max-w-[780px] text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />The route</span>
            <h2 data-rv id="hoc-story" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">One path from <span className="text-orange">resume to offer</span></h2>
            <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">Scroll through a real journey. Every screen is something you can use today.</p>
          </div>
          <PinnedStory />
        </section>

        {/* BENTO */}
        <section className="bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hoc-bento">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-[780px] text-center">
              <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Everything in one place</span>
              <h2 data-rv id="hoc-bento" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Built for the <span className="text-orange">whole journey</span></h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-6">
              <div data-rv className="rounded-[32px] border border-black/10 bg-cream p-6 md:p-10 lg:col-span-4"><ScoreDemo /></div>
              <div data-rv style={{ ["--d" as string]: ".08s" }} className="flex flex-col items-center justify-center gap-4 rounded-[32px] bg-ink p-6 text-white lg:col-span-2">
                <p className="self-start text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]">Skill Passport</p>
                <PassportCard />
                <p className="text-center text-[0.84rem] text-white/60">Tap to flip. One scan verifies everything.</p>
              </div>
              <div data-rv className="rounded-[32px] border border-black/10 bg-cream p-6 lg:col-span-3">
                <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-orange-dark">Verified internships</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {INTERNSHIPS.slice(0, 2).map((it) => (<InternshipCard key={it.id} it={it} score={100} />))}
                </div>
                <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-orange-dark shadow-[inset_0_-2px_#FF6A2F]">Browse all internships</a>
              </div>
              <div data-rv style={{ ["--d" as string]: ".08s" }} className="rounded-[32px] border border-black/10 bg-gradient-to-br from-orange-lighter to-white p-6 lg:col-span-3">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-orange-dark">Study abroad</p>
                <p className="font-serif text-[2rem] leading-tight"><Count to={58} /> universities, <Count to={7} /> countries</p>
                <Globe className="mx-auto max-w-[360px]" />
              </div>
            </div>
          </div>
        </section>

        {/* EXISTING SECTIONS, UNCHANGED */}
        <Squad />
        <ForceLive><GlobalNetwork /></ForceLive>
        <Pricing />
        <TechEngine />
        <PartnerStrip />
        <FAQ />
        <FinalCTA />
      </EnterpriseContactProvider>
      <Switcher active="c" />
    </RevealRoot>
  );
}
