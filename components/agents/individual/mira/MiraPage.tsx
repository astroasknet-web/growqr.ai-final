import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  MiraTargetRole,
  MiraBuildResume,
  MiraAnalyze,
  MiraCopilot,
  MiraTailor,
  MiraVersions,
} from "./MiraSteps";
import MiraStory from "./MiraStory";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Mira"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Mira"] ?? "Build My Resume";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "RQ-Mira rewrote my bullets to show real impact. I went from no replies to three interviews in a week.",
  },
  {
    name: "Prasad khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "I tailored a version for every application in minutes. No more rewriting my whole resume each time.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "I uploaded an old resume and had a polished, role-tuned version ready in minutes.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "The ATS score told me exactly what was missing. Fixed the keywords and finally got past the screener.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Mira different from ChatGPT?",
    a: "RQ-Mira is purpose-built for resume creation and optimization. Rather than offering generic writing suggestions, it understands recruiter expectations, ATS requirements, and job descriptions to help you build resumes that are tailored for real opportunities.",
  },
  {
    q: "Can RQ-Mira create different resumes for different jobs?",
    a: "Yes. RQ-Mira generates role-specific resume versions by aligning your skills, experience, and achievements with the requirements of each position, making every application more relevant.",
  },
  {
    q: "Can RQ-Mira improve my existing resume?",
    a: "Absolutely. RQ-Mira identifies weak sections, enhances impact statements, improves formatting and ATS compatibility, and recommends changes that make your resume stronger and more competitive.",
  },
  {
    q: "Does RQ-Mira only help with resumes?",
    a: "No. In addition to resume optimization, RQ-Mira can help refine professional summaries, achievement statements, cover letters, and other application materials to present your profile more effectively.",
  },
];

export default function AiResumeExpertPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Mira"
        role="The Resume Expert"
        avatar="/agents/2.png"
        heading={
          <>
            A Resume Tailored for
            <br />
            <span className="text-orange">Every Opportunity.</span>
          </>
        }
        sub="Build a better resume and get more interviews."
        benefits={[
          "AI Co-pilot writes and improves every section",
          "Optimized for ATS to land more interviews",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/mira.mp4"
        heroImg="/agent-subpage/sample/resumebuilder-hero.webp"
        heroAlt="RQ-Mira resume builder interface showing a tailored resume and score"
        watchLabel="Watch RQ-Mira in Action"
        bareImage
      />

      <TrustedBy heading="Trusted by Job Seekers Who Got Hired" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From target role to a resume that lands interviews."
      />

      <MiraTargetRole />
      <MiraBuildResume />
      <MiraAnalyze />
      <MiraCopilot />
      <MiraTailor />
      <MiraVersions />

      <MiraStory />

      <Testimonials
        heading={
          <>
            Resumes That <span className="text-orange">Secured the Job</span>
          </>
        }
        subtitle="Real job seekers who turned applications into offers."
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
            Your Next Resume
            <br />
            <span className="text-orange">Could Land the Interview.</span>
          </>
        }
        subtitle="Build a resume designed to get you noticed."
        ctaLabel="Build my resume free"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
