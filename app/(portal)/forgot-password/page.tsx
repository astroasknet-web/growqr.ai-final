import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/portal/auth";
import { currentUser } from "@/lib/portal/guard";
import { AuthShell, LinkText } from "@/components/portal/ui";
import { ForgotForm } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Reset your password | GrowQR" };
export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  const me = await currentUser();
  if (me) redirect(homeFor(me.role));
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a link to choose a new one.">
      <ForgotForm />
      <p className="mt-5 text-center text-[13px]"><LinkText href="/login">Back to log in</LinkText></p>
    </AuthShell>
  );
}
