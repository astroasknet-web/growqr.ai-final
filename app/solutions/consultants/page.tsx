import type { Metadata } from "next";
import PersonaPage from "@/components/pages/PersonaPage";
import { consultantsContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

// This page's copy (lib/persona-content.ts consultantsContent) is still
// placeholder text ("Placeholder — Stuck State.", etc.) — noindexed so it
// isn't crawled/indexed until real content ships. Remove robots + re-add to
// sitemap.ts once the copy is finalized.
export const metadata: Metadata = {
  title: consultantsContent.meta.title,
  description: consultantsContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/consultants") },
  robots: { index: false, follow: false },
  openGraph: {
    title: "GrowQR for Consultants",
    description: consultantsContent.hero.subline,
    url: canonicalUrl("/solutions/consultants"),
    images: [OG_IMAGE],
  },
};

export default function ConsultantsSolution() {
  return <PersonaPage content={consultantsContent} />;
}
