import type { Metadata } from "next";
import InstitutesSolutionPage from "@/components/pages/InstitutesSolutionPage";
import { institutesContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: institutesContent.meta.title,
  description: institutesContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/institutes") },
  openGraph: {
    title: "GrowQR for Institutes",
    description: institutesContent.hero.subline,
    url: canonicalUrl("/solutions/institutes"),
    images: [OG_IMAGE],
  },
};

export default function InstitutesUseCase() {
  return <InstitutesSolutionPage />;
}
