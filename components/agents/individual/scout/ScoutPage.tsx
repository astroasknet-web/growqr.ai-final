import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import ScoutStory from "./ScoutStory";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  ScoutDefine,
  ScoutScan,
  ScoutMatch,
  ScoutCompare,
  ScoutApply,
} from "./ScoutSteps";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Scout"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Scout"] ?? "Find Opportunities";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "I stopped scrolling job boards for hours. RQ-Scout surfaced roles that actually fit, and I only applied to the best ones.",
  },
  {
    name: "Prasad Khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "The match scores changed everything. I could tell in seconds which opportunities were worth my time.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "Comparing offers side by side made the decision obvious. I picked the role with the best growth, not just the loudest one.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "Fewer applications, better callbacks. RQ-Scout found the right-fit roles and I walked in already matched.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How is RQ-Scout different from ChatGPT?",
    a: "RQ-Scout is built to find opportunities, not just answer questions. It continuously searches across multiple sources, matches opportunities to your profile and preferences, and helps you focus on the roles that best fit your goals.",
  },
  {
    q: "What kind of opportunities can RQ-Scout find?",
    a: "RQ-Scout helps you discover full-time jobs, internships, freelance projects, remote roles, and other career opportunities based on your skills, experience, interests, and preferred locations.",
  },
  {
    q: "How does RQ-Scout decide which opportunities to recommend?",
    a: "RQ-Scout analyzes your profile, career aspirations, skills, and preferences to prioritize opportunities that closely align with your goals, saving you time and reducing irrelevant searches.",
  },
  {
    q: "Does RQ-Scout only find opportunities?",
    a: "No. RQ-Scout also helps you stay organized by tracking relevant openings, surfacing the best matches, and working alongside your resume and interview preparation so you're ready to apply with confidence.",
  },
];

export default function ScoutPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Scout"
        role="The Opportunity Finder"
        avatar="/agents/3.png"
        heading={
          <>
            Stop Searching.
            <br />
            <span className="text-orange">Find Roles That Fit.</span>
          </>
        }
        sub="Discover better opportunities matched to you."
        benefits={[
          "Opportunities ranked by how well they fit you",
          "Search every source and apply from one place",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/scout.mp4"
        heroImg="/agent-subpage/sample/hero-scout.png"
        heroAlt="RQ-Scout opportunity finder interface showing matched roles with match scores and filters"
        watchLabel="Watch RQ-Scout in Action"
        bareImage
      />

      <TrustedBy heading="Trusted by Professionals Finding Better Roles" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From endless searching to auto-applying."
      />

      <ScoutDefine />
      <ScoutScan />
      <ScoutMatch />
      <ScoutCompare />
      <ScoutApply />

      <ScoutStory />

      <Testimonials
        heading={
          <>
            Right-Fit Roles, <span className="text-orange">Not More Noise</span>
          </>
        }
        subtitle="People who found roles worth their time."
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
            Find the Opportunities
            <br />
            <span className="text-orange">That Actually Fit.</span>
          </>
        }
        subtitle="RQ-Scout searches. You focus on the right roles."
        ctaLabel="Find my opportunities free"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
