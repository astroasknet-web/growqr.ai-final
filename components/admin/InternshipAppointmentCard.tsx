import { FileText, CheckCircle2, ExternalLink } from "lucide-react";
import InternshipAppointmentActions, { type AppointmentDraft } from "./InternshipAppointmentActions";
import { getInternshipSettings } from "@/lib/internship/settings";
import type { Tables } from "@/types/database";

type Appointment = Tables<"internship_appointments">;

function formatDay(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Where HR issues the internship appointment letter, after the decision is made.
 *
 * Sits below the interview card, at the end of the pipeline: this is the last
 * step, and it is a letter, not a compensation offer. The card reads what has
 * been prepared and lets HR preview the exact PDF before it reaches the
 * candidate.
 */
export default async function InternshipAppointmentCard({
  applicationId,
  preferredRole,
  appointment,
}: {
  applicationId: string;
  preferredRole: string | null;
  appointment: Appointment | null;
}) {
  // Unsent letters pre-fill from the HR-set defaults; a saved letter keeps its
  // own values. So changing a default in settings flows into new letters without
  // rewriting ones already prepared.
  const settings = await getInternshipSettings();
  const draft: AppointmentDraft = {
    referenceNo: appointment?.reference_no ?? "",
    designation: appointment?.designation ?? preferredRole ?? "",
    department: appointment?.department ?? settings.defaultDepartment ?? "",
    startDate: appointment?.start_date ?? "",
    endDate: appointment?.end_date ?? "",
    duration: appointment?.duration ?? settings.defaultDuration,
    reportingManager: appointment?.reporting_manager ?? settings.defaultReportingManager,
    location: appointment?.location ?? settings.defaultLocation,
    signatoryName: appointment?.signatory_name ?? settings.defaultSignatoryName,
    signatoryTitle: appointment?.signatory_title ?? settings.defaultSignatoryTitle,
  };

  const issued = Boolean(appointment?.issued_at);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[15px] md:text-[16px] font-semibold text-ink">Appointment Letter</h2>
          <p className="text-[13px] text-ink-4 mt-0.5">
            The formal internship letter. States no stipend or salary.
          </p>
        </div>
        <InternshipAppointmentActions applicationId={applicationId} draft={draft} issued={issued} />
      </div>

      {!appointment ? (
        <div className="rounded-xl border border-dashed border-black/[0.12] bg-cream/30 px-5 py-8 text-center">
          <FileText className="w-6 h-6 text-ink-4 mx-auto mb-2.5" />
          <p className="text-[14px] font-medium text-ink-2">No letter prepared</p>
          <p className="text-[13px] text-ink-4 mt-1 max-w-[420px] mx-auto leading-relaxed">
            Fill in the role particulars to prepare the appointment letter, preview the PDF,
            and send it to the candidate.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-black/[0.1] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-cream/50 border-b border-black/[0.07]">
            <span className="text-[13px] font-semibold text-ink">{appointment.reference_no}</span>
            {issued ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Issued {formatDay(appointment.issued_at)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 bg-slate-100 text-slate-700">
                Draft, not sent
              </span>
            )}
          </div>

          <div className="px-4 py-4 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <Row label="Designation" value={appointment.designation} />
            <Row label="Department" value={appointment.department} />
            <Row label="Start date" value={formatDay(appointment.start_date)} />
            <Row label="End date" value={formatDay(appointment.end_date)} />
            <Row label="Duration" value={appointment.duration} />
            <Row label="Reporting manager" value={appointment.reporting_manager} />
            <Row label="Work location" value={appointment.location} />
          </div>

          <div className="px-4 pb-4">
            <a
              href={`/api/admin/internship-appointment?applicationId=${applicationId}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orange hover:underline"
            >
              View letter <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">{label}</p>
      <p className="text-[14px] text-ink-2 mt-0.5">{value}</p>
    </div>
  );
}
