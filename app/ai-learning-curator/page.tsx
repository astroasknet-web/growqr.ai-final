import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import LyraPage from "@/components/agents/individual/lyra/LyraPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Learning Curator | GrowQR",
  description:
    "Learn only what moves your career forward. Lyra, your AI learning curator, turns your goal into a personalized path and hand-picks the resources worth your time.",
  alternates: { canonical: canonicalUrl("/ai-learning-curator") },
  openGraph: {
    title: "AI Learning Curator | GrowQR",
    description:
      "Cut the noise and the decision fatigue. Lyra builds one focused learning path around your goal and curates only what matters.",
    url: canonicalUrl("/ai-learning-curator"),
    images: [OG_IMAGE],
  },
};

export default function AiLearningCuratorRoute() {
  return (
    <PageShell>
      <LyraPage />
    </PageShell>
  );
}
