import type { Metadata } from "next";
import EnterprisesSolutionPage from "@/components/pages/EnterprisesSolutionPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "GrowQR for Enterprises - Run your business on the right intelligence",
  description:
    "Operate, decide, build, and grow with your AI team. Purpose-built for enterprises running day-to-day operations, decisions, execution, brand, and people development.",
  alternates: { canonical: canonicalUrl("/solutions/enterprises") },
  openGraph: {
    title: "GrowQR for Enterprises",
    description: "Operate, decide, build, and grow with your AI team.",
    url: canonicalUrl("/solutions/enterprises"),
    images: [OG_IMAGE],
  },
};

export default function EnterprisesUseCase() {
  return <EnterprisesSolutionPage />;
}
