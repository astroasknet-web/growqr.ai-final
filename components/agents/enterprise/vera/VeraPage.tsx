import AgentHero from "@/components/agents/shared/AgentHero";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import {
  VeraSetup,
  VeraInterview,
  VeraEvaluate,
  VeraCompare,
} from "./VeraSteps";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import { EnterpriseContactProvider } from "@/components/enterprise/EnterpriseContactModal";

const CTA_HREF = "/contact";

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Vera different from ChatGPT?",
    a: "RQ-Vera is purpose-built for hiring. It conducts structured interviews, evaluates candidate responses, and delivers consistent, role-specific assessments—going beyond general AI conversations.",
  },
  {
    q: "Can RQ-Vera replace human interviewers?",
    a: "No. RQ-Vera enhances the interview process by conducting structured interviews and providing objective insights to support better hiring decisions.",
  },
  {
    q: "Can interviews be customized?",
    a: "Yes. Organizations can tailor questions, competencies, interview stages, and evaluation criteria to fit every role.",
  },
  {
    q: "Does RQ-Vera ensure consistency?",
    a: "Yes. Every candidate is assessed using the same structured framework, reducing bias and improving fairness.",
  },
  {
    q: "Can hiring teams review interviews?",
    a: "Yes. Interview summaries, transcripts, scores, and AI insights are available for collaborative decision-making.",
  },
];

export default function VeraPage() {
  return (
    <EnterpriseContactProvider agent="RQ-Vera">
      <AgentHero
        agentName="RQ-Vera"
        role="The Interviewer"
        avatar="/agents/1.png"
        heading={
          <>
            Interview with Confidence
            <br />
            <span className="text-orange">Every Time</span>
          </>
        }
        sub="Conduct structured, AI-powered interviews that evaluate every candidate fairly and consistently."
        benefits={["Consistent candidate evaluation", "Structured interview workflows"]}
        ctaLabel="Start Interview"
        ctaHref={CTA_HREF}
        heroImg="/agent-subpage/sample/enterprise/interviewr-hero.webp"
        heroAlt="RQ-Vera running a structured, AI-powered interview and evaluation"
        bareImage
        imageClassName="h-auto w-full -translate-x-6"
      />

      <SectionIntro
        heading={
          <>
            One Agent, <span className="text-orange">Every Interview</span>
          </>
        }
        subtitle="From interview setup to AI-powered evaluation in four simple steps."
      />

      <VeraSetup />
      <VeraInterview />
      <VeraEvaluate />
      <VeraCompare />

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
            Interview Smarter. <span className="text-orange">Hire Better.</span>
          </>
        }
        subtitle="Bring consistency, intelligence, and confidence to every interview."
        ctaLabel="Get Started"
        ctaHref={CTA_HREF}
      />
    </EnterpriseContactProvider>
  );
}
