export const dynamic = "force-dynamic";

import StatsCards from "@/components/admin/StatsCards";
import ApplicationsTableMobile, {
  type Application as AmbassadorRow,
} from "@/components/admin/ApplicationsTableMobile";
import DataUnavailableNotice from "@/components/admin/DataUnavailableNotice";
import { getAmbassadorStats } from "@/lib/admin/stats";
import {
  fetchAmbassadorPage,
  DEFAULT_PAGE_SIZE,
  type ListResult,
} from "@/lib/admin/applications-query";

export default async function AmbassadorDashboard() {
  // Both reads start together, and the first page of rows is rendered into the
  // HTML rather than fetched again by the table after it mounts. That removes a
  // whole client-to-server-to-database round trip from every visit to this tab.
  const [statsResult, firstPage] = await Promise.all([
    getAmbassadorStats(),
    fetchAmbassadorPage<AmbassadorRow>({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      search: "",
      status: "",
      cohort: "",
      sort: "desc",
    }).catch((err) => {
      // Not fatal: the table falls back to fetching for itself.
      console.error("Ambassador first page prefetch failed:", err);
      return null as ListResult<AmbassadorRow> | null;
    }),
  ]);

  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-6">
      <div>
        <h1 className="text-[30px] md:text-[34px] lg:text-[36px] font-bold text-ink tracking-tight">Ambassador Applications</h1>
        <p className="text-[16px] md:text-[17px] text-ink-3 mt-1">Review and manage campus ambassador applications</p>
      </div>

      {!statsResult.ok && <DataUnavailableNotice what="the application totals" />}

      <StatsCards stats={statsResult.stats} />
      <ApplicationsTableMobile initialData={firstPage} />
    </main>
  );
}
