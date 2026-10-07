import Hero from "./Hero";
import TrustedLogos from "./TrustedLogos";
import HowItWorksIntro from "./HowItWorksIntro";
import SetupSection from "./SetupSection";
import PersonaSection from "./PersonaSection";
import ExperienceSection from "./ExperienceSection";
import FeedbackSection from "./FeedbackSection";
import VeraStory from "./VeraStory";
import Testimonials from "./Testimonials";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";
import Pricing from "@/components/home/Pricing";

export default function AiInterviewerPage() {
  return (
    <>
      <Hero />
      <TrustedLogos />
      <HowItWorksIntro />
      <SetupSection />
      <PersonaSection />
      <ExperienceSection />
      <FeedbackSection />
      <VeraStory />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
