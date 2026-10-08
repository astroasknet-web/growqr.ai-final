import type { ReactNode } from "react";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import type { PortalUser } from "@/lib/portal/session";
import SiteChrome from "@/components/layout/SiteChrome";

/** Page frame for the public marketplace pages (internships, courses): logo, a small menu and, once signed in, the student's links. */
export async function currentViewer(): Promise<PortalUser | null> {
  if (!databaseConfigured()) return null;
  try {
    return (await getSession())?.user ?? null;
  } catch {
    return null;
  }
}


export function MarketShell({ user: _user, active, children }: { user: PortalUser | null; active: "internships" | "courses" | "abroad" | "applications" | "employer" | ""; children: ReactNode }) {
    return (
    <SiteChrome>
      <div className="min-h-[60vh] bg-cream-2"><main id="main" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">{children}</main></div>
    </SiteChrome>
  );
}
