import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { ApplyForm } from "@/components/pages/ambassadors/AmbassadorsApply";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Apply | GrowQR AI Global Campus Program",
  description: "Apply to join the GrowQR AI Global Campus Program Cohort 02. Build AI-ready talent at your campus.",
  alternates: { canonical: canonicalUrl("/ambassadors/apply") },
};

export default function AmbassadorApplyPage() {
  return (
    <PageShell>
      <ApplyForm />
    </PageShell>
  );
}
