import { INTERNSHIP_STATUS_CONFIG, type InternshipStatus } from "./InternshipStatusBadge";

export default function InternshipStatusBadgeServer({ status }: { status: string }) {
  const cfg = INTERNSHIP_STATUS_CONFIG[status as InternshipStatus] ?? INTERNSHIP_STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
