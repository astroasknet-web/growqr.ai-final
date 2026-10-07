"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Eyebrow } from "@/components/home/SectionHeader";
import {
  EnterpriseContactProvider,
  useEnterpriseContact,
} from "@/components/enterprise/EnterpriseContactModal";
import { SolutionSquad, B2B_AGENT_LINKS } from "@/components/pages/solutions/journeyKit";
import RecruiterJourney from "@/components/pages/recruiters/RecruiterJourney";
import {
  HowItWorks,
  CallCTA,
  RelatedPersonas,
} from "@/components/pages/PersonaPage";
import { recruitersContent } from "@/lib/persona-content";
import RecruiterWorkspaceDemo from "@/components/pages/recruiters/RecruiterWorkspaceDemo";
import { trackAppCta } from "@/lib/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Recruiters solution page — mirrors the Startups/Enterprises page structure:
 * a hero, the agent journey, the "Your AI Team" rail, then the shared persona
 * sections. Every CTA opens the shared enterprise contact popup as a general
 * enquiry attributed to the Recruiters solution, not a single agent.
 */
export default function RecruitersSolutionPage() {
  return (
    <EnterpriseContactProvider
      solution={{ label: "Recruiters", heading: "Bring Your AI Team to Your Agency" }}
    >
      <Navbar />
      <main>
        <Hero />
        <RecruiterJourney />
        <SolutionSquad
          eyebrow="Meet the Squad"
          heading={
            <>
              Your <span className="text-orange">AI Team</span> for Recruiters
            </>
          }
          subheading="One specialist for every key move."
          agentNames={["RQ-Scout", "RQ-Vera", "RQ-Rita", "RQ-Nova", "RQ-Rohan"]}
          linkOverrides={B2B_AGENT_LINKS}
        />
        <RecruiterWorkspaceDemo />
        <HowItWorks content={recruitersContent} />
        <CallCTA content={recruitersContent} />
        <RelatedPersonas content={recruitersContent} />
      </main>
      <Footer />
    </EnterpriseContactProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */
function Hero() {
  const contact = useEnterpriseContact();

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
            For Recruiters
          </Eyebrow>

          <h1 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.04em] text-[#1a1a1a] md:mt-5 md:text-[48px] md:tracking-[-0.05em] xl:text-[58px]">
            The Team Behind
            <br />
            Every Great <span className="text-orange">Hire</span>.
          </h1>

          <p className="mt-4 max-w-[520px] text-[15px] leading-[1.65] text-ink-3 md:mt-5 md:text-[17px]">
            AI experts helping recruitment agencies source, place, and grow with confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-9 lg:justify-start">
            <button
              type="button"
              onClick={() => {
                trackAppCta({ ctaLabel: "Book a Call", ctaLocation: "recruiters-hero", ctaAction: "modal" });
                contact.openContact();
              }}
              className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
            >
              Book a Call
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[13px] text-white transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
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
            src="/solutions/recruiter-hero.webp"
            alt="Illustration of a recruiter placing candidates with an AI team"
            width={600}
            height={545}
            priority
            className="h-auto w-full scale-110 -translate-x-8"
          />
        </motion.div>
      </div>
    </section>
  );
}
