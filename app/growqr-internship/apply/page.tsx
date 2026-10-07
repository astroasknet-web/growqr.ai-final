import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { InternshipApplyForm } from "@/components/pages/internship/InternshipApplyForm";
import { roleFromSlug } from "@/components/pages/internship/internship-data";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Apply for an Internship | GrowQR",
  description:
    "Apply for an internship at GrowQR. Tell us about yourself, your skills, and the role you're interested in.",
  alternates: { canonical: canonicalUrl("/growqr-internship/apply") },
};

/**
 * `?role=` is resolved here rather than in the form so the preselected role is
 * server-rendered: no useSearchParams, no Suspense boundary, and no flash of an
 * empty select on the step the candidate arrived for. An unknown slug simply
 * leaves the field unselected.
 */
export default async function GrowQrInternshipApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <PageShell>
      <InternshipApplyForm initialRole={roleFromSlug(role)} />
    </PageShell>
  );
}
