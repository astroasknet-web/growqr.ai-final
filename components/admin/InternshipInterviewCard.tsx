import { ExternalLink, Bot, Users, CalendarClock } from "lucide-react";
import InternshipInterviewActions from "./InternshipInterviewActions";
import { getInternshipSettings, roundTypeForRole } from "@/lib/internship/settings";
import {
  KIND_CONFIG,
  INTERVIEW_STATUS_CONFIG,
  HR_VERDICT_CONFIG,
  ROUND_TYPE_LABEL,
  DIFFICULTY_LABEL,
  readCompetencies,
  readList,
  scorePercent,
  type InterviewKind,
  type InterviewStatus,
  type HrVerdict,
} from "@/lib/internship/interviews";
import type { Tables } from "@/types/database";

type Interview = Tables<"internship_interviews">;

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDay(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Where the assessment the candidate took in the GrowQR app shows up, and
 * where the human rounds that follow are scheduled.
 *
 * Sits directly under the GrowQR Profile card because the two answer the same
 * question from different angles: the profile is what the candidate claims,
 * the assessment is what the product measured. HR reads them together and
 * then decides whether a final discussion is worth booking.
 *
 * Nothing here changes the application's status. A strong score is an input to
 * that decision, not the decision.
 */
export default async function InternshipInterviewCard({
  applicationId,
  candidateName,
  preferredRole,
  interviews,
}: {
  applicationId: string;
  candidateName: string;
  preferredRole: string | null;
  interviews: Interview[];
}) {
  const settings = await getInternshipSettings();
  const completedAssessment = interviews.find(
    (i) => i.kind === "ai_assessment" && i.status === "completed",
  );
  const hasFinalRound = interviews.some((i) => i.kind === "final_discussion");

  return (
    <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[15px] md:text-[16px] font-semibold text-ink">Interview &amp; Assessment</h2>
          <p className="text-[13px] text-ink-4 mt-0.5">
            Round 1 runs in the GrowQR app. Later rounds are booked by the team.
          </p>
        </div>
        <InternshipInterviewActions
          applicationId={applicationId}
          candidateName={candidateName}
          hasAssessment={interviews.some((i) => i.kind === "ai_assessment")}
          canScheduleFinal={Boolean(completedAssessment) && !hasFinalRound}
          canSync={interviews.some((i) => i.kind === "ai_assessment" && !i.completed_at)}
          defaultRoundType={roundTypeForRole(settings, preferredRole)}
          defaultInterviewer={settings.defaultInterviewerName ?? ""}
          defaultInterviewerEmail={settings.defaultInterviewerEmail ?? ""}
        />
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.12] bg-cream/30 px-5 py-8 text-center">
          <Bot className="w-6 h-6 text-ink-4 mx-auto mb-2.5" />
          <p className="text-[14px] font-medium text-ink-2">No assessment yet</p>
          <p className="text-[13px] text-ink-4 mt-1 max-w-[420px] mx-auto leading-relaxed">
            Invite {candidateName.split(" ")[0]} to the RQ-Vera assessment in the GrowQR app.
            The score and breakdown appear here as soon as it is finished.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <RoundCard key={interview.id} interview={interview} />
          ))}
        </div>
      )}

      {completedAssessment && !hasFinalRound && (
        <p className="mt-4 text-[13px] text-ink-3 bg-cream/50 border border-black/[0.06] rounded-xl px-3.5 py-2.5">
          Assessment complete
          {completedAssessment.score !== null && (
            <>
              {" "}with a score of{" "}
              <span className="font-semibold text-ink-2">
                {completedAssessment.score} / {completedAssessment.max_score}
              </span>
            </>
          )}
          . Book the final discussion when you are ready. The status stays where you put it.
        </p>
      )}
    </div>
  );
}

