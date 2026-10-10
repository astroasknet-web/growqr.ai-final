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
  const role = sp.role === "employer" || sp.role === "teacher" || sp.role === "parent" ? sp.role : "student";
  const T = { student: ["Create your free account", "Applying is free. We never charge placement fees."], employer: ["Hire on GrowQR", "Post roles and meet verified students."], teacher: ["Create your teacher account", "Run a class, set courses and practice tests, and read a gradebook."], parent: ["Create your parent account", "Follow your child's learning with their learner code."] }[role];
  return (
    <AuthShell
      title={T[0]}
      subtitle={
        <>
          {T[1]}
          <br />
          <span className="text-[13px]">
            {role === "student" ? <>Hiring? <LinkText href="/signup?role=employer">Employer</LinkText> · Teaching? <LinkText href="/signup?role=teacher">Teacher</LinkText> · <LinkText href="/signup?role=parent">Parent</LinkText></> : <>Looking for an internship? <LinkText href="/signup">Sign up as a student</LinkText></>}
            {" · "}Already registered? <LinkText href="/login">Log in</LinkText>
          </span>
        </>
      }
    >
      <SignupForm role={role} />
    </AuthShell>
  );
}
