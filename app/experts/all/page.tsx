import type { Metadata } from "next";
import AllExpertsPage from "@/features/experts/components/sections/AllExpertsPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Browse All Experts | GrowQR Advisory",
  description:
    "Find and book 1:1 advisory sessions with verified industry experts across product, leadership, careers, AI, and more.",
  alternates: { canonical: canonicalUrl("/experts/all") },
  openGraph: {
    title: "Browse All Experts | GrowQR Advisory",
    description:
      "Find and book 1:1 advisory sessions with verified industry experts.",
    url: canonicalUrl("/experts/all"),
    images: [OG_IMAGE],
  },
};

export default function AllExpertsRoute() {
  return <AllExpertsPage />;
}
