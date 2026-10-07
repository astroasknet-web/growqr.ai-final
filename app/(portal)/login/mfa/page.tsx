import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pendingMfaUser } from "@/lib/portal/auth";
import { getSession } from "@/lib/portal/session";
import { AuthShell, LinkText } from "@/components/portal/ui";
import { MfaLoginForm } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Two-step verification | GrowQR" };
export const dynamic = "force-dynamic";

export default async function LoginMfaPage() {
  const s = await getSession();
  const pending = await pendingMfaUser(Number(s?.data.mfa_uid ?? 0) || null, Number(s?.data.mfa_t ?? 0) || null);
  if (!pending) redirect("/login");
  return (
    <AuthShell title="Two-step verification" subtitle="Enter the 6-digit code from your authenticator app, or one of your recovery codes.">
      <MfaLoginForm />
      <p className="mt-5 text-center text-[13px]"><LinkText href="/login">Start over</LinkText></p>
    </AuthShell>
  );
}
