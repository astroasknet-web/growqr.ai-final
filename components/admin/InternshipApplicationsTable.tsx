"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Download, X, Loader2, Trash2, Clock, SlidersHorizontal } from "lucide-react";
import GrowqrAvatar from "./GrowqrAvatar";
import InternshipStatusDropdown from "./InternshipStatusDropdown";
import { INTERNSHIP_STATUS_CONFIG, type InternshipStatus } from "./InternshipStatusBadge";
import { FILTERABLE_ROLES, isLegacyRole, AVAILABILITY_OPTIONS, AVAILABILITY_LABEL, MODE_OPTIONS, DURATION_OPTIONS } from "@/lib/internship-options";
import { TRIAGE_BANDS, TRIAGE_CONFIG, RQ_SHORTLIST_THRESHOLD, type TriageBand } from "@/lib/internship/triage";

export interface Application {
  id: string;
  full_name: string;
  email: string;
  college: string;
  course: string;
  preferred_role: string;
  availability: string;
  status: string;
  created_at: string;
  growqr_user_id: string | null;
  growqr_profile_url: string | null;
  growqr_avatar_url: string | null;
  growqr_rq_score: number | null;
  triage: string | null;
  triage_score: number | null;
}

export interface ApiResponse {
  data: Application[];
  count: number;
  page: number;
  totalPages: number;
}

const LIMIT = 10;

