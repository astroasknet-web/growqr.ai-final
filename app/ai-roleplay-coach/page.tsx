import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import KaiPage from "@/components/agents/individual/kai/KaiPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Roleplay Coach | GrowQR",
  description:
    "Practice real conversations before they matter with Kai, your AI roleplay coach. Rehearse negotiations, tough talks, and client meetings, then get personalized coaching.",
  alternates: { canonical: canonicalUrl("/ai-roleplay-coach") },
  openGraph: {
    title: "AI Roleplay Coach | GrowQR",
    description:
      "Rehearse high-stakes conversations with Kai and walk in with confidence. Realistic roleplay plus coaching after every session.",
    url: canonicalUrl("/ai-roleplay-coach"),
    images: [OG_IMAGE],
  },
};

export default function AiRoleplayCoachRoute() {
  return (
    <PageShell>
      <KaiPage />
    </PageShell>
  );
}
