import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import VisionPage from "@/components/pages/VisionPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Vision | GrowQR",
  description: "Explore GrowQR's vision for the future of workforce intelligence and talent verification.",
  alternates: { canonical: canonicalUrl("/vision") },
  openGraph: {
    title: "Vision | GrowQR",
    description: "Explore GrowQR's vision for the future of workforce intelligence and talent verification.",
    url: canonicalUrl("/vision"),
    images: [OG_IMAGE],
  },
};

export default function VisionRoute() {
  return <PageShell><VisionPage /></PageShell>;
}