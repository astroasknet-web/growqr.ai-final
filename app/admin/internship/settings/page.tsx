export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInternshipSettings } from "@/lib/internship/settings";
import InternshipSettingsForm from "@/components/admin/InternshipSettingsForm";

/**
 * Internship automation settings. Set once by HR; read by every automatic step.
 */
export default async function InternshipSettingsPage() {
  const settings = await getInternshipSettings();

  return (
    <main className="max-w-[900px] mx-auto px-6 lg:px-8 py-8">
      <Link
        href="/admin/internship"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Applications
      </Link>

      <div className="mb-6">
        <h1 className="text-[26px] md:text-[30px] font-bold text-ink tracking-tight">Automation Settings</h1>
        <p className="text-[15px] text-ink-3 mt-1">
          Set the rules and defaults for the internship pipeline. Applied everywhere, automatically.
        </p>
      </div>

      <InternshipSettingsForm initial={settings} />
    </main>
  );
}
