import type { Metadata } from "next";
import ExpertsPage from "@/features/experts/components/sections/ExpertsPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GrowQR Experts: 1:1 Advisory Sessions",
  description:
    "Talk to the person who's already solved your problem. Book 1:1 advisory sessions with verified experts across careers, leadership, education, and more.",
  alternates: { canonical: canonicalUrl("/experts") },
  openGraph: {
    title: "GrowQR Experts: 1:1 Advisory Sessions",
    description: "A premium advisory ecosystem to book high-trust expert sessions.",
    url: canonicalUrl("/experts"),
    images: [OG_IMAGE],
  },
};

export default function ExpertsRoute() {
  return <ExpertsPage />;
}