const SELECT_CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/** One definition of a filter dropdown, instead of six copies of the chrome. */
function FilterSelect({
  value, onChange, placeholder, options, full = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  full?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`pl-3 pr-8 py-2 rounded-lg border text-[14px] bg-white outline-none focus:ring-2 focus:ring-orange/20 cursor-pointer appearance-none transition-colors ${
        full ? "w-full" : "max-w-[170px]"
      } ${value ? "border-orange/40 text-ink font-medium" : "border-black/[0.08] text-ink-2"}`}
      style={{ backgroundImage: SELECT_CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-[12px] font-semibold text-ink-3 uppercase tracking-widest border-b border-black/[0.1] whitespace-nowrap first:pl-5 ${className}`}>
      {children}
    </th>
  );
}

/** Triage band as a pill. Renders a dash for a row that predates banding. */
function TriageChip({ triage }: { triage: string | null }) {
  const cfg = TRIAGE_CONFIG[triage as TriageBand];
  if (!cfg) return <span className="text-[14px] text-ink-4">&mdash;</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/**
 * The score with a bar underneath. A bare number gives no sense of scale;
 * the bar makes "is this a good score" readable at a glance, tinted by the
 * band the number produced so the two columns visibly agree.
 */
function RqScore({ score, triage, href }: { score: number | null; triage: string | null; href: string | null }) {
  if (score === null) return <span className="text-[14px] text-ink-4">&mdash;</span>;
  const cfg = TRIAGE_CONFIG[triage as TriageBand];
  const pct = Math.max(0, Math.min(100, score));
  const inner = (
    <>
      <span className="text-[15px] font-bold text-ink tabular-nums leading-none">{score}</span>
      <span className="block mt-1.5 h-1 w-11 rounded-full bg-black/[0.07] overflow-hidden">
        <span className={`block h-full rounded-full ${cfg?.color ?? "bg-orange"}`} style={{ width: `${pct}%` }} />
      </span>
    </>
  );
  if (!href) return <span className="inline-block">{inner}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      title="Open GrowQR profile"
      className="inline-block hover:opacity-70 transition-opacity"
    >
      {inner}
    </a>
  );
}

/**
 * `initialData` is the first page, already fetched on the server and rendered
 * into the HTML. Adopting it means the table paints real rows immediately
 * instead of mounting empty and spending a round trip re-fetching exactly the
 * same query. It is null only when that server-side read failed, in which case
 * the table fetches for itself as before.
 */
export default function InternshipApplicationsTable({
  initialData = null,
  triageCounts = null,
}: {
  initialData?: ApiResponse | null;
  /**
   * Band → count for the clickable summary pills above the toolbar.
   * Server-supplied so they paint with the first HTML rather than after a round
   * trip, same reasoning as `initialData`. Null when that read failed, in which
   * case the pills are simply not rendered.
   */
  triageCounts?: Record<string, number> | null;
} = {}) {
  const router = useRouter();
  const [data, setData] = useState<Application[]>(initialData?.data ?? []);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [count, setCount] = useState(initialData?.count ?? 0);
  const [loading, setLoading] = useState(initialData === null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [triageFilter, setTriageFilter] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (!moreOpen) return;
    function onDown(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

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
        ...(roleFilter && { role: roleFilter }),
        ...(availabilityFilter && { availability: availabilityFilter }),
        ...(modeFilter && { mode: modeFilter }),
        ...(durationFilter && { duration: durationFilter }),
        ...(triageFilter && { triage: triageFilter }),
      });
      const res = await fetch(`/api/admin/internship-applications?${params}`);
      const json: ApiResponse = await res.json();
      setData(json.data ?? []);
      setTotalPages(json.totalPages ?? 1);
      setCount(json.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, statusFilter, roleFilter, availabilityFilter, modeFilter, durationFilter, triageFilter]);

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
      const res = await fetch(`/api/admin/internship-applications?id=${id}`, {
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
      if (roleFilter) params.append("role", roleFilter);
      if (availabilityFilter) params.append("availability", availabilityFilter);
      if (modeFilter) params.append("mode", modeFilter);
      if (durationFilter) params.append("duration", durationFilter);
      if (triageFilter) params.append("triage", triageFilter);

      const res = await fetch(`/api/admin/internship-applications/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internship_applications_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  function handleStatusUpdate(id: string, newStatus: string) {
    setData((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    const label = INTERNSHIP_STATUS_CONFIG[newStatus as InternshipStatus]?.label ?? newStatus;
    setToast(`Status updated to ${label}`);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  }

  function formatDate(iso: string) {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  const activeFilters = [
    statusFilter && {
      key: "status", label: "Status",
      value: INTERNSHIP_STATUS_CONFIG[statusFilter as InternshipStatus]?.label ?? statusFilter,
      clear: () => { setStatusFilter(""); setPage(1); },
    },
    roleFilter && {
      key: "role", label: "Role", value: roleFilter,
      clear: () => { setRoleFilter(""); setPage(1); },
    },
    triageFilter && {
      key: "triage", label: "Triage",
      value: TRIAGE_CONFIG[triageFilter as TriageBand]?.label ?? triageFilter,
      clear: () => { setTriageFilter(""); setPage(1); },
    },
    availabilityFilter && {
      key: "availability", label: "Availability",
      value: AVAILABILITY_LABEL[availabilityFilter] ?? availabilityFilter,
      clear: () => { setAvailabilityFilter(""); setPage(1); },
    },
    modeFilter && {
      key: "mode", label: "Mode",
      value: MODE_OPTIONS.find((o) => o.value === modeFilter)?.label ?? modeFilter,
      clear: () => { setModeFilter(""); setPage(1); },
    },
    durationFilter && {
      key: "duration", label: "Duration",
      value: DURATION_OPTIONS.find((o) => o.value === durationFilter)?.label ?? durationFilter,
      clear: () => { setDurationFilter(""); setPage(1); },
    },
  ].filter(Boolean) as { key: string; label: string; value: string; clear: () => void }[];

  /** Only the three behind the "More" popover, which is what its badge counts. */
  const moreCount = [availabilityFilter, modeFilter, durationFilter].filter(Boolean).length;

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("");
    setRoleFilter("");
    setTriageFilter("");
    setAvailabilityFilter("");
    setModeFilter("");
    setDurationFilter("");
    setPage(1);
  }

  const hasFilters = Boolean(
    debouncedSearch || statusFilter || roleFilter || availabilityFilter ||
    modeFilter || durationFilter || triageFilter,
  );

  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, count);

  return (
    <>
    <style>{`
      @keyframes fadeRow { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .row-fade { animation: fadeRow 0.22s ease both; }
      .toast-in  { animation: toastIn  0.25s cubic-bezier(0.22,1,0.36,1) both; }
      .touch-button { min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
    `}</style>

    {toast && (
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 toast-in">
        <div className="flex items-center gap-2.5 bg-ink text-white text-[13px] sm:text-[14px] font-medium px-4 py-3 rounded-lg shadow-lg whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          {toast}
        </div>
      </div>
    )}

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

    {triageCounts && (
      <div className="bg-white rounded-xl border border-black/[0.1] shadow-card px-4 sm:px-5 py-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-3 gap-y-1 mb-3">
          <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest">Automatic triage</p>
          <p className="text-[13px] text-ink-4">
            Assigned from the RQ-Score at submit. {RQ_SHORTLIST_THRESHOLD} and above auto-shortlists.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRIAGE_BANDS.map((band) => {
            const cfg = TRIAGE_CONFIG[band];
            const active = triageFilter === band;
            return (
              <button
                key={band}
                onClick={() => { setTriageFilter(active ? "" : band); setPage(1); }}
                aria-pressed={active}
                title={cfg.hint}
                className={`inline-flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-[14px] transition-all ${
                  active
                    ? `${cfg.bg} ${cfg.text} border-black/[0.12] shadow-card`
                    : "bg-white text-ink-2 border-black/[0.08] hover:bg-cream/50"
                }`}
              >
                <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${cfg.dot}`} />
                <span className="font-medium">{cfg.label}</span>
                <span className="font-bold tabular-nums">{triageCounts[band] ?? 0}</span>
              </button>
            );
          })}
          {triageFilter && (
            <button
              onClick={() => { setTriageFilter(""); setPage(1); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-ink-3 hover:text-ink transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    )}

    <div className="bg-white rounded-xl border border-black/[0.1] overflow-visible shadow-card">
      {/* Toolbar. Search and the two filters HR actually reaches for stay
          inline; availability, mode and duration live behind "More" with a
          count badge, because five permanently-open dropdowns cost two rows of
          vertical space to answer a question nobody was asking. Whatever IS
          applied stays visible as removable chips underneath, so collapsing the
          rarely-used filters never hides state. */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-black/[0.1]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-[380px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-ink-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, college…"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink bg-cream/20 outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/40 focus:bg-white transition-all placeholder:text-ink-5"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-4 hover:text-ink transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            placeholder="All Status"
            options={Object.entries(INTERNSHIP_STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
          />

          <FilterSelect
            value={roleFilter}
            onChange={(v) => { setRoleFilter(v); setPage(1); }}
            placeholder="All Roles"
            options={FILTERABLE_ROLES.map((r) => ({ value: r, label: isLegacyRole(r) ? `${r} (retired)` : r }))}
          />

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[14px] transition-colors whitespace-nowrap ${
                moreCount > 0
                  ? "border-orange/40 bg-orange-lighter text-orange"
                  : "border-black/[0.08] bg-white text-ink-2 hover:bg-cream/50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              More
              {moreCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-white text-[11px] font-bold">
                  {moreCount}
                </span>
              )}
            </button>

            {moreOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-[260px] p-3 space-y-3 bg-white border border-black/[0.1] rounded-xl shadow-[0_6px_32px_rgba(0,0,0,0.12)]">
                <div>
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider mb-1.5">Availability</p>
                  <FilterSelect
                    value={availabilityFilter}
                    onChange={(v) => { setAvailabilityFilter(v); setPage(1); }}
                    placeholder="Any availability"
                    options={AVAILABILITY_OPTIONS}
                    full
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider mb-1.5">Mode</p>
                  <FilterSelect
                    value={modeFilter}
                    onChange={(v) => { setModeFilter(v); setPage(1); }}
                    placeholder="Any mode"
                    options={MODE_OPTIONS}
                    full
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider mb-1.5">Duration</p>
                  <FilterSelect
                    value={durationFilter}
                    onChange={(v) => { setDurationFilter(v); setPage(1); }}
                    placeholder="Any duration"
                    options={DURATION_OPTIONS}
                    full
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setSort((s) => s === "desc" ? "asc" : "desc"); setPage(1); }}
              title={sort === "desc" ? "Newest first" : "Oldest first"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink-2 bg-white hover:bg-cream/50 transition-colors whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{sort === "desc" ? "Newest" : "Oldest"}</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/[0.08] text-[14px] text-ink-2 bg-white hover:bg-cream/50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-black/[0.06]">
            <span className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider">Filtered by</span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.clear}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-cream border border-black/[0.08] text-[13px] text-ink-2 hover:bg-cream-2 transition-colors"
                title={`Remove ${f.label} filter`}
              >
                <span className="text-ink-4">{f.label}:</span>
                <span className="font-medium">{f.value}</span>
                <X className="w-3 h-3 text-ink-4" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[13px] font-semibold text-orange hover:text-orange-dark transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {!isMobile ? (
        <div className="overflow-x-auto">
          {/* Fixed layout with explicit widths. Auto layout let one long value
              (a three-word role, a long college) starve every other column and
              wrap the header labels, which is what made this table unreadable. */}
          <table className="w-full table-fixed min-w-[1080px]">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[19%]" />
              <col className="w-[16%]" />
              <col className="w-[96px]" />
              <col className="w-[140px]" />
              <col className="w-[136px]" />
              <col className="w-[116px]" />
              <col className="w-[76px]" />
            </colgroup>
            <thead>
              <tr className="bg-cream">
                <Th>Applicant</Th>
                <Th className="hidden md:table-cell">College</Th>
                <Th className="hidden lg:table-cell">Role</Th>
                <Th className="hidden lg:table-cell">RQ-Score</Th>
                <Th className="hidden xl:table-cell">Triage</Th>
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Applied</Th>
                <th className="px-4 py-3 border-b border-black/[0.1]" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i} className="border-b border-black/[0.08]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cream-2 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-cream-2 rounded-full animate-pulse w-2/3" />
                          <div className="h-3 bg-cream-2 rounded-full animate-pulse w-4/5" />
                        </div>
                      </div>
                    </td>
                    {[70, 60, 40, 70, 60, 60].map((w, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3.5 bg-cream-2 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                      </td>
                    ))}
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center text-[14px] text-ink-3">
                    {hasFilters ? "No applications match your filters." : "No applications yet."}
                  </td>
                </tr>
              ) : (
                data.map((app, i) => (
                  <tr
                    key={app.id}
                    className="row-fade border-b border-black/[0.08] hover:bg-cream/70 transition-colors cursor-pointer group align-middle"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => router.push(`/admin/internship/${app.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <GrowqrAvatar userId={app.growqr_user_id} avatarUrl={app.growqr_avatar_url} name={app.full_name} size={40} />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-ink truncate">{app.full_name}</p>
                          <p className="text-[13px] text-ink-3 truncate">{app.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-[14px] text-ink-2 truncate" title={app.college}>{app.college}</p>
                      {app.course && (
                        <p className="text-[13px] text-ink-4 truncate" title={app.course}>{app.course}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-[14px] text-ink-2 truncate" title={app.preferred_role}>{app.preferred_role}</p>
                      {app.availability && (
                        <p className="text-[13px] text-ink-4 truncate">
                          {AVAILABILITY_LABEL[app.availability] ?? app.availability}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <RqScore score={app.growqr_rq_score} triage={app.triage} href={app.growqr_profile_url} />
                    </td>

                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <TriageChip triage={app.triage} />
                    </td>

                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <InternshipStatusDropdown
                        applicationId={app.id}
                        currentStatus={app.status}
                        onUpdate={(s) => handleStatusUpdate(app.id, s)}
                      />
                    </td>

                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-[14px] text-ink-3 whitespace-nowrap">{formatDate(app.created_at)}</p>
                    </td>

                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {/* The whole row already navigates, so there is no second
                          "open" button here. Only delete, and it stays quiet
                          until the row is hovered so it cannot be hit by accident. */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deletingId === app.id}
                          className="p-2 rounded-lg text-ink-4 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                          title="Delete application"
                          aria-label={`Delete ${app.full_name}`}
                        >
                          {deletingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <ChevronRight className="w-4 h-4 text-ink-5 group-hover:text-orange transition-colors shrink-0" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.08]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-cream-2 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cream-2 rounded-full animate-pulse w-3/4" />
                  <div className="h-3 bg-cream-2 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="px-4 py-16 text-center text-[14px] text-ink-3">
              {hasFilters ? "No applications match your filters." : "No applications yet."}
            </div>
          ) : (
            data.map((app, i) => (
              <div
                key={app.id}
                className="row-fade p-4 active:bg-cream transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => router.push(`/admin/internship/${app.id}`)}
                    className="flex items-start gap-3 flex-1 text-left min-w-0"
                  >
                    <GrowqrAvatar userId={app.growqr_user_id} avatarUrl={app.growqr_avatar_url} name={app.full_name} size={44} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink truncate">{app.full_name}</p>
                      <p className="text-[13px] text-ink-3 truncate">{app.email}</p>
                      <p className="text-[13px] text-ink-4 truncate mt-0.5">{app.preferred_role}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deletingId === app.id}
                    className="p-2 -mr-1 text-ink-4 hover:text-red-600 transition-colors disabled:opacity-40 shrink-0"
                    aria-label={`Delete ${app.full_name}`}
                  >
                    {deletingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pl-[56px]">
                  <TriageChip triage={app.triage} />
                  {app.growqr_rq_score !== null && (
                    <span className="text-[12px] font-semibold text-orange tabular-nums">RQ {app.growqr_rq_score}</span>
                  )}
                  <span className="text-[12px] text-ink-4">{formatDate(app.created_at)}</span>
                  <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
                    <InternshipStatusDropdown
                      applicationId={app.id}
                      currentStatus={app.status}
                      onUpdate={(s) => handleStatusUpdate(app.id, s)}
                    />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
