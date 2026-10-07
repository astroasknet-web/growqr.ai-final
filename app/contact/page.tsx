import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import ContactPage from "@/components/pages/ContactPage";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact Us | GrowQR",
  description: "Contact GrowQR for enterprise, partnership, or support enquiries.",
  alternates: { canonical: canonicalUrl("/contact") },
  openGraph: {
    title: "Contact Us | GrowQR",
    description: "Contact GrowQR for enterprise, partnership, or support enquiries.",
    url: canonicalUrl("/contact"),
    images: [OG_IMAGE],
  },
};

export default function ContactRoute() {
  return <PageShell><ContactPage /></PageShell>;
}