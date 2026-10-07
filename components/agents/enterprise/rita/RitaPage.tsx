import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { RitaRole, RitaBlueprint, RitaCoordinate, RitaExecute } from "./RitaSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Rita"] ?? "Start Hiring Smarter";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Rita different from ChatGPT?",
    a: "ChatGPT provides general answers. RQ-Rita manages your hiring workflow. She understands recruitment processes, builds structured hiring blueprints, coordinates interviews, keeps recruiters and hiring managers aligned, and ensures every hiring stage stays on track. Instead of responding to prompts, RQ-Rita helps teams execute hiring with consistency and structure.",
  },
  {
    q: "Does RQ-Rita help before interviews begin?",
    a: "Yes. RQ-Rita helps define roles, create hiring blueprints, assign interview stages, and prepare the entire hiring workflow before candidates are assessed.",
  },
  {
    q: "Can RQ-Rita coordinate multiple hiring campaigns?",
    a: "Yes. RQ-Rita manages multiple roles, interview panels, hiring stages, and stakeholder communication simultaneously.",
  },
  {
    q: "Does RQ-Rita work with other AI agents?",
    a: "Yes. RQ-Rita orchestrates the hiring workflow while working alongside assessment, interview, and onboarding agents to deliver a connected recruitment experience.",
  },
];

export default function RitaPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Rita">
      <AgentHero
        agentName="RQ-Rita"
        role="The AI Recruiter"
        avatar="/agents/rita.png"
        heading={
          <>
            Where Great Hiring Begins.
            <br />
            <span className="text-orange">Structured for Success</span>
          </>
        }
        sub="Turn hiring into one seamless, coordinated experience."
        benefits={["Define the Perfect Role", "Build the Hiring Blueprint"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/rita-hero.webp"
        heroAlt="RQ-Rita screening a large candidate pool through an AI funnel into a shortlist of verified, best-fit candidates"
        bareImage
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From role definition to interview coordination, every hiring step on track."
      />

      <RitaRole />
      <RitaBlueprint />
      <RitaCoordinate />
      <RitaExecute />

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
            Hiring, Perfectly <span className="text-orange">Coordinated.</span>
          </>
        }
        subtitle="Everything your hiring team needs to plan, coordinate, and execute recruitment in one intelligent workflow."
        ctaLabel="Start Hiring"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
