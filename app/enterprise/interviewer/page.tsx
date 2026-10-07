import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import VeraPage from "@/components/agents/enterprise/vera/VeraPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Interviewer | GrowQR",
  description:
    "RQ-Vera conducts structured, AI-powered interviews that evaluate every candidate fairly and consistently - from interview setup to objective evaluation and candidate comparison.",
  alternates: { canonical: canonicalUrl("/enterprise/interviewer") },
  openGraph: {
    title: "Interviewer | GrowQR",
    description:
      "RQ-Vera conducts structured, AI-powered interviews that evaluate every candidate fairly and consistently.",
    url: canonicalUrl("/enterprise/interviewer"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseVeraRoute() {
  return (
    <PageShell>
      <VeraPage />
    </PageShell>
  );
}
