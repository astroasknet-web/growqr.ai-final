import type { Metadata } from "next";
import Link from "next/link";
import { isVerified, mfaRequiredFor } from "@/lib/portal/auth";
import { requireUser } from "@/lib/portal/guard";
import PlanCard from "@/components/pay/PlanCard";
import { Alert } from "@/components/portal/ui";
import { Card, PortalPage } from "@/components/portal/shell";
import { ResendVerification } from "@/components/portal/forms";

export const metadata: Metadata = { title: "My account | GrowQR" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { student: "Student", employer: "Employer", admin: "Administrator", counselor: "Staff", teacher: "Teacher", parent: "Parent" } as const;

/**
 * Landing page for every signed-in role while the dashboards are moved over from the PHP app, one phase at a time.
 * It shows the real account state (verification, two-step login) that the dashboards build on.
 */
export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const verified = isVerified(me);
  const staff = mfaRequiredFor(me);
  return (
    <PortalPage user={me} active="account" title={`Hello, ${me.name.split(" ")[0]}`} subtitle={`${ROLE_LABEL[me.role]} account`}>
      {sp.welcome ? <Alert kind="success">Welcome to GrowQR. Your account is ready.</Alert> : null}

      {me.role === "student" ? (
        <Card title="Your Skill Passport">
          <p className="text-[15px] text-ink-3 mb-4">Score your resume, see what to improve, and publish a QR-verifiable passport that employers can check.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/passport" className="inline-flex items-center min-h-[48px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Open my Skill Passport</Link>
            <Link href="/studio" className="inline-flex items-center min-h-[48px] px-5 rounded-lg border border-black/[0.15] hover:bg-cream-2 text-ink font-semibold text-[15px]">Build my resume in Resume Studio</Link>
          </div>
        </Card>
      ) : null}

      {me.role === "student" ? <PlanCard userId={me.id} /> : null}

      <Card title="Account">
        <dl className="divide-y divide-black/[0.07] text-[15px]">
          <div className="flex justify-between gap-4 py-3"><dt className="text-ink-3">Name</dt><dd className="font-medium text-ink text-right">{me.name}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-ink-3">Email</dt><dd className="font-medium text-ink text-right break-all">{me.email}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-ink-3">Email confirmed</dt><dd className="font-medium text-right">{verified ? "Yes" : "Not yet"}</dd></div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-3">Two-step verification</dt>
            <dd className="font-medium text-right">{me.mfa_enabled_at ? "On" : staff ? "Required: not set up" : "Off"} · <Link className="text-orange-dark underline underline-offset-2" href="/account/mfa">{me.mfa_enabled_at ? "Manage" : "Set up"}</Link></dd>
          </div>
        </dl>
        {!verified ? (
          <div className="mt-5">
            <Alert kind="info">Confirm your email to unlock {me.role === "employer" ? "posting roles" : "applying to internships"}. Check your inbox, or ask for a new link.</Alert>
            <ResendVerification />
          </div>
        ) : null}
      </Card>
    </PortalPage>
  );
}
