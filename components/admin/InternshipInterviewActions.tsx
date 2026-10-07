"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Calendar, CalendarPlus, Clock, Loader2, RefreshCw, X } from "lucide-react";
import { ROUND_TYPES, ROUND_TYPE_LABEL } from "@/lib/internship/interviews";

/**
 * The next `count` days as date-picker cards. Local date is fine: the team is
 * India-based, so the browser's date matches the IST date the slot is anchored
 * to server-side.
 */
function upcomingDays(count: number) {
  const out: { key: string; weekday: string; day: string; month: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: String(d.getDate()),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    });
  }
  return out;
}

/** Half-hour slots across the working day (IST), as { value: "HH:mm", label: "9:30 AM" }. */
function daySlots() {
  const out: { value: string; label: string }[] = [];
  for (let h = 9; h <= 18; h++) {
    for (const m of [0, 30]) {
      const hr12 = h % 12 === 0 ? 12 : h % 12;
      out.push({
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        label: `${hr12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
      });
    }
  }
  return out;
}

/**
 * The two things HR can start from the interview card: send the candidate to
 * the AI assessment, and book the final one-on-one once that assessment is in.
 *
 * Recording an outcome by hand is NOT here. The API supports it — PATCH and
 * DELETE on /api/admin/internship-interviews carry score, hr_verdict, summary,
 * competencies and reschedule — but nothing in this component calls them, so a
 * human round's score can currently only be set through the API directly.
 */
export default function InternshipInterviewActions({
  applicationId,
  candidateName,
  hasAssessment,
  canScheduleFinal,
  canSync,
  defaultRoundType = "behavioral",
  defaultInterviewer = "",
  defaultInterviewerEmail = "",
}: {
  applicationId: string;
  candidateName: string;
  hasAssessment: boolean;
  canScheduleFinal: boolean;
  /** There is at least one assigned AI round with no result yet. */
  canSync: boolean;
  /** HR-set defaults from settings, pre-filled into the forms. */
  defaultRoundType?: string;
  defaultInterviewer?: string;
  defaultInterviewerEmail?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "assessment" | "final">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/internship-interviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncMsg(json.error ?? "Sync failed. Try again.");
        return;
      }
      if (json.completed > 0) setSyncMsg(`Result is in. Refreshing.`);
      else if (json.checked === 0) setSyncMsg("Nothing waiting to sync.");
      else setSyncMsg("No result yet. The candidate has not finished.");
      router.refresh();
    } catch {
      setSyncMsg("Could not reach the server.");
    } finally {
      setSyncing(false);
    }
  }

  const [roundType, setRoundType] = useState<string>(defaultRoundType);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [interviewer, setInterviewer] = useState(defaultInterviewer);
  const [interviewerEmail, setInterviewerEmail] = useState(defaultInterviewerEmail);
  const [meetingUrl, setMeetingUrl] = useState("");

  const days = upcomingDays(14);
  const slots = daySlots();

  function close() {
    setOpen(null);
    setError(null);
  }

  async function submit(kind: "ai_assessment" | "final_discussion") {
    setBusy(true);
    setError(null);
    const scheduledAt = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : "";
    try {
      const res = await fetch("/api/admin/internship-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "ai_assessment"
            ? { applicationId, kind, roundType }
            : { applicationId, kind, scheduledAt, interviewer, interviewerEmail, meetingUrl },
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not create the round. Try again.");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!hasAssessment && (
          <button
            onClick={() => setOpen("assessment")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ink text-white text-[13px] font-semibold hover:bg-ink/90 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Invite to assessment
          </button>
        )}
        {canScheduleFinal && (
          <button
            onClick={() => setOpen("final")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/[0.12] bg-white text-ink-2 text-[13px] font-semibold hover:bg-cream/50 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Schedule final round
          </button>
        )}
        {canSync && (
          <button
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/[0.12] bg-white text-ink-2 text-[13px] font-semibold hover:bg-cream/50 transition-colors disabled:opacity-50"
            title="Pull the latest assessment result from the GrowQR app"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync results
          </button>
        )}
      </div>
      {syncMsg && <p className="mt-2 text-[12.5px] text-ink-4">{syncMsg}</p>}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={close}>
          <div
            className={`w-full ${open === "final" ? "max-w-[540px]" : "max-w-[440px]"} max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-black/[0.1] shadow-[0_12px_48px_rgba(0,0,0,0.18)] p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-[17px] font-bold text-ink">
                {open === "assessment" ? "Invite to AI assessment" : "Schedule final discussion"}
              </h3>
              <button onClick={close} className="p-1 text-ink-4 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {open === "assessment" ? (
              <>
                <p className="text-[14px] text-ink-2 leading-relaxed">
                  This opens round 1 for <span className="font-semibold">{candidateName}</span>, an
                  assessment run by RQ-Vera inside the GrowQR app. The score, breakdown and summary
                  land on this page once it is finished.
                </p>
                <div className="mt-4">
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5">
                    Round type
                  </label>
                  <select
                    value={roundType}
                    onChange={(e) => setRoundType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all"
                  >
                    {ROUND_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {ROUND_TYPE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[13px] text-ink-4 mt-3 leading-relaxed">
                  No email goes out from here. Candidate mail is sent from the status control, so it
                  can never be sent twice for the same step.
                </p>
              </>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">
                    <Calendar className="w-3.5 h-3.5" /> Pick a day
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
                    {days.map((d) => {
                      const active = selectedDate === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setSelectedDate(d.key)}
                          className={`shrink-0 w-[56px] flex flex-col items-center py-2 rounded-xl border transition-colors ${
                            active
                              ? "border-orange bg-orange-lighter text-orange"
                              : "border-black/[0.12] text-ink-2 hover:bg-cream/50"
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide">{d.weekday}</span>
                          <span className="text-[17px] font-bold leading-tight">{d.day}</span>
                          <span className="text-[10px] text-ink-4">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">
                    <Clock className="w-3.5 h-3.5" /> Pick a time
                    <span className="text-[11px] font-medium normal-case tracking-normal text-ink-5">IST, 30 min</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-[164px] overflow-y-auto pr-1">
                    {slots.map((t) => {
                      const active = selectedTime === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setSelectedTime(t.value)}
                          className={`px-2 py-2 rounded-lg border text-[12.5px] font-medium transition-colors ${
                            active
                              ? "border-orange bg-orange-lighter text-orange"
                              : "border-black/[0.12] text-ink-2 hover:bg-cream/50"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5">
                      Interviewer
                    </label>
                    <input
                      type="text"
                      value={interviewer}
                      onChange={(e) => setInterviewer(e.target.value)}
                      placeholder="Name shown to candidate"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all placeholder:text-ink-5"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5">
                      Interviewer email
                    </label>
                    <input
                      type="email"
                      value={interviewerEmail}
                      onChange={(e) => setInterviewerEmail(e.target.value)}
                      placeholder="Added to the invite"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all placeholder:text-ink-5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1.5">
                    Meeting link
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="Leave blank to auto-create a Google Meet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all placeholder:text-ink-5"
                  />
                  <p className="text-[12px] text-ink-4 mt-1.5 leading-relaxed">
                    A Google Meet is created and the candidate is emailed the time and link.
                    Paste a link only to override.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={close}
                className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-ink-3 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => submit(open === "assessment" ? "ai_assessment" : "final_discussion")}
                disabled={busy || (open === "final" && !(selectedDate && selectedTime))}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-white text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {open === "assessment" ? "Send to assessment" : "Schedule round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
