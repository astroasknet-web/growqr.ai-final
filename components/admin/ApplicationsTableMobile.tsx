"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CheckCircle2, Download, Calendar, X, Loader2, Trash2, Clock } from "lucide-react";
import StatusDropdown from "./StatusDropdownV2";
import { STATUS_CONFIG, type AppStatus } from "./StatusBadge";
import QuickAddModal from "./QuickAddModal";
import { COHORTS, cohortLabel } from "@/lib/cohorts";

export interface Application {
  id: string;
  full_name: string;
  email: string;
  college: string;
  course: string;
  passing_year: string;
  status: string;
  created_at: string;
}

export interface ApiResponse {
  data: Application[];
  count: number;
  page: number;
  totalPages: number;
}

const LIMIT = 10;

/**
 * `initialData` is the first page, already fetched on the server and rendered
 * into the HTML. Adopting it means the table paints real rows immediately
 * instead of mounting empty and spending a round trip re-fetching exactly the
 * same query. It is null only when that server-side read failed, in which case
 * the table fetches for itself as before.
 */
export default function ApplicationsTable({
  initialData = null,
}: {
  initialData?: ApiResponse | null;
} = {}) {
  const router = useRouter();
  const [data, setData] = useState<Application[]>(initialData?.data ?? []);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [count, setCount] = useState(initialData?.count ?? 0);
  const [loading, setLoading] = useState(initialData === null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Date Range for Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(cohortFilter && { cohort: cohortFilter }),
      });
      const res = await fetch(`/api/admin/applications?${params}`);
      const json: ApiResponse = await res.json();
      setData(json.data ?? []);
      setTotalPages(json.totalPages ?? 1);
      setCount(json.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, statusFilter, cohortFilter]);

  // Skip exactly one fetch: the very first effect run, when the filters are
  // still the defaults the server already rendered. Any later run — a filter,
  // a search, a page change, or a re-created fetchData — goes to the network
  // as normal.
  const skipFirstFetch = useRef(initialData !== null);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/applications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setData((prev) => prev.filter((a) => a.id !== id));
        setCount((c) => c - 1);
        setToast("Application deleted successfully");
        if (toastRef.current) clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast(null), 2800);
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("start", dateRange.start);
      if (dateRange.end) params.append("end", dateRange.end);
      if (statusFilter) params.append("status", statusFilter);
      if (cohortFilter) params.append("cohort", cohortFilter);

      const res = await fetch(`/api/admin/applications/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ambassador_applications_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  function handleStatusUpdate(id: string, newStatus: string) {
    setData((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    const label = STATUS_CONFIG[newStatus as AppStatus]?.label ?? newStatus;
    setToast(`Status updated to ${label}`);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  }

  function formatDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, count);

  return (
    <>
    <style>{`
      @keyframes fadeRow { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(0.97); } }
      .row-fade { animation: fadeRow 0.22s ease both; }
      .toast-in  { animation: toastIn  0.25s cubic-bezier(0.22,1,0.36,1) both; }
      .toast-out { animation: toastOut 0.2s ease both; }
      .touch-button { min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
    `}</style>

    {/* Toast */}
    {toast && (
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 toast-in">
        <div className="flex items-center gap-2.5 bg-ink text-white text-[13px] sm:text-[14px] font-medium px-4 py-3 rounded-lg shadow-lg whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          {toast}
        </div>
      </div>
    )}

    {/* Export Modal */}
    {showExportModal && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl border border-black/[0.1] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-ink">Export Applications</h3>
            <button onClick={() => setShowExportModal(false)} className="text-ink-4 hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-black/[0.1] outline-none focus:ring-2 focus:ring-orange/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-black/[0.1] outline-none focus:ring-2 focus:ring-orange/20"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-2.5 bg-ink text-white rounded-lg font-semibold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Download CSV</>}
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="bg-white rounded-xl border border-black/[0.1] overflow-visible shadow-card">
      <div className="px-4 sm:px-5 py-4 border-b border-black/[0.1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Side: Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full md:w-64 lg:w-80 transition-all duration-300 focus-within:md:w-72 lg:focus-within:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-ink-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates…"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink bg-cream/20 outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/40 focus:bg-white transition-all placeholder:text-ink-5"
              />
            </div>

            <select
              value={cohortFilter}
              onChange={(e) => { setCohortFilter(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/20 cursor-pointer appearance-none min-w-[130px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="">All Cohorts</option>
              {COHORTS.map((c) => (
                <option key={c} value={c}>{cohortLabel(c)}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/20 cursor-pointer appearance-none min-w-[130px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <button
              onClick={() => { setSort((s) => s === "desc" ? "asc" : "desc"); setPage(1); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/[0.08] text-[13px] font-medium text-ink-3 bg-white hover:bg-cream/50 transition-colors whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{sort === "desc" ? "Sort: Newest" : "Sort: Oldest"}</span>
            </button>
          </div>

          {/* Right Side: Primary Actions */}
          <div className="flex items-center gap-2.5 sm:ml-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink-3 bg-white hover:bg-cream/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Export</span>
            </button>
            <div className="h-6 w-px bg-black/[0.08] mx-1 hidden sm:block" />
            <QuickAddModal onSuccess={() => fetchData()} />
          </div>
        </div>
      </div>

      {/* Table for desktop, Card view for mobile */}
      {!isMobile ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cream">
                <th className="text-left px-5 py-3 text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1]">Applicant</th>
                <th className="text-left px-5 py-3 text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1] hidden md:table-cell">College</th>
                <th className="text-left px-5 py-3 text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1] hidden lg:table-cell">Course</th>
                <th className="text-left px-5 py-3 text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1]">Status</th>
                <th className="text-left px-5 py-3 text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1] hidden sm:table-cell">Applied</th>
                <th className="px-5 py-3 border-b border-black/[0.1]" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i} className="border-b border-black/[0.08]">
                    {[260, 200, 140, 110, 80].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-cream-2 rounded-full animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-[14px] text-ink-3">
                    {debouncedSearch || statusFilter || cohortFilter ? "No applications match your filters." : "No applications yet."}
                  </td>
                </tr>
              ) : (
                data.map((app, i) => (
                  <tr
                    key={app.id}
                    className="row-fade border-b border-black/[0.08] hover:bg-cream transition-colors cursor-pointer group"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => router.push(`/admin/ambassador/${app.id}`)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-[15px] md:text-[16px] font-semibold text-ink">{app.full_name}</p>
                      <p className="text-[14px] md:text-[15px] text-ink-3 mt-0.5">{app.email}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-[14px] md:text-[15px] text-ink-2 max-w-[220px] truncate">{app.college}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-[14px] md:text-[15px] text-ink-2">{app.course}</p>
                      {app.passing_year && (
                        <p className="text-[13px] md:text-[14px] text-ink-3 mt-0.5">Batch of {app.passing_year}</p>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        applicationId={app.id}
                        currentStatus={app.status}
                        onUpdate={(s) => handleStatusUpdate(app.id, s)}
                      />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-[14px] md:text-[15px] text-ink-3 whitespace-nowrap">{formatDate(app.created_at)}</p>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deletingId === app.id}
                          className="p-2 text-ink-4 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Delete application"
                        >
                          {deletingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/ambassador/${app.id}`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-orange/40 bg-orange/10 text-orange hover:bg-orange hover:text-white hover:border-orange transition-colors text-[13px] font-bold touch-button"
                          aria-label="View details"
                        >
                          →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile Card View
        <div className="divide-y divide-black/[0.08]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 bg-cream-2 rounded-full animate-pulse w-3/4" />
                <div className="h-3 bg-cream-2 rounded-full animate-pulse w-1/2" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="px-4 py-16 text-center text-[14px] text-ink-3">
              {debouncedSearch || statusFilter || cohortFilter ? "No applications match your filters." : "No applications yet."}
            </div>
          ) : (
            data.map((app, i) => (
              <div
                key={app.id}
                className="row-fade p-4 active:bg-cream transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => router.push(`/admin/ambassador/${app.id}`)}
                    className="flex-1 text-left"
                  >
                    <p className="text-[15px] font-semibold text-ink">{app.full_name}</p>
                    <p className="text-[13px] text-ink-3 mt-1">{app.email}</p>
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deletingId === app.id}
                    className="p-2 text-ink-4 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    {deletingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/admin/ambassador/${app.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2 mt-3 text-[13px]">
                    <p className="text-ink-3">{app.college}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        applicationId={app.id}
                        currentStatus={app.status}
                        onUpdate={(s) => handleStatusUpdate(app.id, s)}
                      />
                    </div>
                  </div>
                  <p className="text-[12px] text-ink-4 mt-2">{formatDate(app.created_at)}</p>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="px-4 sm:px-5 py-3 border-t border-black/[0.1] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] sm:text-[14px] text-ink-3 order-last sm:order-first">
            {count === 0 ? "0 results" : `${start}–${end} of ${count}`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[12px] sm:text-[13px] text-ink-3 hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-black/[0.1] touch-button"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-0.5 mx-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[12px] sm:text-[13px] font-medium transition-colors touch-button ${
                        p === page
                          ? "bg-orange text-white"
                          : "text-ink-3 hover:bg-cream border border-black/[0.1]"
                      }`}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[12px] sm:text-[13px] text-ink-3 hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-black/[0.1] touch-button"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
