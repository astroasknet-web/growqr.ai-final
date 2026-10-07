import { STATUS_CONFIG, type AppStatus } from "./StatusBadge";

export default function StatusBadgeServer({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as AppStatus] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
