import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import SagePage from "@/components/agents/individual/sage/SagePage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Skill Trainer | GrowQR",
  description:
    "Know exactly what to improve with Sage, your AI skill trainer. Sage analyzes your profile, finds your skill gaps, and builds a personalized roadmap with progress tracking.",
  alternates: { canonical: canonicalUrl("/ai-skill-trainer") },
  openGraph: {
    title: "AI Skill Trainer | GrowQR",
    description:
      "Build the skills that move your career. Sage finds your gaps and builds a personalized plan with measurable progress.",
    url: canonicalUrl("/ai-skill-trainer"),
    images: [OG_IMAGE],
  },
};

export default function AiSkillTrainerRoute() {
  return (
    <PageShell>
      <SagePage />
    </PageShell>
  );
}
