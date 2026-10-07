import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import RohanPage from "@/components/agents/enterprise/rohan/RohanPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Workforce Analyst | GrowQR",
  description:
    "RQ-Rohan maps skills, gaps, and performance patterns across your entire workforce in real time, so leaders can make informed hiring, reskilling, and succession decisions.",
  alternates: { canonical: canonicalUrl("/enterprise/workforce-analyst") },
  openGraph: {
    title: "AI Workforce Analyst | GrowQR",
    description:
      "RQ-Rohan maps skills, gaps, and performance patterns across your entire workforce in real time.",
    url: canonicalUrl("/enterprise/workforce-analyst"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseRohanRoute() {
  return (
    <PageShell>
      <RohanPage />
    </PageShell>
  );
}
