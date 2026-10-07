import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import FinnPage from "@/components/agents/enterprise/finn/FinnPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Onboarding Co-pilot | GrowQR",
  description:
    "RQ-Finn cuts time-to-productivity by guiding every new hire through a structured, personalised onboarding journey from day one.",
  alternates: { canonical: canonicalUrl("/enterprise/onboarding-co-pilot") },
  openGraph: {
    title: "AI Onboarding Co-pilot | GrowQR",
    description:
      "RQ-Finn cuts time-to-productivity by guiding every new hire through a structured, personalised onboarding journey.",
    url: canonicalUrl("/enterprise/onboarding-co-pilot"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseFinnRoute() {
  return (
    <PageShell>
      <FinnPage />
    </PageShell>
  );
}
