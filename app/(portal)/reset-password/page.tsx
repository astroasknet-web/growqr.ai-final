import type { Metadata } from "next";
import { userForResetToken } from "@/lib/portal/auth";
import { Alert, AuthShell, LinkText } from "@/components/portal/ui";
import { ResetForm } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Choose a new password | GrowQR" };
export const dynamic = "force-dynamic";

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const token = (await searchParams).token ?? "";
  const user = await userForResetToken(token);
  if (!user) {
    return (
      <AuthShell title="This link has expired">
        <Alert>Reset links work once and last 60 minutes. Request a new one and we will email it right away.</Alert>
        <a href="/forgot-password" className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Request a new link</a>
        <p className="mt-5 text-center text-[13px]"><LinkText href="/login">Back to log in</LinkText></p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle={<>for <b>{user.email}</b></>}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
