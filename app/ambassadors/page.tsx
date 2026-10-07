import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import AmbassadorsPage from "@/components/pages/ambassadors/AmbassadorsPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GrowQR Ambassador Program: Build AI-Ready Talent, Campus by Campus",
  description:
    "Join GrowQR's Cohort 02 Campus Ambassador Program. Lead initiatives, build community, unlock career opportunities, and grow with AI.",
  alternates: { canonical: canonicalUrl("/ambassadors") },
  openGraph: {
    title: "GrowQR Ambassador Program",
    description: "Build AI-ready talent, campus by campus. Apply for Cohort 02.",
    url: canonicalUrl("/ambassadors"),
    images: [OG_IMAGE],
  },
};

export default function AmbassadorsRoute() {
  return (
    <PageShell>
      <AmbassadorsPage />
    </PageShell>
  );
}
