import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isVerified } from "@/lib/portal/auth";
import { requireUser } from "@/lib/portal/guard";
import * as jobs from "@/lib/market/jobs";
import { Card, PortalPage } from "@/components/portal/shell";
import { ResendVerification } from "@/components/portal/forms";
import { PostForm } from "@/components/market/post-form";

export const metadata: Metadata = { title: "Post a role | GrowQR" };
export const dynamic = "force-dynamic";

export default async function PostRolePage() {
  const me = await requireUser("employer");
  const company = await jobs.companyOf(me.id);
  if (!company) redirect("/employer");
  return (
    <PortalPage user={me} active="post" title="Post a role" subtitle="Listings are reviewed within one business day." wide="full">
      {!isVerified(me) ? (
        <Card title="Confirm your email to post a role">
          <p className="text-[15px] text-ink-3 mb-4">We sent a confirmation link to <b>{me.email}</b>. Posting unlocks as soon as you confirm.</p>
          <ResendVerification />
        </Card>
      ) : (
        <PostForm company={company.name} />
      )}
    </PortalPage>
  );
}
