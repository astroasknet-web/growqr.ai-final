import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import {
  ScoutStrategy,
  ScoutDiscovery,
  ScoutFit,
  ScoutCommunity,
} from "./ScoutSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";

const CTA_HREF = "/contact";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Scout different from ChatGPT?",
    a: "RQ-Scout is purpose-built for talent discovery. It identifies, matches, and recommends the right people based on your workforce needs—going beyond general AI conversations.",
  },
  {
    q: "How is RQ-Scout different from traditional talent search?",
    a: "RQ-Scout goes beyond keyword searches by understanding talent needs, identifying high-potential people, and recommending the best-fit profiles across multiple sources.",
  },
  {
    q: "Can RQ-Scout support different types of organizations?",
    a: "Yes. RQ-Scout adapts to enterprises, startups, institutions, and recruitment agencies, helping each discover and organize talent based on their unique workforce needs.",
  },
  {
    q: "Does RQ-Scout only help with active hiring?",
    a: "No. RQ-Scout continuously helps build talent communities, making it easier to prepare for future growth and workforce planning.",
  },
  {
    q: "Does RQ-Scout work with other AI agents?",
    a: "Yes. RQ-Scout works alongside role design, assessment, interview, onboarding, and workforce intelligence agents to create a connected talent ecosystem.",
  },
];

export default function ScoutPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Scout">
      <AgentHero
        agentName="RQ-Scout"
        role="The Opportunity Finder"
        avatar="/agents/3.png"
        heading={
          <>
            Discover Exceptional
            <br />
            <span className="text-orange">Talent, At Scale</span>
          </>
        }
        sub="The right talent, ready before you need it."
        subClassName="max-w-[560px]"
        benefits={["Discover Top Talent", "Build Talent Communities"]}
        ctaLabel="Start Discovering"
        ctaHref={CTA_HREF}
        heroImg="/solutions/recruiter-hero.webp"
        heroAlt="RQ-Scout discovering high-potential talent for your team"
        bareImage
        imageClassName="h-auto w-full -translate-x-6"
      />

      <SectionIntro
        heading={
          <>
            One Agent, <span className="text-orange">Stronger Teams</span>
          </>
        }
        subtitle="From defining talent needs to building future-ready talent pipelines."
      />

      <ScoutStrategy />
      <ScoutDiscovery />
      <ScoutFit />
      <ScoutCommunity />

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
            Build Stronger <span className="text-orange">Teams</span>
          </>
        }
        subtitle="Discover, evaluate, and nurture the people who will shape your organization's future."
        ctaLabel="Start Building"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
