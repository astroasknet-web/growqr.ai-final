import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import RitaPage from "@/components/agents/enterprise/rita/RitaPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Recruiter | GrowQR",
  description:
    "RQ-Rita screens hundreds of candidates and shortlists the few who fit, so your recruiters focus on people, not profiles. Structured hiring blueprints, coordinated interviews, one workflow.",
  alternates: { canonical: canonicalUrl("/enterprise/ai-recruiter") },
  openGraph: {
    title: "AI Recruiter | GrowQR",
    description:
      "RQ-Rita screens hundreds of candidates and shortlists the few who fit, so your recruiters focus on people, not profiles.",
    url: canonicalUrl("/enterprise/ai-recruiter"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseRitaRoute() {
  return (
    <PageShell>
      <RitaPage />
    </PageShell>
  );
}
