import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { TheoSignals, TheoPatterns, TheoPrioritize, TheoAct } from "./TheoSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Theo"] ?? "Predict Attrition Risk";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Theo different from ChatGPT?",
    a: "ChatGPT provides general advice. RQ-Theo is built to interpret workforce signals, identify attrition risks, and help HR act before valuable employees leave.",
  },
  {
    q: "What signals does RQ-Theo use to predict attrition?",
    a: "RQ-Theo can work with signals like engagement, performance, attendance, workload, role changes, feedback patterns, and manager inputs. The goal is not to judge employees, but to highlight early risk patterns that deserve attention.",
  },
  {
    q: "Can RQ-Theo tell us exactly who will resign?",
    a: "No system can guarantee that. RQ-Theo helps you identify probability and risk signals early, so HR can intervene thoughtfully before disengagement becomes a resignation.",
  },
  {
    q: "How does RQ-Theo help HR teams take action?",
    a: "RQ-Theo prioritizes risk, explains the likely drivers, and suggests practical next steps. This helps HR and managers move from reactive firefighting to proactive retention.",
  },
];

export default function TheoPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Theo">
      <AgentHero
        agentName="RQ-Theo"
        role="The Attrition Predictor"
        avatar="/agents/11.png"
        heading={
          <>
            See Attrition Coming
            <br />
            <span className="text-orange">Before It Happens.</span>
          </>
        }
        sub="Spot early risk signals. Act before your best people leave."
        benefits={["Early Attrition Signals", "Proactive Retention Insights"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/theo-hero.webp"
        heroAlt="RQ-Theo surfacing early attrition risk signals across a workforce to help HR retain employees before they leave"
        bareImage
        imageClassName="h-auto w-full scale-[1.08] -translate-x-6 lg:-translate-x-10"
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="Track workforce signals. Identify risk early. Take action before resignation becomes the only conversation."
      />

      <TheoSignals />
      <TheoPatterns />
      <TheoPrioritize />
      <TheoAct />

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
            Retain Talent Before
            <br />
            <span className="text-orange">It Walks Away.</span>
          </>
        }
        subtitle="Turn workforce signals into timely retention action."
        ctaLabel="Start Predicting Risk"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
