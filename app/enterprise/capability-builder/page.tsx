import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import EvaPage from "@/components/agents/enterprise/eva/EvaPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Capability Builder | GrowQR",
  description:
    "RQ-Eva identifies skill gaps at team level and delivers targeted learning paths that move measurable needles, so development feels relevant instead of generic.",
  alternates: { canonical: canonicalUrl("/enterprise/capability-builder") },
  openGraph: {
    title: "AI Capability Builder | GrowQR",
    description:
      "RQ-Eva identifies skill gaps at team level and delivers targeted learning paths that move measurable needles.",
    url: canonicalUrl("/enterprise/capability-builder"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseEvaRoute() {
  return (
    <PageShell>
      <EvaPage />
    </PageShell>
  );
}
