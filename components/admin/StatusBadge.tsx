export type AppStatus =
  | "pending"
  | "screening"
  | "interviewed"
  | "under_review"
  | "shortlisted"
  | "rejected";

export const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; text: string; dot: string }> = {
  pending:      { label: "Pending",      color: "bg-amber-400",   bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-400" },
  screening:    { label: "Screening",    color: "bg-violet-500",  bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  interviewed:  { label: "Interviewed",  color: "bg-orange-500",  bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  under_review: { label: "Reviewing",    color: "bg-blue-500",    bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  shortlisted:  { label: "Shortlisted",  color: "bg-cyan-500",    bg: "bg-cyan-100",   text: "text-cyan-800",   dot: "bg-cyan-500" },
  rejected:     { label: "Rejected",     color: "bg-red-500",     bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as AppStatus] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${cfg.color}`} />
      <span className="text-[13px] font-medium text-ink-2 leading-none">{cfg.label}</span>
    </span>
  );
}
