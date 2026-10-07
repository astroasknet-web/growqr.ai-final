import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import SageStory from "./SageStory";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  SageUnderstand,
  SageGaps,
  SageRoadmap,
  SageGrowth,
} from "./SageSteps";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Sage"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Sage"] ?? "Build My Skill Plan";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "RQ-Sage showed me exactly which skills were holding me back. Two months later I had the promotion.",
  },
  {
    name: "Prasad Khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "I finally stopped guessing what to learn next. The roadmap kept me focused on what actually mattered.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "The gap analysis was a wake-up call. I closed the weak spots and walked into interviews with real confidence.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "Seeing my skill score climb every week kept me going. It turned learning into something I actually stuck with.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Sage different from ChatGPT?",
    a: "RQ-Sage is designed to help you build skills, not just learn about them. It identifies your skill gaps, creates personalized practice plans, and guides you through structured exercises that help you improve through action.",
  },
  {
    q: "What skills can I develop with RQ-Sage?",
    a: "RQ-Sage helps you strengthen both technical and professional skills, including communication, leadership, problem-solving, critical thinking, teamwork, time management, AI literacy, and role-specific competencies.",
  },
  {
    q: "How does RQ-Sage personalize my learning?",
    a: "RQ-Sage analyzes your current abilities, career goals, and progress to recommend the skills that will have the greatest impact, then adapts your learning journey as you improve.",
  },
  {
    q: "How is RQ-Sage different from RQ-Lyra?",
    a: "RQ-Sage helps you build the skills, while RQ-Lyra helps you discover the right learning resources. RQ-Sage guides you through hands-on practice, exercises, and feedback to turn learning into real capability, whereas RQ-Lyra curates personalized courses, videos, articles, and learning paths based on your goals.",
  },
];

export default function AiSkillTrainerPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Sage"
        role="The Skill Trainer"
        avatar="/agents/4.png"
        heading={
          <>
            Sharpen Your Skills.
            <br />
            <span className="text-orange">Accelerate Your Career.</span>
          </>
        }
        sub="See what to improve and grow with a clear plan."
        benefits={[
          "See your strengths and skill gaps clearly",
          "A personalized roadmap with progress tracking",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/sage.mp4"
        heroImg="/agent-subpage/sample/hero-skilltrainer.png"
        heroAlt="RQ-Sage skill trainer interface showing a skill gap analysis and learning roadmap"
        watchLabel="Watch RQ-Sage in Action"
        bareImage
      />

      <TrustedBy heading="Trusted by Professionals Leveling Up" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From skill gaps to real career growth."
      />

      <SageUnderstand />
      <SageGaps />
      <SageRoadmap />
      <SageGrowth />

      <SageStory />

      <Testimonials
        heading={
          <>
            Growth People <span className="text-orange">Can Measure</span>
          </>
        }
        subtitle="Professionals who turned gaps into growth."
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
            Know Exactly What
            <br />
            <span className="text-orange">to Improve Next.</span>
          </>
        }
        subtitle="Build a plan that closes your gaps for good."
        ctaLabel="Build my skill plan free"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
