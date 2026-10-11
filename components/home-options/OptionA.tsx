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
import { WavyBackground } from "@/components/ui/wavy-background";
import { Count, RevealRoot, Switcher, WaitlistButton } from "./shared";
import { SCORE_URL, COUNTRIES, PASSPORT, type AgentKey } from "./data";
import { AgentAvatar, PassportCard, TypeWord } from "./ui";
import HeroConsole from "./HeroConsole";
import InternshipBoard from "./InternshipBoard";
import Globe from "./Globe";

const WAVE = ["#D8BFA8", "#C7B8A9", "#D2C8BE", "#E6DED4", "#B8ADA3"];

const TRACK: { n: string; t: string; d: string; who: AgentKey }[] = [
  { n: "01", t: "Score", d: "Drop in a PDF, Word file or pasted text. A grade and three plain-language focus areas in seconds. No sign-up.", who: "mira" },
  { n: "02", t: "Coach", d: "Specialised agents fix what the score found: the resume, the skill gap, the missing certificate.", who: "sage" },
  { n: "03", t: "Verify", d: "A proctored assessment turns claims into percentiles on your Skill Passport.", who: "vera" },
  { n: "04", t: "Match", d: "Apply to verified employers. The first month's stipend sits in escrow before day one.", who: "scout" },
  { n: "05", t: "Grow", d: "Courses, micro-gigs and a study-abroad map keep the score, and your options, climbing.", who: "lyra" },
];

const SECTION = "px-6 md:px-14";
const WRAP = "mx-auto max-w-[1280px]";
const KICK = "mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm";

function Head({ kick, children, sub }: { kick: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-[780px] text-center">
      <span data-rv className={KICK}><span className="h-1.5 w-1.5 rounded-full bg-orange" />{kick}</span>
      <h2 data-rv className="font-sans text-[clamp(2.1rem,4.8vw,3.7rem)] font-semibold leading-[1.06] text-ink [&_em]:not-italic [&_em]:text-orange">{children}</h2>
      {sub && <p data-rv className="mx-auto mt-4 max-w-[38em] text-[1.08rem] leading-relaxed text-ink-3">{sub}</p>}
    </div>
  );
}

