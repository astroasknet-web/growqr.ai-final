import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/portal/auth";
import { currentUser } from "@/lib/portal/guard";
import { safeNext } from "@/lib/portal/security";
import { Alert, AuthShell, LinkText } from "@/components/portal/ui";
import { LoginForm } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Log in | GrowQR" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await currentUser();
  if (me) redirect(safeNext(sp.next, homeFor(me.role)));
  const next = safeNext(sp.next, "");
  return (
    <AuthShell title="Log in" subtitle={<>New here? <LinkText href="/signup">Create a free account</LinkText></>}>
      {sp.reset ? <Alert kind="success">Your password was updated. Log in with the new one.</Alert> : null}
      {sp.out ? <Alert kind="success">You have been logged out.</Alert> : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}
