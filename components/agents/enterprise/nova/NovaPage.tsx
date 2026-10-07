import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import {
  NovaStrategy,
  NovaLeadership,
  NovaEmployer,
  NovaComms,
  NovaReputation,
} from "./NovaSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";

const CTA_HREF = "/contact";
const CTA_LABEL = "Build Your Brand";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Nova different from ChatGPT?",
    a: "RQ-Nova understands your business context, brand strategy, and communication goals to produce consistent, enterprise-ready branding and communication workflows rather than one-off conversations.",
  },
  {
    q: "Can RQ-Nova keep our brand voice consistent across teams?",
    a: "Yes. RQ-Nova works from one defined brand identity and voice, so strategy, content, employer brand, and communications all stay on-message across every team and channel.",
  },
  {
    q: "Does RQ-Nova help with both internal and external communications?",
    a: "Yes. RQ-Nova drafts internal announcements and stakeholder updates as well as external PR, executive articles, and social content, all aligned to your positioning.",
  },
  {
    q: "Does RQ-Nova work with the other agents?",
    a: "Yes. RQ-Nova shapes your brand and presence while working alongside the hiring, workforce, and capability agents to deliver a connected employer and market brand.",
  },
];

export default function NovaPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Nova">
      <AgentHero
        agentName="RQ-Nova"
        role="The Brand Builder"
        avatar="/agents/5.png"
        heading={
          <>
            Build a Brand That
            <br />
            <span className="text-orange">Leads Your Market</span>
          </>
        }
        sub="RQ-Nova shapes your brand, content, and communications into one consistent presence."
        benefits={["Consistent Brand Strategy", "Executive Thought Leadership", "Stronger Employer Brand"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/nova-hero.webp"
        heroAlt="RQ-Nova shaping one consistent brand across strategy, content, employer brand, and communications"
        bareImage
      />

      <SectionIntro
        heading={
          <>
            One Agent, Whole <span className="text-orange">Brand</span>
          </>
        }
        subtitle="Strategy, content, employer brand, communications, and reputation."
      />

      <NovaStrategy />
      <NovaLeadership />
      <NovaEmployer />
      <NovaComms />
      <NovaReputation />

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
            Build a Brand People <span className="text-orange">Believe In.</span>
          </>
        }
        subtitle="Give your business one consistent, credible voice across every channel."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
