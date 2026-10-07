import AgentHero from "@/components/agents/shared/AgentHero";
import TrustedBy from "@/components/agents/shared/TrustedBy";
import SectionIntro from "@/components/agents/shared/SectionIntro";
import Testimonials, { type Testimonial } from "@/components/agents/shared/Testimonials";
import FAQ, { type FaqItem } from "@/components/agents/shared/FAQ";
import FinalCTA from "@/components/agents/shared/FinalCTA";
import Pricing from "@/components/home/Pricing";
import {
  NovaConnect,
  NovaAudit,
  NovaImprove,
  NovaPlan,
  NovaGenerate,
  NovaGrow,
} from "./NovaSteps";
import NovaStory from "./NovaStory";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";

const CTA_HREF = AGENT_URL["RQ-Nova"] ?? "https://app.growqr.ai/signup";
const CTA_LABEL = AGENT_CTA["RQ-Nova"] ?? "Improve My Profile";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "RQ-Nova rewrote my headline and about section. Profile views tripled and recruiters started reaching out.",
  },
  {
    name: "Prasad Kkhandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "My engagement is up and people actually remember me now. RQ-Nova made my brand feel intentional.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "The audit showed exactly why I was being overlooked. Two weeks later my profile actually stands out.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "The weekly content plan keeps me consistent. I post three times a week without ever staring at a blank page.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "How does RQ-Nova connect to my LinkedIn?",
    a: "RQ-Nova connects through LinkedIn's own authorisation screen, so you approve exactly what it can do. It reads your profile to run the audit, and it publishes only what you have approved or what your posting schedule allows. You can pause the schedule or disconnect the account at any time.",
  },
  {
    q: "What does the profile audit cover?",
    a: "RQ-Nova reviews your headline, about, experience, and skills, scores each one, and gives clear recommendations on what to fix first.",
  },
  {
    q: "Will the content sound like me?",
    a: "Yes. RQ-Nova learns your voice and generates posts, hooks, and carousel ideas that read like you wrote them.",
  },
  {
    q: "How often should I post?",
    a: "RQ-Nova builds a weekly plan around your goals and schedule, so you stay consistent without burning out.",
  },
  {
    q: "Can I track my growth?",
    a: "You get a simple dashboard for profile strength, posting consistency, and engagement, so you can see progress over time.",
  },
  {
    q: "Is my data private?",
    a: "Completely. Your profile and content stay private and are never shared with anyone else.",
  },
];

export default function AiBrandBuilderPage() {
  return (
    <>
      <AgentHero
        agentName="RQ-Nova"
        role="The Brand Builder"
        avatar="/agents/5.png"
        heading={
          <>
            Turn Your Profile Into
            <br />
            <span className="text-orange">Real Outcomes.</span>
          </>
        }
        sub="Build a standout LinkedIn presence and get noticed."
        benefits={[
          "Profile audit with a clear plan",
          "Ready-to-post content in seconds",
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        videoSrc="/agents-video/nova.mp4"
        heroImg="/agent-subpage/sample/hero-socialbranding.png"
        heroAlt="RQ-Nova brand builder interface showing a LinkedIn profile audit and content plan"
        watchLabel="Watch RQ-Nova in Action"
        bareImage
        imageClassName="mx-auto h-auto w-[90%]"
      />

      <TrustedBy heading="Trusted by Professionals Building Their Brand" />

      <SectionIntro
        heading={
          <>
            How <span className="text-orange">It Works</span>
          </>
        }
        subtitle="From a quiet profile to a brand people remember."
      />

      <NovaConnect />
      <NovaAudit />
      <NovaImprove />
      <NovaPlan />
      <NovaGenerate />
      <NovaGrow />

      <NovaStory />

      <Testimonials
        heading={
          <>
            Brands People <span className="text-orange">Remember</span>
          </>
        }
        subtitle="Real professionals who became impossible to ignore."
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
            Build a Brand{" "}
            <span className="text-orange">People Remember.</span>
          </>
        }
        subtitle="Show up consistently and make an impact."
        ctaLabel="Improve my profile free"
        ctaHref={CTA_HREF}
      />
    </>
  );
}
