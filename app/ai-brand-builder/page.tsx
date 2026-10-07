import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import NovaPage from "@/components/agents/individual/nova/NovaPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Brand Builder | GrowQR",
  description:
    "Stand out on LinkedIn with AI-powered branding. Nova audits your profile, rewrites your copy, and plans content that makes you impossible to ignore.",
  alternates: { canonical: canonicalUrl("/ai-brand-builder") },
  openGraph: {
    title: "AI Brand Builder | GrowQR",
    description:
      "Stand out on LinkedIn with Nova, your AI brand builder. Audit, rewrite, plan, and grow your professional presence.",
    url: canonicalUrl("/ai-brand-builder"),
    images: [OG_IMAGE],
  },
};

export default function AiBrandBuilderRoute() {
  return (
    <PageShell>
      <NovaPage />
    </PageShell>
  );
}
