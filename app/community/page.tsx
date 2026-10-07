import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import CommunityPage from "@/components/pages/community/CommunityPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GrowQR Community: Find Your People, Build Your Future",
  description:
    "Join GrowQR's growth community for students, professionals, and entrepreneurs. Build skills, create opportunities, and grow with ambitious people across India.",
  alternates: { canonical: canonicalUrl("/community") },
  openGraph: {
    title: "GrowQR Community",
    description:
      "A growth-focused community for students, professionals, and entrepreneurs. Find your community and grow together.",
    url: canonicalUrl("/community"),
    images: [OG_IMAGE],
  },
};

export default function CommunityRoute() {
  return (
    <PageShell>
      <CommunityPage />
    </PageShell>
  );
}
