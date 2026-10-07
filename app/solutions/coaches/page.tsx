import type { Metadata } from "next";
import CoachesSolutionPage from "@/components/pages/CoachesSolutionPage";
import { coachesContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: coachesContent.meta.title,
  description: coachesContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/coaches") },
  openGraph: {
    title: "GrowQR for Coaches",
    description: coachesContent.hero.subline,
    url: canonicalUrl("/solutions/coaches"),
    images: [OG_IMAGE],
  },
};

export default function CoachesUseCase() {
  return <CoachesSolutionPage />;
}
