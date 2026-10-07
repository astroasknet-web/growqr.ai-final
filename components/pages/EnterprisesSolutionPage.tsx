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
import EnterpriseJourney from "@/components/pages/enterprises/EnterpriseJourney";
import {
  HowItWorks,
  CallCTA,
  RelatedPersonas,
} from "@/components/pages/PersonaPage";
import { enterprisesContent } from "@/lib/persona-content";
import AIWorkforceDemo from "@/components/home/AIWorkforceDemo";
import { trackAppCta } from "@/lib/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Enterprises solution page — mirrors the Startups page structure: a hero, the
 * agent journey, the "Your AI Team" rail, then the shared persona sections.
 * Every CTA opens the shared enterprise contact popup as a general enquiry
 * attributed to the Enterprises solution, not a single agent.
 */
export default function EnterprisesSolutionPage() {
  return (
    <EnterpriseContactProvider
      solution={{ label: "Enterprises", heading: "Bring Your AI Team to Your Business" }}
    >
      <Navbar />
      <main>
        <Hero />
        <EnterpriseJourney />
        <SolutionSquad
          eyebrow="Meet the Squad"
          heading={
            <>
              Your <span className="text-orange">AI Team</span> for Enterprises
            </>
          }
          subheading="One specialist for every part of your business."
          agentNames={["RQ-Rita", "RQ-Rohan", "RQ-Nova", "RQ-Eva"]}
          linkOverrides={B2B_AGENT_LINKS}
        />
        <AIWorkforceDemo />
        <HowItWorks content={enterprisesContent} />
        <CallCTA content={enterprisesContent} />
        <RelatedPersonas content={enterprisesContent} />
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
            For Enterprises
          </Eyebrow>

          <h1 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.04em] text-[#1a1a1a] md:mt-5 md:text-[48px] md:tracking-[-0.05em] xl:text-[58px]">
            One AI Team for
            <br />
            <span className="text-orange">Your Whole Business</span>.
          </h1>

          <p className="mt-4 max-w-[520px] text-[15px] leading-[1.65] text-ink-3 md:mt-5 md:text-[17px]">
            Built to help you hire, grow, and decide.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-9 lg:justify-start">
            <button
              type="button"
              onClick={() => {
                trackAppCta({ ctaLabel: "Book a Call", ctaLocation: "enterprises-hero", ctaAction: "modal" });
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
            src="/solutions/enterprise-hero.webp"
            alt="Illustration of an enterprise running on an AI team"
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
