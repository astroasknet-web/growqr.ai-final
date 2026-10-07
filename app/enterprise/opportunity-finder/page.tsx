import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import ScoutPage from "@/components/agents/enterprise/scout/ScoutPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Opportunity Finder | GrowQR",
  description:
    "RQ-Scout discovers and recommends high-potential talent from multiple sources, helping organizations build stronger teams and future-ready talent communities.",
  alternates: { canonical: canonicalUrl("/enterprise/opportunity-finder") },
  openGraph: {
    title: "Opportunity Finder | GrowQR",
    description:
      "RQ-Scout discovers and recommends high-potential talent from multiple sources, helping organizations build stronger teams and talent communities.",
    url: canonicalUrl("/enterprise/opportunity-finder"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseScoutRoute() {
  return (
    <PageShell>
      <ScoutPage />
    </PageShell>
  );
}