function PointList({ title, tone, items }: { title: string; tone: "positive" | "negative"; items: string[] }) {
  if (!items.length) return null;
  const dot = tone === "positive" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[13px] text-ink-2 leading-relaxed pl-3.5 relative">
            <span className={`absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoundCard({ interview }: { interview: Interview }) {
  const kind = KIND_CONFIG[interview.kind as InterviewKind] ?? KIND_CONFIG.ai_assessment;
  const statusCfg =
    INTERVIEW_STATUS_CONFIG[interview.status as InterviewStatus] ?? INTERVIEW_STATUS_CONFIG.invited;
  const verdict = interview.hr_verdict
    ? HR_VERDICT_CONFIG[interview.hr_verdict as HrVerdict]
    : null;
  const strengths = readList(interview.strengths);
  const weaknesses = readList(interview.weaknesses);
  const coaching = readList(interview.coaching_notes);
  const competencies = readCompetencies(interview.competencies);
  const pct = scorePercent(interview.score, interview.max_score);
  const isAi = interview.kind === "ai_assessment";

  return (
    <div className="rounded-xl border border-black/[0.1] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-cream/50 border-b border-black/[0.07]">
        <div className="flex items-center gap-2 min-w-0">
          {isAi ? (
            <Bot className="w-4 h-4 text-ink-3 shrink-0" />
          ) : (
            <Users className="w-4 h-4 text-ink-3 shrink-0" />
          )}
          <span className="text-[13px] font-semibold text-ink">
            Round {interview.round} · {kind.label}
          </span>
          {kind.agent && (
            <span className="text-[12px] text-ink-4 hidden sm:inline">· {kind.agent}</span>
          )}
          {interview.round_type && (
            <span className="text-[12px] text-ink-4 hidden md:inline">
              · {ROUND_TYPE_LABEL[interview.round_type] ?? interview.round_type}
              {interview.difficulty && ` (${DIFFICULTY_LABEL[interview.difficulty] ?? interview.difficulty})`}
            </span>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 whitespace-nowrap ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      <div className="px-4 py-4">
        {/* Scheduling, for a human round */}
        {interview.scheduled_at && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2">
              <CalendarClock className="w-4 h-4 text-ink-4" />
              {formatWhen(interview.scheduled_at)}
            </span>
            {interview.interviewer && (
              <span className="text-[14px] text-ink-3">with {interview.interviewer}</span>
            )}
            {interview.meeting_url && (
              <a
                href={interview.meeting_url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[13px] font-medium hover:bg-blue-100 transition-colors"
              >
                Join meeting <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Score */}
        {interview.score !== null ? (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Score</p>
              <p className="text-[30px] font-bold text-ink leading-none mt-1 tabular-nums">
                {interview.score}
                <span className="text-[15px] font-medium text-ink-4"> / {interview.max_score}</span>
              </p>
            </div>
            {pct !== null && (
              <div className="flex-1 min-w-[160px] pb-1.5">
                <span className="block h-2 rounded-full bg-black/[0.07] overflow-hidden">
                  <span className="block h-full rounded-full bg-orange" style={{ width: `${pct}%` }} />
                </span>
              </div>
            )}
            {verdict && (
              <div className="pb-0.5">
                {/* Ours, not the assessment's. The interview service returns no
                    hire signal at all, so labelling this "Recommendation" would
                    credit the product with a call a person made. */}
                <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider mb-1">HR Verdict</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[13px] font-semibold border border-black/10 ${verdict.bg} ${verdict.text}`}>
                  {verdict.label}
                </span>
              </div>
            )}
          </div>
        ) : (
          interview.status !== "completed" && (
            <p className="text-[14px] text-ink-3">
              {isAi
                ? "Waiting for the candidate to finish the assessment in the GrowQR app."
                : "Not yet held."}
              {interview.due_at && ` Due ${formatDay(interview.due_at)}.`}
            </p>
          )
        )}

        {/* Competency breakdown */}
        {competencies.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Breakdown</p>
            {competencies.map((c) => {
              const w = scorePercent(c.score, c.max ?? 100) ?? 0;
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-[13px] text-ink-2 w-[150px] shrink-0 truncate" title={c.name}>{c.name}</span>
                  <span className="flex-1 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <span className="block h-full rounded-full bg-ink/60" style={{ width: `${w}%` }} />
                  </span>
                  <span className="text-[13px] font-semibold text-ink-2 tabular-nums w-[34px] text-right">{c.score}</span>
                </div>
              );
            })}
          </div>
        )}

        {interview.summary && (
          <p className="mt-4 text-[14px] text-ink-2 leading-relaxed whitespace-pre-line border-l-2 border-black/[0.08] pl-3">
            {interview.summary}
          </p>
        )}

        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <PointList title="Strengths" tone="positive" items={strengths} />
            <PointList title="Areas to improve" tone="negative" items={weaknesses} />
          </div>
        )}

        {coaching.length > 0 && (
          <details className="mt-4 group/coach">
            <summary className="cursor-pointer text-[13px] font-semibold text-ink-3 hover:text-ink transition-colors list-none">
              Coaching notes for the candidate ({coaching.length})
              <span className="text-ink-4 font-normal"> · shown to them in the app</span>
            </summary>
            <ul className="mt-2 space-y-1.5">
              {coaching.map((c, i) => (
                <li key={i} className="text-[13px] text-ink-3 leading-relaxed pl-3.5 relative">
                  <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-ink-4" />
                  {c}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {interview.interview_url && interview.status !== "completed" && (
            <a href={interview.interview_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orange hover:underline">
              Assessment link <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {interview.transcript_url && (
            <a href={interview.transcript_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orange hover:underline">
              View transcript <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Provenance. A result typed by a person must never read as one the
              product produced, so every completed round says which it was. */}
          <span className="text-[12px] text-ink-4 ml-auto">
            {interview.source === "app_sync"
              ? `Synced from GrowQR app${interview.completed_at ? ` · ${formatWhen(interview.completed_at)}` : ""}`
              : interview.recorded_by
                ? `Recorded by ${interview.recorded_by}`
                : "Created in the admin portal"}
          </span>
        </div>
      </div>
    </div>
  );
}
