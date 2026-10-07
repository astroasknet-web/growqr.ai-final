import type { Metadata } from "next";
import FreelancersSolutionPage from "@/components/pages/FreelancersSolutionPage";
import { freelancersContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: freelancersContent.meta.title,
  description: freelancersContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/freelancers") },
  openGraph: {
    title: "GrowQR for Freelancers",
    description: freelancersContent.hero.subline,
    url: canonicalUrl("/solutions/freelancers"),
    images: [OG_IMAGE],
  },
};

export default function FreelancersUseCase() {
  return <FreelancersSolutionPage />;
}
