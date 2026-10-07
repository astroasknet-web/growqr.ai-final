import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import InternshipLanding from "@/components/pages/internship/InternshipLanding";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Internships | GrowQR",
  description:
    "Intern with GrowQR across technology, design, social media, community and sales. Remote, 3 to 6 months, mentored, with a certificate and a pathway to a full-time offer.",
  alternates: { canonical: canonicalUrl("/growqr-internship") },
};

export default function GrowQrInternshipPage() {
  return (
    <PageShell>
      <InternshipLanding />
    </PageShell>
  );
}
