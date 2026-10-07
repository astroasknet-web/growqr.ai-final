import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import AboutPage from "@/components/pages/AboutPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Us | GrowQR",
  description: "Learn about GrowQR's mission to make talent visible, verified, and valuable.",
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: {
    title: "About Us | GrowQR",
    description: "Learn about GrowQR's mission to make talent visible, verified, and valuable.",
    url: canonicalUrl("/about"),
    images: [OG_IMAGE],
  },
};

export default function AboutRoute() {
  return <PageShell><AboutPage /></PageShell>;
}