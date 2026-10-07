"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Eyebrow } from "@/components/home/SectionHeader";
import { SolutionSquad } from "@/components/pages/solutions/journeyKit";
import FreelancerJourney from "@/components/pages/freelancers/FreelancerJourney";
import { HowItWorks, RelatedPersonas } from "@/components/pages/PersonaPage";
import Pricing from "@/components/home/Pricing";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";
import { freelancersContent } from "@/lib/persona-content";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Freelancers solution page — mirrors the Institutes/Recruiters/Enterprises
 * page structure: a hero, the agent journey, the "Your AI Team" rail, then
 * the shared persona sections. Self-serve, not sales-led, so it keeps
 * Pricing (not CallCTA) and links to signup.
 */
export default function FreelancersSolutionPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FreelancerJourney />
        <SolutionSquad
          eyebrow="Meet the Squad"
          heading={
            <>
              Your <span className="text-orange">AI Team</span> for Freelancers
            </>
          }
          subheading="One specialist for every key move."
          agentNames={["RQ-Nova", "RQ-Scout", "RQ-Eva", "RQ-Rohan"]}
        />
        <HowItWorks content={freelancersContent} />
        <Pricing />
        <RelatedPersonas content={freelancersContent} />
      </main>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */
function Hero() {
  const { hero } = freelancersContent;
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — swap the primary CTA to a waitlist
  // signup for USD visitors.
  const isWaitlist = !isLive;

  return (
    <section className="relative overflow-hidden bg-white px-6 pb-16 pt-28 md:px-14 md:pb-24 md:pt-36">
      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 lg:min-h-[600px] lg:grid-cols-2 lg:gap-16">
        {/* LEFT — copy + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <Eyebrow center className="lg:justify-start">
            For Freelancers
          </Eyebrow>

          <h1 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.04em] text-[#1a1a1a] md:mt-5 md:text-[48px] md:tracking-[-0.05em] xl:text-[58px]">
            Built for the{" "}
            <br className="hidden md:block" />
            <span className="text-orange">Business of One</span>.
          </h1>

          <p className="mt-4 max-w-[520px] text-[15px] leading-[1.65] text-ink-3 md:mt-5 md:text-[17px]">
            AI experts helping freelancers attract clients, deliver exceptional work, and grow with confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-9 lg:justify-start">
            {isWaitlist ? (
              <button
                type="button"
                onClick={() => {
                  trackAppCta({
                    ctaLabel: "Join the Waitlist",
                    ctaLocation: "freelancers-hero",
                    ctaAction: "waitlist",
                  });
                  openWaitlist("freelancers-hero");
                }}
                className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
              >
                Join the Waitlist
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[13px] text-white transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            ) : (
              <a
                href={hero.primaryCTA.href}
                className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
              >
                {hero.primaryCTA.label}
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[13px] text-white transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            )}
          </div>
        </motion.div>

        {/* RIGHT — hero illustration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease }}
          className="relative mx-auto w-full max-w-[460px] lg:max-w-[620px]"
        >
          <Image
            src="/solutions/freelancer-hero.png"
            alt="Illustration of a freelancer growing their business with an AI team"
            width={600}
            height={545}
            priority
            className="h-auto w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
