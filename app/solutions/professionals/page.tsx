import type { Metadata } from "next";
import ProfessionalsSolutionPage from "@/components/pages/ProfessionalsSolutionPage";
import { professionalsContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: professionalsContent.meta.title,
  description: professionalsContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/professionals") },
  openGraph: {
    title: "GrowQR for Professionals",
    description: professionalsContent.hero.subline,
    url: canonicalUrl("/solutions/professionals"),
    images: [OG_IMAGE],
  },
};

export default function ProfessionalsUseCase() {
  return <ProfessionalsSolutionPage />;
}
