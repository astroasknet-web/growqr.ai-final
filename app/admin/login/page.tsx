import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/auth/admin";
import { getSession } from "@/lib/portal/session";
import { databaseConfigured } from "@/lib/portal/db";
import { LogoutButton } from "@/components/portal/forms";

export const dynamic = "force-dynamic";

/**
 * The marketing admin uses the portal's staff login (password, human check and two-step code). This page sends the visitor there, and
 * explains the one case that would otherwise loop: someone signed in with an account that is not an administrator.
 */
export default async function AdminLoginPage() {
  if (!databaseConfigured()) {
    return <Shell title="Admin sign-in is not available">The database is not connected on this server, so nobody can sign in yet.</Shell>;
  }
  if (await getAdminUser()) redirect("/admin/ambassador");
  const s = await getSession();
  if (!s?.user) redirect("/login?next=/admin/ambassador");
  return (
    <Shell title="This account is not an administrator">
      <p>You are signed in as {s.user.email}, which does not have admin access. Sign out and sign in with an administrator account.</p>
      <div className="mt-5"><LogoutButton /></div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-cream-2">
      <div className="w-full max-w-[440px] rounded-2xl bg-white border border-black/[0.08] p-8 text-[15px] text-ink-2">
        <h1 className="text-[22px] font-semibold text-ink mb-3">{title}</h1>
        {children}
        <p className="mt-6 text-[13px]"><Link href="/" className="text-ink-3 underline">Back to the site</Link></p>
      </div>
    </div>
  );
}
