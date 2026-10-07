import type { Metadata } from "next";
import { requireUser } from "@/lib/portal/guard";
import { PortalPage } from "@/components/portal/shell";

export const metadata: Metadata = { title: "No CRM access | GrowQR", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Denied() {
  const me = await requireUser("admin", "counselor");
  return (
    <PortalPage user={me} active="crm" title="You do not have CRM access" subtitle="The Overseas CRM holds students' personal documents, so access is granted one person at a time.">
      <p className="text-[15px] text-ink-2 max-w-xl">Ask an administrator to add you under Team access. Once they do, reload this page from the menu.</p>
    </PortalPage>
  );
}
