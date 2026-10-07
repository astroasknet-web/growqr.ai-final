import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import MayaPage from "@/components/agents/enterprise/maya/MayaPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Outsourcing Manager | GrowQR",
  description:
    "RQ-Maya builds and manages your freelance bench, so the right talent is ready before you need it. Sourced, tracked, and deployed from one place.",
  alternates: { canonical: canonicalUrl("/enterprise/outsourcing-manager") },
  openGraph: {
    title: "AI Outsourcing Manager | GrowQR",
    description:
      "RQ-Maya builds and manages your freelance bench, so the right talent is ready before you need it.",
    url: canonicalUrl("/enterprise/outsourcing-manager"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseMayaRoute() {
  return (
    <PageShell>
      <MayaPage />
    </PageShell>
  );
}
