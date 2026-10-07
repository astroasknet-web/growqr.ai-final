import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import type { PortalUser } from "@/lib/portal/session";
import { LogoutButton } from "@/components/portal/forms";

/** Page frame for the public marketplace pages (internships, courses): logo, a small menu and, once signed in, the student's links. */
export async function currentViewer(): Promise<PortalUser | null> {
  if (!databaseConfigured()) return null;
  try {
    return (await getSession())?.user ?? null;
  } catch {
    return null;
  }
}

const LINK = "min-h-[44px] inline-flex items-center px-3 rounded-lg text-[14px] font-medium whitespace-nowrap";

export function MarketShell({ user, active, children }: { user: PortalUser | null; active: "internships" | "courses" | "abroad" | "applications" | "employer" | ""; children: ReactNode }) {
  const nav = (key: string, href: string, label: string) => (
    <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`${LINK} ${active === key ? "bg-orange-light text-orange-deep" : "text-ink-3 hover:bg-cream-2"}`}>{label}</Link>
  );
  return (
    <div className="min-h-screen bg-cream-2">
      <header className="bg-white border-b border-black/[0.08]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 min-h-16 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
          <Link href="/" aria-label="GrowQR home" className="shrink-0"><Image src="/growqr-logo.png" alt="GrowQR" width={120} height={34} className="h-8 w-auto" priority /></Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {nav("internships", "/internships", "Internships")}
            {nav("courses", "/courses", "Courses")}
            {nav("abroad", "/study-abroad", "Study abroad")}
            {user?.role === "student" ? nav("applications", "/applications", "My applications") : null}
            {user?.role === "employer" ? nav("employer", "/employer", "Employer dashboard") : null}
            {user ? (
              <>
                <Link href="/account" className={`${LINK} text-ink-3 hover:bg-cream-2`}>My account</Link>
                <LogoutButton className={`${LINK} text-ink-3 hover:bg-cream-2`} />
              </>
            ) : (
              <>
                <Link href="/login" className={`${LINK} text-ink-3 hover:bg-cream-2`}>Log in</Link>
                <Link href="/signup" className={`${LINK} bg-orange text-white hover:bg-orange-dark`}>Sign up free</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
