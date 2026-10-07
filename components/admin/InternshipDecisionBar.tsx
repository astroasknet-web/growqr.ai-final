import InternshipStatusDropdown from "./InternshipStatusDropdown";
import InternshipNotesEditor from "./InternshipNotesEditor";
import { TRIAGE_CONFIG, type TriageBand } from "@/lib/internship/triage";

/**
 * The two things HR actually does on a candidate, side by side and above
 * everything else: set the status, and write down why.
 *
 * They used to live in a narrow right sidebar, stacked, below the fold on a
 * laptop. The detail page is a decision surface, so the decision controls lead
 * it. Composes the existing dropdown and notes editor rather than reimplementing
 * either, so behaviour (optimistic update, autosave on blur, admin logging)
 * stays in one place.
 *
 * Not a client component itself: it only arranges two client children, so
 * keeping it on the server ships less JavaScript.
 */
export default function InternshipDecisionBar({
  applicationId,
  status,
  triage,
  triageScore,
  internalNotes,
}: {
  applicationId: string;
  status: string;
  triage: string | null;
  triageScore: number | null;
  internalNotes: string | null;
}) {
  const band = TRIAGE_CONFIG[triage as TriageBand];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[290px] shrink-0 space-y-4">
          <div>
            <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">Status</p>
            <div className="inline-flex items-center px-3.5 py-2.5 rounded-xl border border-black/[0.12] bg-white hover:border-black/20 transition-colors">
              <InternshipStatusDropdown applicationId={applicationId} currentStatus={status} />
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">Automatic triage</p>
            {band ? (
              <>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 ${band.bg} ${band.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
                  {band.label}
                </span>
                <p className="text-[13px] text-ink-4 mt-2 leading-relaxed">
                  {band.hint}
                  {triageScore !== null && ` Scored ${triageScore} at submit.`}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-4">
                Not banded. This application predates automatic triage.
              </p>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-px self-stretch bg-black/[0.07]" />

        <div className="flex-1 min-w-0">
          <InternshipNotesEditor
            applicationId={applicationId}
            initialNotes={internalNotes}
            rows={7}
          />
        </div>
      </div>
    </div>
  );
}
