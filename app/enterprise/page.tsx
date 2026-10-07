import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import FoundationSection from "@/components/home/FoundationSection";
import Squad from "@/components/home/Squad";
import CareerEngineSectionV2 from "@/components/home/CareerEngineSectionV2";
import PersonalizedRoadmaps from "@/components/home/PersonalizedRoadmaps";
import GlobalNetwork from "@/components/home/GlobalNetwork";
import { TechEngine } from "@/components/home/TechEngine";
import Pricing from "@/components/home/Pricing";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";
import Footer from "@/components/layout/Footer";
import PartnerStrip from "@/components/home/PartnerStrip";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";
import AIWorkforceDemo from "@/components/home/AIWorkforceDemo";

export const metadata: Metadata = {
  title: "GrowQR for Enterprise: Your AI Workforce Platform",
  description:
    "Retention, hiring, onboarding, and workforce analytics powered by specialised AI agents. See attrition coming, hire with rigor, and grow your best people.",
  alternates: { canonical: canonicalUrl("/enterprise") },
  openGraph: {
    title: "GrowQR for Enterprise",
    description:
      "Your AI workforce platform for hiring, retention, onboarding, and workforce analytics.",
    url: canonicalUrl("/enterprise"),
    images: [OG_IMAGE],
  },
};

/**
 * /enterprise — the home page for Enterprise (Business) mode.
 *
 * A standalone composition (NOT a re-export of `/`) so the enterprise view can
 * diverge freely — different sections, order, and copy — without affecting the
 * individual home page. The HomeMode provider pins `mode: "enterprise"` on this
 * route, so every mode-aware section renders its enterprise variant, and the
 * home toggle navigates between `/` and `/enterprise`.
 *
 * Starts as a mirror of the individual home order; edit this file directly as
 * the enterprise page evolves.
 */
export default function EnterpriseHome() {
  return (
    <>
      <Navbar />
      {/* One shared enquiry modal for every "Book a Call" CTA on this page
          (Hero + FinalCTA), so visitors always land in the same modal
          instance regardless of which CTA they click. */}
      <EnterpriseContactProvider
        solution={{
          label: "GrowQR Enterprise",
          heading: "Let's map out your team's rollout",
        }}
      >
        <main id="main-content" className="relative">
          <Hero />
          <FoundationSection />
          <CareerEngineSectionV2 />
          <AIWorkforceDemo />
          <PersonalizedRoadmaps />
          <Squad />
          <GlobalNetwork />
          <Pricing />
          <TechEngine />
          <PartnerStrip />
          <FAQ />
          <FinalCTA />
        </main>
      </EnterpriseContactProvider>
      <Footer />
    </>
  );
}
