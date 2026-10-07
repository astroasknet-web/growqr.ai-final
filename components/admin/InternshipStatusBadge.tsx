export type InternshipStatus =
  | "new"
  | "screening"
  | "shortlisted"
  | "interview"
  | "selected"
  | "waitlist"
  | "offer"
  | "joined"
  | "rejected";

export const INTERNSHIP_STATUSES = [
  "new", "screening", "shortlisted", "interview",
  "selected", "waitlist", "offer", "joined", "rejected",
] as const;

export const INTERNSHIP_STATUS_CONFIG: Record<InternshipStatus, { label: string; color: string; bg: string; text: string; dot: string }> = {
  new:         { label: "New",         color: "bg-slate-400",   bg: "bg-slate-100",   text: "text-slate-800",   dot: "bg-slate-400" },
  screening:   { label: "Screening",   color: "bg-amber-500",   bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  shortlisted: { label: "Shortlisted", color: "bg-cyan-500",    bg: "bg-cyan-100",    text: "text-cyan-800",    dot: "bg-cyan-500" },
  interview:   { label: "Interview",   color: "bg-violet-500",  bg: "bg-violet-100",  text: "text-violet-800",  dot: "bg-violet-500" },
  selected:    { label: "Selected",    color: "bg-green-500",   bg: "bg-green-100",   text: "text-green-800",   dot: "bg-green-500" },
  waitlist:    { label: "Waitlist",    color: "bg-yellow-500",  bg: "bg-yellow-100",  text: "text-yellow-800",  dot: "bg-yellow-500" },
  offer:       { label: "Offer",       color: "bg-blue-500",    bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500" },
  joined:      { label: "Joined",      color: "bg-emerald-600", bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-600" },
  rejected:    { label: "Rejected",    color: "bg-red-500",     bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500" },
};

export default function InternshipStatusBadge({ status }: { status: string }) {
  const cfg = INTERNSHIP_STATUS_CONFIG[status as InternshipStatus] ?? INTERNSHIP_STATUS_CONFIG.new;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${cfg.color}`} />
      <span className="text-[13px] font-medium text-ink-2 leading-none">{cfg.label}</span>
    </span>
  );
}
