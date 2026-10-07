import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import MiraPage from "@/components/agents/individual/mira/MiraPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Resume Expert | GrowQR",
  description:
    "Build an ATS-ready resume tailored to every role in minutes. Mira writes, scores, and refines your resume so you get more interviews.",
  alternates: { canonical: canonicalUrl("/ai-resume-expert") },
  openGraph: {
    title: "AI Resume Expert | GrowQR",
    description:
      "Build an ATS-ready resume tailored to every role in minutes with Mira, your AI resume expert.",
    url: canonicalUrl("/ai-resume-expert"),
    images: [OG_IMAGE],
  },
};

export default function AiResumeExpertRoute() {
  return (
    <PageShell>
      <MiraPage />
    </PageShell>
  );
}
