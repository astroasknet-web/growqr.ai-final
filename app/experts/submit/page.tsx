import type { Metadata } from "next";
import { ExpertIntakeForm } from "@/features/experts/components/sections/ExpertIntakeForm";
import { canonicalUrl } from "@/lib/seo";

// Unlisted page — shared directly with experts, kept out of search & the sitemap.
export const metadata: Metadata = {
  title: "Submit your expert profile | GrowQR",
  // Self-referencing so the root layout's homepage canonical doesn't leak in
  // and pair a noindex with a canonical to a different URL.
  alternates: { canonical: canonicalUrl("/experts/submit") },
  robots: { index: false, follow: false },
};

export default function ExpertSubmitRoute() {
  return <ExpertIntakeForm />;
}
