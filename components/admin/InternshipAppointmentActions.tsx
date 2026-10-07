"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, X, ExternalLink } from "lucide-react";

/**
 * Prepare and issue the internship appointment letter.
 *
 * The letter itself says nothing about pay, and there is deliberately no
 * stipend or salary field here to fill in. HR enters the role particulars, can
 * preview the exact PDF, and sends it to the candidate. Sending stamps the
 * issue date; it does not move the application status, which stays a separate
 * human step.
 */

/**
 * Suggested letter reference, matching the server's scheme in
 * app/api/admin/internship-appointment/route.ts so a kept default and a
 * server-filled one are identical. HR can still overwrite it.
 */
function defaultReferenceNo(applicationId: string): string {
  const year = new Date().getFullYear();
  const tail = applicationId.replace(/-/g, "").slice(-4).toUpperCase();
  return `GQR/INT/${year}/${tail}`;
}

export interface AppointmentDraft {
  referenceNo: string;
  designation: string;
  department: string;
  startDate: string;
  endDate: string;
  duration: string;
  reportingManager: string;
  location: string;
  signatoryName: string;
  signatoryTitle: string;
}

export default function InternshipAppointmentActions({
  applicationId,
  draft,
  issued,
}: {
  applicationId: string;
  draft: AppointmentDraft;
  issued: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "send" | "preview">(null);
  const [error, setError] = useState<string | null>(null);
  // Pre-fill the reference number with the suggested value so HR sees it rather
  // than an empty placeholder. Still fully editable.
  const withDefaults: AppointmentDraft = {
    ...draft,
    referenceNo: draft.referenceNo || defaultReferenceNo(applicationId),
  };
  const [form, setForm] = useState<AppointmentDraft>(withDefaults);

  function set<K extends keyof AppointmentDraft>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function post(action: "save" | "send") {
    const res = await fetch("/api/admin/internship-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, action, ...form }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Something went wrong. Try again.");
    return json as { referenceNo?: string };
  }

  async function onSave() {
    setBusy("save");
    setError(null);
    try {
      await post("save");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function onPreview() {
    setBusy("preview");
    setError(null);
    try {
      // Save first so the preview reflects exactly what is on the form.
      await post("save");
      window.open(`/api/admin/internship-appointment?applicationId=${applicationId}`, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not preview.");
    } finally {
      setBusy(null);
    }
  }

  async function onSend() {
    if (!window.confirm("Email the appointment letter to the candidate now?")) return;
    setBusy("send");
    setError(null);
    try {
      await post("send");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setBusy(null);
    }
  }

  const field = "w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all placeholder:text-ink-5";
  const label = "block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5";

  return (
    <>
      <button
        onClick={() => { setForm(withDefaults); setOpen(true); setError(null); }}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ink text-white text-[13px] font-semibold hover:bg-ink/90 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        {issued ? "Edit or resend letter" : "Prepare appointment letter"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => busy || setOpen(false)}>
          <div
            className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-black/[0.1] shadow-[0_12px_48px_rgba(0,0,0,0.18)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <h3 className="text-[17px] font-bold text-ink">Appointment letter</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-ink-4 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-ink-4 mb-5 leading-relaxed">
              The letter states no stipend, salary or compensation. Fill the role particulars only.
            </p>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Designation</label>
                  <input className={field} value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Technology Intern" />
                </div>
                <div>
                  <label className={label}>Department</label>
                  <input className={field} value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Engineering" />
                </div>
                <div>
                  <label className={label}>Start date</label>
                  <input type="date" className={field} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div>
                  <label className={label}>End date</label>
                  <input type="date" className={field} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
                <div>
                  <label className={label}>Duration</label>
                  <input className={field} value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="6 months" />
                </div>
                <div>
                  <label className={label}>Work location</label>
                  <input className={field} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Remote" />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Reporting manager</label>
                  <input className={field} value={form.reportingManager} onChange={(e) => set("reportingManager", e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className={label}>Signatory name</label>
                  <input className={field} value={form.signatoryName} onChange={(e) => set("signatoryName", e.target.value)} placeholder="Head of HR" />
                </div>
                <div>
                  <label className={label}>Signatory title</label>
                  <input className={field} value={form.signatoryTitle} onChange={(e) => set("signatoryTitle", e.target.value)} placeholder="Head of HR" />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Reference number</label>
                  <input className={field} value={form.referenceNo} onChange={(e) => set("referenceNo", e.target.value)} placeholder="Auto (GQR/INT/2026/…)" />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 mt-6">
              <button
                onClick={onPreview}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/[0.12] text-[14px] font-medium text-ink-2 hover:bg-cream/50 transition-colors disabled:opacity-40"
              >
                {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                Preview
              </button>
              <button
                onClick={onSave}
                disabled={busy !== null}
                className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-ink-3 hover:text-ink transition-colors disabled:opacity-40"
              >
                {busy === "save" ? "Saving…" : "Save"}
              </button>
              <button
                onClick={onSend}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-white text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-40"
              >
                {busy === "send" && <Loader2 className="w-4 h-4 animate-spin" />}
                Send to candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
