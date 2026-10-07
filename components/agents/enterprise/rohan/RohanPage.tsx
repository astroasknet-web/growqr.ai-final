import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import { RohanMap, RohanTrends, RohanGaps, RohanPlan } from "./RohanSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";
import { AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = "/contact";
const CTA_LABEL = AGENT_CTA["RQ-Rohan"] ?? "Explore Insights";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Rohan different from ChatGPT?",
    a: "ChatGPT provides general guidance. RQ-Rohan continuously analyses workforce data to uncover capability gaps, performance trends, and development priorities tailored to your organisation.",
  },
  {
    q: "What data does RQ-Rohan analyse?",
    a: "RQ-Rohan analyses workforce skills, role data, learning progress, assessments, and performance indicators to provide actionable workforce insights.",
  },
  {
    q: "Can RQ-Rohan support workforce planning?",
    a: "Yes. RQ-Rohan highlights capability strengths and shortages, helping leaders make informed hiring, reskilling, and succession decisions.",
  },
  {
    q: "Does RQ-Rohan replace HR analytics tools?",
    a: "No. RQ-Rohan complements your existing HR systems by transforming workforce data into clear, decision-ready intelligence.",
  },
];

export default function RohanPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Rohan">
      <AgentHero
        agentName="RQ-Rohan"
        role="The Workforce Analyst"
        avatar="/agents/rohan.png"
        heading={
          <>
            See Your Workforce.
            <br />
            <span className="text-orange">Drive Better Decisions.</span>
          </>
        }
        sub="Understand skills, gaps, and performance across your workforce from one intelligent view."
        benefits={["Map Workforce Skills", "Identify Capability Gaps"]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/rohan-hero.webp"
        heroAlt="RQ-Rohan mapping workforce skills, gaps, and performance into one intelligent view for better decisions"
        bareImage
        imageClassName="h-auto w-full scale-[1.08] -translate-x-6 lg:-translate-x-10"
      />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="A simple workflow to understand your workforce and prioritise development."
      />

      <RohanMap />
      <RohanTrends />
      <RohanGaps />
      <RohanPlan />

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
            Build a Workforce
            <br />
            <span className="text-orange">Ready for Tomorrow.</span>
          </>
        }
        subtitle="Turn workforce intelligence into smarter talent decisions."
        ctaLabel="See Workforce Insights"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
