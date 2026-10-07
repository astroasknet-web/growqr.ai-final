import type { Metadata } from "next";
import StartupsSolutionPage from "@/components/pages/StartupsSolutionPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GrowQR for Startups - Build with the right moves from day one",
  description:
    "Hire, grow, and make better decisions with your AI team. Purpose-built for founders building their startup from day one.",
  alternates: { canonical: canonicalUrl("/solutions/startups") },
  openGraph: {
    title: "GrowQR for Startups",
    description: "Hire, grow, and make better decisions with your AI team.",
    url: canonicalUrl("/solutions/startups"),
    images: [OG_IMAGE],
  },
};

export default function StartupsUseCase() {
  return <StartupsSolutionPage />;
}
