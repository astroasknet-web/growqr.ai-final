export const dynamic = "force-dynamic";

import Link from "next/link";
import { Settings } from "lucide-react";
import InternshipStatsCards from "@/components/admin/InternshipStatsCards";
import InternshipApplicationsTable, {
  type Application as InternshipRow,
} from "@/components/admin/InternshipApplicationsTable";
import DataUnavailableNotice from "@/components/admin/DataUnavailableNotice";
import { getInternshipStats, getInternshipTriageStats } from "@/lib/admin/stats";
import {
  fetchInternshipPage,
  DEFAULT_PAGE_SIZE,
  type ListResult,
} from "@/lib/admin/applications-query";

export default async function InternshipDashboard() {
  const [statsResult, triageResult, firstPage] = await Promise.all([
    getInternshipStats(),
    getInternshipTriageStats(),
    fetchInternshipPage<InternshipRow>({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      search: "",
      status: "",
      role: "",
      availability: "",
      mode: "",
      duration: "",
      triage: "",
      sort: "desc",
    }).catch((err) => {
      console.error("Internship first page prefetch failed:", err);
      return null as ListResult<InternshipRow> | null;
    }),
  ]);

  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] md:text-[34px] lg:text-[36px] font-bold text-ink tracking-tight">Internship Applications</h1>
          <p className="text-[16px] md:text-[17px] text-ink-3 mt-1">Review and manage internship candidates</p>
        </div>
        <Link
          href="/admin/internship/settings"
          className="inline-flex shrink-0 items-center gap-2 px-3.5 py-2 rounded-xl border border-black/[0.12] text-[14px] font-medium text-ink-2 bg-white hover:bg-cream/50 transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>

      {!statsResult.ok && <DataUnavailableNotice what="the application totals" />}

      <InternshipStatsCards stats={statsResult.stats} />
      <InternshipApplicationsTable
        initialData={firstPage}
        triageCounts={triageResult.ok ? triageResult.stats : null}
      />
    </main>
  );
}
