import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import ScoutPage from "@/components/agents/individual/scout/ScoutPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Opportunity Finder | GrowQR",
  description:
    "Stop searching endlessly. Scout, your AI opportunity finder, searches every source, scores each role against your profile, and applies to the best-fit opportunities for you.",
  alternates: { canonical: canonicalUrl("/ai-opportunity-finder") },
  openGraph: {
    title: "AI Opportunity Finder | GrowQR",
    description:
      "Find the opportunities that actually fit you. Scout searches everywhere, ranks the best matches, and helps you apply with confidence.",
    url: canonicalUrl("/ai-opportunity-finder"),
    images: [OG_IMAGE],
  },
};

export default function AiOpportunityFinderRoute() {
  return (
    <PageShell>
      <ScoutPage />
    </PageShell>
  );
}
