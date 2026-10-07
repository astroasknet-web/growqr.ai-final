import type { Metadata } from "next";
import RecruitersSolutionPage from "@/components/pages/RecruitersSolutionPage";
import { recruitersContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: recruitersContent.meta.title,
  description: recruitersContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/recruiters") },
  openGraph: {
    title: "GrowQR for Recruiters",
    description: recruitersContent.hero.subline,
    url: canonicalUrl("/solutions/recruiters"),
    images: [OG_IMAGE],
  },
};

export default function RecruitersUseCase() {
  return <RecruitersSolutionPage />;
}
