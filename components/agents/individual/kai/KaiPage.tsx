import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import KaiStory from "./KaiStory";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  KaiScenario,
  KaiCoach,
  KaiPractice,
  KaiImprove,
} from "./KaiSteps";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Kai"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Kai"] ?? "Start Roleplay";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "I rehearsed my raise conversation with RQ-Kai until it felt easy. Walked in calm and got the yes.",
  },
  {
    name: "Prasad Khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "Practicing the tough client call ahead of time changed everything. I finally stopped freezing under pressure.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "The coaching after each session was spot on. I knew exactly what to say differently the next time.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "It felt like I had already had the conversation before it happened. That confidence was everything.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Kai different from ChatGPT?",
    a: "RQ-Kai isn't just an AI you chat with. It's an AI you practice with. It takes on the role of an interviewer, manager, client, colleague, or customer, responds naturally in real time, and helps you build confidence through realistic conversations instead of one-way answers.",
  },
  {
    q: "What kinds of roleplays can I practice with RQ-Kai?",
    a: "You can practice job interviews, HR conversations, sales calls, client meetings, negotiations, leadership discussions, presentations, conflict resolution, networking, and other workplace or real-life scenarios tailored to your goals.",
  },
  {
    q: "Will RQ-Kai adapt to my responses?",
    a: "Yes. Every conversation evolves based on what you say. RQ-Kai asks follow-up questions, challenges your thinking, changes its tone when appropriate, and creates dynamic conversations that feel closer to real human interactions.",
  },
  {
    q: "Will I receive feedback after each roleplay?",
    a: "Absolutely. RQ-Kai provides detailed, actionable feedback on your communication, confidence, clarity, structure, listening, and overall effectiveness, along with practical suggestions to help you improve with every session.",
  },
];

export default function AiRoleplayCoachPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Kai"
        role="The Roleplay Coach"
        avatar="/agents/7.png"
        heading={
          <>
            Get Confident in Every
            <br />
            <span className="text-orange">Conversation.</span>
          </>
        }
        sub="Practice real scenarios. Build lasting confidence."
        benefits={[
          "Realistic roleplay for any workplace scenario",
          "Personalized coaching after every session",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/kai.mp4"
        heroImg="/agent-subpage/sample/hero-roleplay.png"
        heroAlt="RQ-Kai roleplay coach interface showing a live practice session and communication score"
        watchLabel="Watch RQ-Kai in Action"
        bareImage
      />

      <TrustedBy heading="Trusted by Professionals Who Speak With Conviction" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From nervous to ready for any conversation."
      />

      <KaiScenario />
      <KaiCoach />
      <KaiPractice />
      <KaiImprove />

      <KaiStory />

      <Testimonials
        heading={
          <>
            Confidence People <span className="text-orange">Can Feel</span>
          </>
        }
        subtitle="Professionals who rehearsed the conversations that shaped their careers."
        items={TESTIMONIALS}
      />

      <Pricing />

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
            Walk In Ready for the
            <br />
            <span className="text-orange">Conversation That Counts.</span>
          </>
        }
        subtitle="Practice with RQ-Kai and walk in confident."
        ctaLabel="Start roleplay"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
