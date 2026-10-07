import Squad from "@/components/home/Squad";
import GlobalNetwork from "@/components/home/GlobalNetwork";
import ForceLive from "./ForceLive";
import Pricing from "@/components/home/Pricing";
import { TechEngine } from "@/components/home/TechEngine";
import PartnerStrip from "@/components/home/PartnerStrip";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Count, RevealRoot, Switcher, WaitlistButton } from "./shared";
import { COUNTRIES, SCORE_URL } from "./data";
import { AgentSpotlight, CompareSlider, LensDoc } from "./OptionEClient";
import InternshipBoard from "./InternshipBoard";
import Globe from "./Globe";

const WAVE = ["#D8BFA8", "#C7B8A9", "#D2C8BE", "#E6DED4", "#B8ADA3"];
const KICK = "mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";

export default function OptionE() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        {/* HERO */}
        <header className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden>
            <WavyBackground containerClassName="w-full h-full" className="h-full w-full" colors={WAVE} waveWidth={44} blur={18} speed="slow" waveOpacity={0.3} waveYOffset={0.75} amplitude={92} backgroundFill="rgba(250,248,244,0)" />
          </div>
          <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 pb-20 pt-32 md:px-14 md:pb-28 md:pt-40 lg:grid-cols-[0.95fr,1.05fr]">
            <div>
              <p data-rv className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 text-[0.84rem] font-semibold shadow-sm backdrop-blur"><span className="h-2 w-2 animate-pulseDot rounded-full bg-orange" />GrowQR × QR Score</p>
              <h1 data-rv style={{ ["--d" as string]: ".06s" }} className="font-sans text-[clamp(2.8rem,6.4vw,5.6rem)] font-extrabold leading-[0.98] text-ink">
                Resumes claim.<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">GrowQR proves.</span>
              </h1>
              <p data-rv style={{ ["--d" as string]: ".12s" }} className="mt-6 max-w-[30em] text-[clamp(1.05rem,1.6vw,1.22rem)] leading-relaxed text-ink-3">
                Every line on a resume is a claim. Scan it, and the verified layer underneath shows what is actually true: education checked, experience confirmed, skills proctored.
              </p>
              <div data-rv style={{ ["--d" as string]: ".18s" }} className="mt-9 flex flex-wrap gap-3">
                <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:scale-[1.015] hover:bg-orange-dark">Score my resume, free <span aria-hidden>→</span></a>
                <WaitlistButton source="home-option-e-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
              </div>
            </div>
            <div data-rv style={{ ["--d" as string]: ".14s" }} className="flex justify-center lg:justify-end"><LensDoc /></div>
          </div>
        </header>

        {/* STATS */}
        <div className="border-y border-black/[0.06] bg-white/70 backdrop-blur">
          <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4 md:px-14">
            {[[0, "₹", "application fees, ever"], [116, "", "courses across 18 fields"], [58, "", "partner universities"], [7, "", "countries mapped"]].map(([n, p, l]) => (
              <div key={String(l)} className="text-center"><dt className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none"><Count to={n as number} prefix={p as string} /></dt><dd className="mt-1 text-[0.92rem] text-ink-4">{l}</dd></div>
            ))}
          </dl>
        </div>

        {/* COMPARE */}
        <section className="px-6 py-24 md:px-14 md:py-32" aria-labelledby="hoe-cmp">
          <div className="mx-auto mb-12 max-w-[780px] text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Claim vs proof</span>
            <h2 data-rv id="hoe-cmp" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Same candidate. <span className="text-orange">Two very different pages.</span></h2>
            <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">Drag the handle. On the left, a resume. On the right, the same person with evidence an employer can check.</p>
          </div>
          <div data-rv><CompareSlider /></div>
        </section>

        {/* AGENTS */}
        <section className="bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hoe-ag">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-[780px] text-center">
              <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />The squad</span>
              <h2 data-rv id="hoe-ag" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">The agents that <span className="text-orange">earn the proof</span></h2>
              <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">Specialised AI agents work from your QR Score, with human experts in the loop.</p>
            </div>
            <div data-rv><AgentSpotlight /></div>
          </div>
        </section>

        {/* ROLES */}
        <section className="px-6 py-24 md:px-14 md:py-32" aria-labelledby="hoe-roles">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-[780px] text-center">
              <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Verified internships</span>
              <h2 data-rv id="hoe-roles" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Your score decides what <span className="text-orange">opens up</span></h2>
            </div>
            <div data-rv><InternshipBoard initial={78} /></div>
          </div>
        </section>

        {/* GLOBE */}
        <section className="bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hoe-globe">
          <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.85fr,1.15fr]">
            <div>
              <h2 data-rv id="hoe-globe" className="mb-5 font-sans text-[clamp(2.1rem,4.4vw,3.4rem)] font-semibold leading-[1.06]">58 universities. <span className="text-orange">Seven countries.</span></h2>
              <ul data-rv className="mb-7 grid grid-cols-2 gap-x-6 text-[0.95rem]">{COUNTRIES.map((c) => (<li key={c.name} className="flex justify-between border-b border-black/[0.07] py-2"><span className="font-semibold">{c.name}</span><span className="text-orange-dark">{c.count}</span></li>))}</ul>
              <a data-rv href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="ho-btn ho-btn-ink">Explore universities</a>
            </div>
            <div data-rv><Globe /></div>
          </div>
        </section>

        <Squad />
        <ForceLive><GlobalNetwork /></ForceLive>
        <Pricing />
        <TechEngine />
        <PartnerStrip />
        <FAQ />
        <FinalCTA />
      </EnterpriseContactProvider>
      <Switcher active="e" />
    </RevealRoot>
  );
}
