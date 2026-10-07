import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import LyraStory from "./LyraStory";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  LyraGoal,
  LyraGaps,
  LyraPath,
  LyraResources,
  LyraTrack,
} from "./LyraSteps";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Lyra"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Lyra"] ?? "Get My Learning Path";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "I stopped buying courses I never finished. RQ-Lyra gave me one path and I actually followed it to the end.",
  },
  {
    name: "Prasad Khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "The gap analysis told me exactly what to learn first. No more guessing what would move my career forward.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "Every resource was hand-picked, so I spent my time learning instead of searching. That alone was worth it.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "Seeing my path fill up week by week kept me going. I finally built momentum instead of stalling out.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Lyra different from ChatGPT?",
    a: "RQ-Lyra doesn't just answer questions, it curates your learning journey. It identifies what you need to learn based on your goals, recommends the most relevant resources, and organizes them into a focused path instead of leaving you to search on your own.",
  },
  {
    q: "What kind of learning resources does RQ-Lyra recommend?",
    a: "RQ-Lyra curates high-quality courses, videos, articles, books, certifications, and other learning resources from trusted platforms, tailored to your career goals and skill requirements.",
  },
  {
    q: "How does RQ-Lyra decide what I should learn?",
    a: "RQ-Lyra analyzes your profile, target role, existing skills, and learning objectives to recommend the topics and resources that will have the greatest impact on your growth.",
  },
  {
    q: "Will RQ-Lyra save me from endless searching?",
    a: "Yes. Instead of overwhelming you with thousands of courses and resources, RQ-Lyra filters the noise and presents a personalized, structured learning path so you can focus on learning, not searching.",
  },
];

export default function LyraPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Lyra"
        role="The Learning Curator"
        avatar="/agents/6.png"
        heading={
          <>
            Learn Only What
            <br />
            <span className="text-orange">Moves You Forward.</span>
          </>
        }
        sub="A personalized learning path, minus the noise."
        benefits={[
          "One focused path built around your goal",
          "Purposefully curated learning, not endless course lists",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/lyra.mp4"
        heroImg="/agent-subpage/sample/hero-lyra.png"
        heroAlt="RQ-Lyra learning curator interface showing a career goal, skill milestones, and a curated learning path"
        watchLabel="Watch RQ-Lyra in Action"
        bareImage
      />

      <TrustedBy heading="Trusted by Professionals Learning With Focus" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From a career goal to real, focused progress."
      />

      <LyraGoal />
      <LyraGaps />
      <LyraPath />
      <LyraResources />
      <LyraTrack />

      <LyraStory />

      <Testimonials
        heading={
          <>
            Progress That <span className="text-orange">Sticks</span>
          </>
        }
        subtitle="One clear path, not endless courses."
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
            Learn Only What
            <br />
            <span className="text-orange">Moves You Forward.</span>
          </>
        }
        subtitle="Learn what matters. Reach your goal faster."
        ctaLabel="Get my learning path free"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
