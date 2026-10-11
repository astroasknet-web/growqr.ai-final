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
import { Count, RevealRoot, Switcher } from "./shared";
import { COUNTRIES, SCORE_URL } from "./data";
import { PassportCard } from "./ui";
import { InternshipMarquee } from "./InternshipBoard";
import ExplodedStack from "./ExplodedStack";
import Globe from "./Globe";

const KICK = "mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";

export default function OptionF() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        <ExplodedStack />

        {/* STATS */}
        <div className="border-y border-black/[0.06] bg-white/70 backdrop-blur">
          <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4 md:px-14">
            {[[0, "₹", "application fees, ever"], [120, "", "courses across 18 fields"], [58, "", "partner universities"], [7, "", "countries mapped"]].map(([n, p, l]) => (
              <div key={String(l)} className="text-center"><dt className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none"><Count to={n as number} prefix={p as string} /></dt><dd className="mt-1 text-[0.92rem] text-ink-4">{l}</dd></div>
            ))}
          </dl>
        </div>

        {/* PASSPORT + ROLES */}
        <section className="px-6 py-24 md:px-14 md:py-32" aria-labelledby="hof-pass">
          <div className="mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-2">
            <div>
              <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Skill Passport</span>
              <h2 data-rv id="hof-pass" className="mb-5 font-sans text-[clamp(2.1rem,4.4vw,3.4rem)] font-semibold leading-[1.06]">One scan. <span className="text-orange">Every claim checked.</span></h2>
              <p data-rv className="mb-7 max-w-[34em] text-[1.08rem] leading-relaxed text-ink-3">Education, experience, skills, projects and impact, each backed by evidence. Flip the card to see what an employer sees.</p>
              <a data-rv href="/passport" className="ho-btn ho-btn-ink">Start my passport</a>
            </div>
            <div data-rv className="flex justify-center"><PassportCard className="!max-w-[520px]" /></div>
          </div>
        </section>

        <section className="pb-24 md:pb-32" aria-labelledby="hof-roles">
          <div className="mx-auto mb-12 max-w-[780px] px-6 text-center">
            <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Verified internships</span>
            <h2 data-rv id="hof-roles" className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06]">Roles that <span className="text-orange">pay, and protect you</span></h2>
          </div>
          <div data-rv><InternshipMarquee /></div>
        </section>

        {/* GLOBE (dark) */}
        <section className="relative overflow-hidden bg-[#0A0A0A] px-6 py-24 text-white md:px-14 md:py-32" aria-labelledby="hof-globe">
          <div aria-hidden className="absolute right-0 top-0 h-[460px] w-[460px] rounded-full bg-orange/25 blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.9fr,1.1fr]">
            <div>
              <h2 data-rv id="hof-globe" className="mb-5 font-sans text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.06] text-white">58 universities. <span className="text-orange">Seven countries.</span></h2>
              <ul data-rv className="mb-7 grid grid-cols-2 gap-x-6 text-[0.95rem]">{COUNTRIES.map((c) => (<li key={c.name} className="flex justify-between border-b border-white/10 py-2"><span className="font-semibold">{c.name}</span><span className="text-[#FFB380]">{c.count}</span></li>))}</ul>
              <a data-rv href="/study-abroad" className="ho-btn ho-btn-pri">Explore universities</a>
            </div>
            <div data-rv><Globe dark /></div>
          </div>
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
      <Switcher active="f" />
    </RevealRoot>
  );
}
