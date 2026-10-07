import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import TheoPage from "@/components/agents/enterprise/theo/TheoPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Attrition Predictor | GrowQR",
  description:
    "RQ-Theo reads team signals and flags disengagement before it becomes a resignation letter on your desk. Early risk signals, prioritized, with timely retention action.",
  alternates: { canonical: canonicalUrl("/enterprise/attrition-predictor") },
  openGraph: {
    title: "AI Attrition Predictor | GrowQR",
    description:
      "RQ-Theo reads team signals and flags disengagement before it becomes a resignation letter on your desk.",
    url: canonicalUrl("/enterprise/attrition-predictor"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseTheoRoute() {
  return (
    <PageShell>
      <TheoPage />
    </PageShell>
  );
}
