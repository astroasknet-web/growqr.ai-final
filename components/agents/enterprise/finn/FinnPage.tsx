import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { FinnPrep, FinnJourney, FinnSupport, FinnMeasure } from "./FinnSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Finn"] ?? "Start Onboarding";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Finn different from ChatGPT?",
    a: "ChatGPT provides general onboarding advice. RQ-Finn manages structured onboarding journeys, tracks progress, personalises experiences, and helps every new hire become productive faster.",
  },
  {
    q: "Can RQ-Finn personalise onboarding for different roles?",
    a: "Yes. RQ-Finn adapts onboarding journeys based on role, department, location, and business needs.",
  },
  {
    q: "Can managers track onboarding progress?",
    a: "Absolutely. Managers can monitor milestones, completion rates, and employee readiness in one place.",
  },
  {
    q: "Does RQ-Finn replace HR?",
    a: "No. RQ-Finn automates coordination while HR focuses on creating meaningful employee experiences.",
  },
];

export default function FinnPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Finn">
      <AgentHero
        agentName="RQ-Finn"
        role="The Onboarding Co-pilot"
        avatar="/agents/finn.png"
        heading={
          <>
            Welcome Every New Hire.
            <br />
            <span className="text-orange">Set Them Up for Success.</span>
          </>
        }
        sub="Guide every employee through a structured onboarding journey from day one."
        benefits={["Personalised Onboarding", "Faster Time-to-Productivity"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/finn-hero.webp"
        heroAlt="RQ-Finn guiding a new hire through a structured onboarding journey from day one to productivity"
        bareImage
        imageClassName="h-auto w-full scale-[1.08] -translate-x-6 lg:-translate-x-10"
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From joining formalities to confident productivity in four guided steps."
      />

      <FinnPrep />
      <FinnJourney />
      <FinnSupport />
      <FinnMeasure />

      <FAQ
        heading={
          <>
            Have More <span className="text-orange">Questions?</span>
          </>
        }
        items={FAQS}
      />

      <FinalCTA
        heading={
          <>
            Every New Hire,
            <br />
            <span className="text-orange">Set Up to Succeed.</span>
          </>
        }
        subtitle="Help every new hire feel confident, connected, and productive from the start."
        ctaLabel="Transform Onboarding"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
