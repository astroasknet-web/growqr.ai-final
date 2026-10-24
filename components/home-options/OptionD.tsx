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
import { Count, RevealRoot, ScoreDemo, Switcher } from "./shared";
import { SCORE_URL } from "./data";
import { InternshipMarquee } from "./InternshipBoard";
import MorphField from "./MorphField";

const KICK = "mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";

const FEED = [
  "Node.js · Express · MySQL scored ✓",
  "Google Data Analytics certificate ✓",
  "Sample: matched to a Backend Developer Intern role ✓",
  "QR Score 85 · Strong",
  "New passport verified in 4 seconds",
  "RQ-Mira rewrote 6 bullets · +8",
  "Shortlisted by CodeForge Systems ✓",
];

export default function OptionD() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        <MorphField />

        {/* LIVE PROOF FEED */}
        <div className="overflow-hidden border-y border-white/10 bg-ink py-3.5" aria-label="Sample proof feed">
          <div className="ho-marq-track gap-10 whitespace-nowrap font-mono text-[0.84rem] text-white/80" style={{ animationDuration: "46s" }}>
            {[0, 1].map((r) => (
              <div key={r} className="flex gap-10 pr-10" aria-hidden={r === 1}>
                {FEED.map((t) => (<span key={t} className="flex items-center gap-10"><span><span className="mr-2 text-emerald-400">●</span>{t}</span><span className="text-orange">/</span></span>))}
              </div>
            ))}
          </div>
        </div>

        {/* STATS */}
        <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-6 py-14 md:grid-cols-4 md:px-14">
          {[[0, "₹", "application fees, ever"], [120, "", "courses across 18 fields"], [58, "", "partner universities"], [7, "", "countries mapped"]].map(([n, p, l]) => (
            <div key={String(l)} className="text-center"><dt className="font-sans text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-none"><Count to={n as number} prefix={p as string} /></dt><dd className="mt-1 text-[0.92rem] text-ink-4">{l}</dd></div>
          ))}
        </dl>

        {/* SCORER */}
        <section className="px-6 pb-24 md:px-14 md:pb-32" aria-labelledby="hod-demo">
          <div data-rv className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[clamp(28px,5vw,52px)] bg-ink p-7 text-white md:p-14">
            <div aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-orange/45 blur-[110px]" />
            <div aria-hidden className="absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-full bg-[#FFB020]/20 blur-[110px]" />
            <div className="relative">
              <p className="mb-3 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]">Try the scorer</p>
              <h2 id="hod-demo" className="mb-8 max-w-[16ch] font-sans text-[clamp(2.1rem,4.6vw,3.5rem)] font-semibold leading-[1.06] text-white">Move one thing. Watch the number move.</h2>
              <ScoreDemo tone="dark" />
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section className="pb-24 md:pb-32" aria-labelledby="hod-roles">
          <div className="mx-auto mb-12 max-w-[780px] px-6 text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Verified internships</span>
            <h2 data-rv id="hod-roles" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Where a verified score <span className="text-orange">takes you</span></h2>
            <p data-rv className="mx-auto mt-4 max-w-[36em] text-[1.08rem] text-ink-3">No application fees. Employers screened before they post.</p>
          </div>
          <div data-rv><InternshipMarquee /></div>
          <p className="mt-8 text-center"><a className="font-semibold text-orange-dark underline underline-offset-4" href={SCORE_URL}>Browse all internships</a></p>
        </section>

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
      <Switcher active="d" />
    </RevealRoot>
  );
}
