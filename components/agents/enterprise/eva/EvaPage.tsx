import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { EvaMap, EvaGaps, EvaPaths, EvaProgress } from "./EvaSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Eva"] ?? "Build Capabilities";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Eva different from ChatGPT?",
    a: "ChatGPT can suggest general learning ideas. RQ-Eva is built to identify team-level skill gaps, connect them to role expectations, and recommend targeted learning paths that improve measurable capability.",
  },
  {
    q: "How does RQ-Eva identify skill gaps?",
    a: "RQ-Eva compares current skills, role requirements, performance signals, and business priorities. This helps HR and managers focus development on the gaps that matter most.",
  },
  {
    q: "Can RQ-Eva create learning paths for different teams?",
    a: "Yes. RQ-Eva can recommend learning paths by role, team, level, or capability area, so every learner gets development that fits their actual context.",
  },
  {
    q: "How does RQ-Eva show whether learning is working?",
    a: "RQ-Eva tracks progress, completion, skill movement, and capability improvement over time. Leaders can see whether learning is translating into real workforce readiness.",
  },
];

export default function EvaPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Eva">
      <AgentHero
        agentName="RQ-Eva"
        role="The Capability Builder"
        avatar="/agents/eva.png"
        heading={
          <>
            Find Skill Gaps Fast.
            <br />
            <span className="text-orange">Build Capabilities That Matter.</span>
          </>
        }
        sub="Turn team skill gaps into targeted learning paths."
        subClassName="max-w-[480px] md:max-w-none md:whitespace-nowrap"
        benefits={["Team-Level Skill Insights", "Targeted Learning Paths"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="Identify gaps. Recommend learning. Track capability growth."
      />

      <EvaMap />
      <EvaGaps />
      <EvaPaths />
      <EvaProgress />

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
            Build Skills That
            <br />
            <span className="text-orange">Move the Business.</span>
          </>
        }
        subtitle="Turn capability gaps into focused growth."
        ctaLabel="Build Better Capabilities"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
