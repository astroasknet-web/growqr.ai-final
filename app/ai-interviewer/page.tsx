import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import VeraPage from "@/components/agents/individual/vera/VeraPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Interviewer | GrowQR",
  description:
    "Practice role-specific interview questions and get instant, judgment-free feedback from your private AI interview coach. Ace your next job interview with GrowQR.",
  alternates: { canonical: canonicalUrl("/ai-interviewer") },
  openGraph: {
    title: "AI Interviewer | GrowQR",
    description:
      "Practice role-specific interview questions and get instant, judgment-free feedback from your private AI interview coach.",
    url: canonicalUrl("/ai-interviewer"),
    images: [OG_IMAGE],
  },
};

export default function AiInterviewerRoute() {
  return (
    <PageShell>
      <VeraPage />
    </PageShell>
  );
}
