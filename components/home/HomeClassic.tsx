import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import FoundationSection from "@/components/home/FoundationSection";
import Squad from "@/components/home/Squad";
import CareerEngineSectionV2 from "@/components/home/CareerEngineSectionV2";
import PersonalizedRoadmaps from "@/components/home/PersonalizedRoadmaps";
import GlobalNetwork from "@/components/home/GlobalNetwork";
import { TechEngine } from "@/components/home/TechEngine";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/home/Pricing";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";
import Footer from "@/components/layout/Footer";
import PartnerStrip from "@/components/home/PartnerStrip";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";

/**
 * Home page composition — locked section order:
 *   1.  Hero               — GrowQR hero with Individual/Enterprise toggle
 *                            (drives the agent set + plans below via the global
 *                            HomeMode context, provided in app/layout.tsx)
 *   2.  Foundation         — "Your Journey / Our Intelligence" + the 3D pyramid
 *   3.  Career Engine       — AI Career Report flow (job-seeker mode only)
 *   4.  Personalized Roadmaps — goal selector → 30/60/90 action plan card
 *   5.  Meet the Squad      — agent rail
 *   6.  Global Network      — 24/7 AI + 
 * 
 *   7.  How It Works        — framed Canva walkthrough film (16:9)
 *   8.  Pricing             — job-seeker plans + comparison table
 *   9.  Tech Stack          — 6 capabilities
 *   10. Partner strip       — social proof
 *   11. FAQ                 — common questions before the close
 *   12. Final CTA           — close
 */
export default function HomeClassic() {
  return (
    <>
      <Navbar />
      {/* One shared enquiry modal for every "Book a Call" CTA on this page
          (Hero + FinalCTA), so Business-mode visitors always land in the
          same modal instance regardless of which CTA they click. */}
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
          <PersonalizedRoadmaps />
          <Squad />
          <GlobalNetwork />
          <HowItWorks
            introLogoSrc="/sublogos/qryze-indivisuals.jpeg"
            cornerLogoSrc="/sublogos/qryze-indivisuals.jpeg"
            introWords={[]}
            introDurationMs={1200}
            logoOnlyIntro
          />
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
