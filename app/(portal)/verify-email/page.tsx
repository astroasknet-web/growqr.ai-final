import type { Metadata } from "next";
import { homeFor, isVerified, userForVerifyToken } from "@/lib/portal/auth";
import { currentUser } from "@/lib/portal/guard";
import { confirmEmailAction } from "@/app/(portal)/actions";
import { SubmitButton, AuthShell, Alert } from "@/components/portal/ui";
import { ResendVerification } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Confirm your email | GrowQR" };
export const dynamic = "force-dynamic";

/**
 * Two steps on purpose: the emailed link only SHOWS a confirm button. Mail scanners and link previewers fetch links with GET,
 * so confirming needs a deliberate POST (the button).
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await currentUser();
  const home = me ? homeFor(me.role) : "/login";
  const homeLabel = me ? "Go to my account" : "Log in";
  const btn = "inline-flex items-center justify-center w-full min-h-[48px] rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]";

  if (sp.done) {
    return (
      <AuthShell title="Email confirmed">
        <Alert kind="success">Your email is verified. You can now {me?.role === "employer" ? "post roles" : "apply to internships"} on GrowQR.</Alert>
        <a href={home} className={btn}>{homeLabel}</a>
      </AuthShell>
    );
  }

  const token = sp.token ?? "";
  const user = await userForVerifyToken(token);
  if (user && isVerified(user)) {
    return (
      <AuthShell title="Already confirmed">
        <Alert kind="success">This email address is already verified.</Alert>
        <a href={home} className={btn}>{homeLabel}</a>
      </AuthShell>
    );
  }
  if (user) {
    return (
      <AuthShell title="Confirm your email" subtitle={<>Confirm <b>{user.email}</b> to finish setting up your account.</>}>
        <form action={confirmEmailAction}>
          <input type="hidden" name="token" value={token} />
          <SubmitButton pendingText="Confirming...">Confirm my email</SubmitButton>
        </form>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="This link has expired">
      <p className="text-[14px] text-ink-3 mb-5">Confirmation links work once and last 24 hours. {me ? (isVerified(me) ? "" : "We can send you a new one.") : "Log in and we can send you a new one."}</p>
      {me && !isVerified(me) ? <ResendVerification /> : <a href={home} className={btn}>{homeLabel}</a>}
    </AuthShell>
  );
}