export default function OptionA() {
  return (
    <RevealRoot className="overflow-x-clip bg-cream pb-24 text-ink">
      <EnterpriseContactProvider solution={{ label: "GrowQR Enterprise", heading: "Let's map out your team's rollout" }}>
        {/* HERO */}
        <header className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden>
            <WavyBackground containerClassName="w-full h-full" className="h-full w-full" colors={WAVE} waveWidth={44} blur={18} speed="slow" waveOpacity={0.32} waveYOffset={0.7} amplitude={92} backgroundFill="rgba(250,248,244,0)" />
          </div>
          <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-[0.12]" />
          <div className={`${WRAP} grid items-center gap-14 px-6 pb-20 pt-32 md:px-14 md:pb-28 md:pt-40 xl:grid-cols-[0.92fr,1.08fr]`}>
            <div>
              <p data-rv className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 py-1.5 pl-1.5 pr-4 text-[0.84rem] font-semibold shadow-sm backdrop-blur">
                <span className="rounded-full bg-orange-light px-3 py-1 text-orange-deep">New</span>
                QR Score is now part of GrowQR
              </p>
              <h1 data-rv style={{ ["--d" as string]: ".06s" }} className="font-sans text-[clamp(2.6rem,4.4vw,4.2rem)] font-extrabold leading-[1.04] text-ink">
                <span className="block">Know your</span>
                <TypeWord words={["QR Score", "skill gaps", "next offer", "worth"]} className="block text-orange" />
              </h1>
              <p data-rv style={{ ["--d" as string]: ".12s" }} className="mt-6 max-w-[30em] text-[1.14rem] leading-relaxed text-ink-3">
                Upload a resume and get a free score out of 100. Then our AI agents close the gaps, a verified Skill Passport proves the rest, and verified employers pay you to start.
              </p>
              <div data-rv style={{ ["--d" as string]: ".18s" }} className="mt-9 flex flex-wrap items-center gap-3">
                <a href={SCORE_URL} className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:scale-[1.015] hover:bg-orange-dark">
                  Score my resume, free <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </a>
                <WaitlistButton source="home-option-a-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold text-ink backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
              </div>
              <div data-rv style={{ ["--d" as string]: ".24s" }} className="mt-9 flex items-center gap-3 text-[0.9rem] text-ink-3">
                <span className="flex -space-x-2">{(["mira", "sage", "vera", "scout", "lyra"] as AgentKey[]).map((k) => <AgentAvatar key={k} k={k} size={34} ring={false} className="!shadow-[0_0_0_2px_#fff]" />)}</span>
                <span>Specialised AI agents, plus human experts in the loop</span>
              </div>
            </div>
            <div data-rv style={{ ["--d" as string]: ".14s" }}><HeroConsole /></div>
          </div>
        </header>

        {/* STATS */}
        <div className="border-y border-black/[0.06] bg-white/70 backdrop-blur">
          <dl className={`${WRAP} grid grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4 md:px-14`}>
            {[[0, "₹", "application fees, ever"], [120, "", "courses across 18 fields"], [58, "", "partner universities"], [7, "", "countries mapped"]].map(([n, p, l]) => (
              <div key={String(l)} className="text-center">
                <dt className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none text-ink"><Count to={n as number} prefix={p as string} /></dt>
                <dd className="mt-1 text-[0.92rem] text-ink-4">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* TRACK */}
        <section className={`${SECTION} py-24 md:py-32`} aria-labelledby="hoa-track">
          <div className={WRAP}>
            <Head kick="One connected system" sub="Most tools do one job. GrowQR hands you from one stage to the next, and every stage feeds the same score.">
              <span id="hoa-track">From a free score to a <em>paid internship</em></span>
            </Head>
            <ol className="relative grid gap-4 md:grid-cols-5">
              <span aria-hidden className="absolute left-[10%] right-[10%] top-[44px] hidden h-px bg-gradient-to-r from-transparent via-orange/50 to-transparent md:block" />
              {TRACK.map((s, i) => (
                <li key={s.n} data-rv style={{ ["--d" as string]: `${i * 0.07}s` }} className="group relative rounded-3xl border border-black/10 bg-white p-5 shadow-card transition hover:-translate-y-1.5 hover:shadow-glow">
                  <div className="mb-4 flex items-center justify-between">
                    <AgentAvatar k={s.who} size={48} />
                    <span className="font-serif text-[2.4rem] leading-none text-transparent [-webkit-text-stroke:1.2px_#FF6A2F]">{s.n}</span>
                  </div>
                  <h3 className="mb-1.5 text-[1.25rem] font-bold text-ink">{s.t}</h3>
                  <p className="text-[0.92rem] leading-relaxed text-ink-3">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* INTERNSHIPS */}
        <section className={`${SECTION} bg-white py-24 md:py-32`} aria-labelledby="hoa-board">
          <div className={WRAP}>
            <Head kick="Verified internships" sub="Real roles from verified employers. Stipends are protected in escrow, there are no application fees, and every stage of your application is visible.">
              <span id="hoa-board">Your score decides what <em>opens up</em></span>
            </Head>
            <div data-rv><InternshipBoard initial={72} /></div>
            <p data-rv className="mt-6 text-center text-[0.9rem] text-ink-4">Sample listings from the QR Score platform. <a className="font-semibold text-orange-dark underline underline-offset-4" href={SCORE_URL}>Browse all internships</a></p>
          </div>
        </section>

        {/* PASSPORT */}
        <section className={`${SECTION} py-24 md:py-32`} aria-labelledby="hoa-pass">
          <div className={`${WRAP} grid items-center gap-14 lg:grid-cols-2`}>
            <div className="order-2 lg:order-1">
              <span data-rv className={`${KICK} !mx-0`}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Skill Passport</span>
              <h2 data-rv id="hoa-pass" className="mb-5 font-sans text-[clamp(2.1rem,4.4vw,3.4rem)] font-semibold leading-[1.06] text-ink">A resume says it. <span className="text-orange">A passport proves it.</span></h2>
              <p data-rv className="mb-7 max-w-[34em] text-[1.08rem] leading-relaxed text-ink-3">Five sections, each backed by evidence: a verified degree, employer-confirmed experience, a proctored skills assessment, linked projects and checked impact. One QR, and anyone can verify it.</p>
              <ul className="mb-8 grid gap-3">
                {PASSPORT.map((p, i) => (
                  <li key={p.key} data-rv style={{ ["--d" as string]: `${i * 0.05}s` }} className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-light font-serif text-[1.2rem] text-orange-deep">{p.v}</span>
                    <span className="text-[0.95rem] font-semibold">{p.key}<span className="block text-[0.82rem] font-normal text-ink-4">{p.note}</span></span>
                  </li>
                ))}
              </ul>
              <a data-rv href="/passport" className="ho-btn ho-btn-ink">Start my passport</a>
            </div>
            <div data-rv className="order-1 flex flex-col items-center gap-4 lg:order-2">
              <PassportCard className="!max-w-[520px]" />
              <p className="text-[0.82rem] text-ink-4">Tap the card to flip it. Sample candidate shown.</p>
            </div>
          </div>
        </section>

        {/* STUDY ABROAD */}
        <section className={`${SECTION} bg-white py-24 md:py-32`} aria-labelledby="hoa-globe">
          <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-[0.85fr,1.15fr]`}>
            <div>
              <span data-rv className={`${KICK} !mx-0`}><span className="h-1.5 w-1.5 rounded-full bg-orange" />Study abroad</span>
              <h2 data-rv id="hoa-globe" className="mb-5 font-sans text-[clamp(2.1rem,4.4vw,3.4rem)] font-semibold leading-[1.06] text-ink">58 universities. <span className="text-orange">Seven countries.</span> One plan.</h2>
              <p data-rv className="mb-6 max-w-[32em] text-[1.08rem] leading-relaxed text-ink-3">Requirements, fit and next steps for every destination, mapped against your own profile so the question is never &ldquo;where do I even start?&rdquo;</p>
              <ul data-rv className="mb-7 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.95rem]">
                {COUNTRIES.map((c) => (<li key={c.name} className="flex items-center justify-between border-b border-black/[0.07] py-1.5"><span className="font-semibold">{c.name}</span><span className="text-orange-dark">{c.count} universities</span></li>))}
              </ul>
              <a data-rv href="/study-abroad" className="ho-btn ho-btn-ink">Explore universities</a>
            </div>
            <div data-rv><Globe /></div>
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
      <Switcher active="a" />
    </RevealRoot>
  );
}
