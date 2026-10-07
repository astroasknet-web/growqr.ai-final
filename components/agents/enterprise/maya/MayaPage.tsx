import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { MayaNeeds, MayaBench, MayaReady, MayaDeploy } from "./MayaSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Maya"] ?? "Build Your Bench";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Maya different from ChatGPT?",
    a: "ChatGPT gives general advice. RQ-Maya builds and manages your external talent ecosystem, keeping skilled freelancers and partners organised, available, and ready for deployment.",
  },
  {
    q: "Can RQ-Maya manage existing freelancers?",
    a: "Yes. RQ-Maya helps organise, update, and maintain your existing freelance and outsourcing network in one place.",
  },
  {
    q: "Can RQ-Maya support multiple projects?",
    a: "Yes. RQ-Maya helps you identify the right external talent for different projects while tracking availability and skills.",
  },
  {
    q: "Who is RQ-Maya designed for?",
    a: "RQ-Maya is ideal for organisations that regularly work with freelancers, consultants, agencies, and outsourcing partners.",
  },
];

export default function MayaPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Maya">
      <AgentHero
        agentName="RQ-Maya"
        role="The Outsourcing Manager"
        avatar="/agents/maya.png"
        heading={
          <>
            Build Your Talent Network.
            <br />
            <span className="text-orange">Before You Need It.</span>
          </>
        }
        sub="Create and manage a ready-to-deploy freelance and outsourcing bench."
        benefits={["Build Talent Pools", "Manage External Talent"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/mayaa-hero.webp"
        heroAlt="RQ-Maya building and managing a ready-to-deploy freelance and outsourcing talent bench"
        bareImage
        imageClassName="h-auto w-full scale-[1.08] -translate-x-6 lg:-translate-x-10"
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From talent sourcing to deployment, RQ-Maya keeps your external workforce ready."
      />

      <MayaNeeds />
      <MayaBench />
      <MayaReady />
      <MayaDeploy />

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
            Build a Stronger Talent Bench.
            <br />
            <span className="text-orange">Stay Ready to Scale.</span>
          </>
        }
        subtitle="Keep the right external talent ready for every opportunity."
        ctaLabel="Build Your Bench"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
