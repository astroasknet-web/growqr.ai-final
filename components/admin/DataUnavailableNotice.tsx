import { AlertTriangle } from "lucide-react";

/**
 * Shown when a dashboard read failed. The stat tiles previously fell back to
 * all-zeros on any error, which rendered a database outage as a confident
 * "there are no applications" — the one reading an admin must never be given
 * by mistake. Saying so explicitly is the point of this component.
 */
export default function DataUnavailableNotice({ what }: { what: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-[13.5px] leading-relaxed text-amber-900">
        <span className="font-semibold">Couldn&apos;t load {what}.</span>{" "}
        The numbers below may be incomplete or out of date. Reload the page to
        try again; nothing has been lost.
      </p>
    </div>
  );
}
