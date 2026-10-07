"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ClipboardCheck,
  CalendarClock,
  FileText,
  Mail,
  Check,
  Loader2,
} from "lucide-react";
import { ROUND_TYPE_LABEL, ROUND_TYPES, type RoundType } from "@/lib/internship/interviews";
import { PREFERRED_ROLES } from "@/lib/internship-options";
import type { InternshipSettings } from "@/lib/internship/settings";

/**
 * The one place HR configures the internship pipeline. Set once, read by every
 * automatic step. No per-candidate data here: only the rules and the defaults.
 *
 * The form holds a single object mirroring InternshipSettings; a Save is a full
 * PUT, and the server returns the re-read config so what shows is always what
 * the database now holds. A sticky bar appears only when something changed.
 */

const field =
  "w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all placeholder:text-ink-5";
const label = "block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5";

export default function InternshipSettingsForm({ initial }: { initial: InternshipSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<InternshipSettings>(initial);
  const [saved, setSaved] = useState<InternshipSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  function set<K extends keyof InternshipSettings>(key: K, value: InternshipSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setJustSaved(false);
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/internship-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save.");
      const next = json.settings as InternshipSettings;
      setForm(next);
      setSaved(next);
      setJustSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Applications */}
      <Section
        icon={<UserPlus className="w-[18px] h-[18px]" />}
        title="When someone applies"
        subtitle="The first pass, the moment an application lands."
      >
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <NumberRow
            label="Auto-shortlist at RQ-Score"
            hint="At or above this score, the applicant is shortlisted automatically."
            value={form.shortlistMinRq}
            onChange={(v) => set("shortlistMinRq", v)}
            suffix="/ 100"
          />
        </div>
        <ToggleRow
          label="Assign the AI interview automatically"
          hint="A shortlisted applicant is invited to the assessment the moment they apply."
          checked={form.autoAssignEnabled}
          onChange={(v) => set("autoAssignEnabled", v)}
        />
        <RoundByRole
          value={form.interviewRoundByRole}
          onChange={(role, round) =>
            set("interviewRoundByRole", { ...form.interviewRoundByRole, [role]: round })
          }
        />
      </Section>

      {/* Interview scoring */}
      <Section
        icon={<ClipboardCheck className="w-[18px] h-[18px]" />}
        title="Interview scoring"
        subtitle="What happens once the AI interview result comes back."
      >
        <ToggleRow
          label="Move to Selected automatically"
          hint="When the AI interview passes the bar below, advance the candidate to Selected."
          checked={form.autoAdvanceEnabled}
          onChange={(v) => set("autoAdvanceEnabled", v)}
        />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mt-1">
          <NumberRow
            label="Passing score"
            hint="The interview score needed to advance."
            value={form.interviewPassScore}
            onChange={(v) => set("interviewPassScore", v)}
            suffix="/ 100"
            disabled={!form.autoAdvanceEnabled}
          />
        </div>
      </Section>

      {/* Final round */}
      <Section
        icon={<CalendarClock className="w-[18px] h-[18px]" />}
        title="One-on-one final round"
        subtitle="Pre-filled into every scheduling form. HR can still change it per candidate."
      >
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <TextRow
            label="Default interviewer"
            value={form.defaultInterviewerName ?? ""}
            onChange={(v) => set("defaultInterviewerName", v || null)}
            placeholder="Full name"
          />
          <TextRow
            label="Interviewer email"
            value={form.defaultInterviewerEmail ?? ""}
            onChange={(v) => set("defaultInterviewerEmail", v || null)}
            placeholder="name@growqr.ai"
            type="email"
          />
          <TextRow
            label="Calendar ID"
            hint="Leave blank to use the default internship calendar."
            value={form.finalRoundCalendarId ?? ""}
            onChange={(v) => set("finalRoundCalendarId", v || null)}
            placeholder="calendar-id@group.calendar.google.com"
            wide
          />
        </div>
      </Section>

      {/* Appointment letter */}
      <Section
        icon={<FileText className="w-[18px] h-[18px]" />}
        title="Appointment letter defaults"
        subtitle="Pre-filled into the letter. It never states stipend, salary or compensation."
      >
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <TextRow
            label="Department"
            value={form.defaultDepartment ?? ""}
            onChange={(v) => set("defaultDepartment", v || null)}
            placeholder="Engineering"
          />
          <TextRow
            label="Duration"
            value={form.defaultDuration}
            onChange={(v) => set("defaultDuration", v)}
            placeholder="6 months"
          />
          <TextRow
            label="Work location"
            value={form.defaultLocation}
            onChange={(v) => set("defaultLocation", v)}
            placeholder="Remote"
          />
          <TextRow
            label="Reporting manager"
            value={form.defaultReportingManager}
            onChange={(v) => set("defaultReportingManager", v)}
            placeholder="Full name"
          />
          <TextRow
            label="Signatory name"
            value={form.defaultSignatoryName}
            onChange={(v) => set("defaultSignatoryName", v)}
            placeholder="Full name"
          />
          <TextRow
            label="Signatory title"
            value={form.defaultSignatoryTitle}
            onChange={(v) => set("defaultSignatoryTitle", v)}
            placeholder="Head of HR"
          />
        </div>
      </Section>

      {/* Automatic emails */}
      <Section
        icon={<Mail className="w-[18px] h-[18px]" />}
        title="Automatic candidate emails"
        subtitle="Sends that fire on their own. Manual sends stay a per-action choice."
      >
        <div className="divide-y divide-black/[0.06]">
          <ToggleRow
            label="Application received"
            hint="Confirmation the moment the form is submitted."
            checked={form.emailApplicationReceived}
            onChange={(v) => set("emailApplicationReceived", v)}
            flush
          />
          <ToggleRow
            label="Interview invite"
            hint="Sent with the assessment link when the interview is auto-assigned."
            checked={form.emailInterviewInvite}
            onChange={(v) => set("emailInterviewInvite", v)}
            flush
          />
          <ToggleRow
            label="Final round scheduled"
            hint="Sent with the time and meeting link when a one-on-one is booked."
            checked={form.emailFinalRound}
            onChange={(v) => set("emailFinalRound", v)}
            flush
          />
          <ToggleRow
            label="Selected (automatic advance)"
            hint="Sent only when the interview-scoring rule advances a candidate on its own."
            checked={form.emailAutoSelected}
            onChange={(v) => set("emailAutoSelected", v)}
            flush
          />
        </div>
      </Section>

      {/* Sticky save bar */}
      {(dirty || justSaved || error) && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/[0.08] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <p className="text-[13px] text-ink-3">
              {error ? (
                <span className="text-red-700">{error}</span>
              ) : justSaved && !dirty ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Check className="w-4 h-4" /> Settings saved
                </span>
              ) : (
                "You have unsaved changes."
              )}
            </p>
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  onClick={() => {
                    setForm(saved);
                    setError(null);
                  }}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-ink-3 hover:text-ink transition-colors disabled:opacity-40"
                >
                  Discard
                </button>
              )}
              <button
                onClick={onSave}
                disabled={busy || !dirty}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-ink text-white text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-40"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid place-items-center w-9 h-9 rounded-xl bg-orange/10 text-orange shrink-0">
          {icon}
        </span>
        <div>
          <h2 className="text-[16px] font-semibold text-ink leading-tight">{title}</h2>
          <p className="text-[13px] text-ink-4 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleRow({
  label: text,
  hint,
  checked,
  onChange,
  flush,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  flush?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${flush ? "py-3.5" : "rounded-xl border border-black/[0.08] bg-cream/30 px-4 py-3.5"}`}>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{text}</p>
        {hint && <p className="text-[12.5px] text-ink-4 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-black/[0.18]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NumberRow({
  label: text,
  hint,
  value,
  onChange,
  suffix,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className={label}>{text}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          disabled={disabled}
          className={`${field} max-w-[120px]`}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))))}
        />
        {suffix && <span className="text-[13px] text-ink-4">{suffix}</span>}
      </div>
      {hint && <p className="text-[12.5px] text-ink-4 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

function TextRow({
  label: text,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  wide,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className={label}>{text}</label>
      <input
        type={type}
        className={field}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-[12.5px] text-ink-4 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

function RoundByRole({
  value,
  onChange,
}: {
  value: Record<string, RoundType>;
  onChange: (role: string, round: RoundType) => void;
}) {
  return (
    <div>
      <label className={label}>Interview type by role</label>
      <p className="text-[12.5px] text-ink-4 mb-2.5 leading-snug">
        Each role runs its own AI interview type. The topic always follows the role.
      </p>
      <div className="rounded-xl border border-black/[0.08] divide-y divide-black/[0.06] overflow-hidden">
        {PREFERRED_ROLES.map((role) => (
          <div key={role} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <span className="text-[14px] font-medium text-ink truncate">{role}</span>
            <select
              className="shrink-0 w-[150px] px-3 py-1.5 rounded-lg border border-black/12 text-[13px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all"
              value={value[role] ?? "behavioral"}
              onChange={(e) => onChange(role, e.target.value as RoundType)}
            >
              {ROUND_TYPES.map((r) => (
                <option key={r} value={r}>
                  {ROUND_TYPE_LABEL[r] ?? r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
