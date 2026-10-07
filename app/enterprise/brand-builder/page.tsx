import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import NovaPage from "@/components/agents/enterprise/nova/NovaPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Brand Builder | GrowQR",
  description:
    "RQ-Nova shapes your brand, content, and communications into one consistent presence. Brand strategy, thought leadership, employer brand, corporate communications, and reputation, in one workflow.",
  alternates: { canonical: canonicalUrl("/enterprise/brand-builder") },
  openGraph: {
    title: "Brand Builder | GrowQR",
    description:
      "RQ-Nova shapes your brand, content, and communications into one consistent presence.",
    url: canonicalUrl("/enterprise/brand-builder"),
    images: [OG_IMAGE],
  },
};

export default function EnterpriseNovaRoute() {
  return (
    <PageShell>
      <NovaPage />
    </PageShell>
  );
}
