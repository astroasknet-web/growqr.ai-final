import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/portal/auth";
import { currentUser } from "@/lib/portal/guard";
import { AuthShell, LinkText } from "@/components/portal/ui";
import { SignupForm } from "@/components/portal/forms";

export const metadata: Metadata = { title: "Create your account | GrowQR" };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await currentUser();
  if (me) redirect(homeFor(me.role));
  const role = sp.role === "employer" ? "employer" : "student";
  return (
    <AuthShell
      title={role === "employer" ? "Hire on GrowQR" : "Create your free account"}
      subtitle={
        <>
          {role === "employer" ? "Post roles and meet verified students." : "Applying is free. We never charge placement fees."}
          <br />
          <span className="text-[13px]">
            {role === "employer" ? <>Looking for an internship? <LinkText href="/signup">Sign up as a student</LinkText></> : <>Hiring? <LinkText href="/signup?role=employer">Sign up as an employer</LinkText></>}
            {" · "}Already registered? <LinkText href="/login">Log in</LinkText>
          </span>
        </>
      }
    >
      <SignupForm role={role} />
    </AuthShell>
  );
}
