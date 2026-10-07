export const dynamic = "force-dynamic";

import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createAdminLog } from "@/lib/admin-logs";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import {
  isInterviewKind,
  isInterviewStatus,
  isHrVerdict,
  isRoundType,
  assessmentUrlFor,
  KIND_CONFIG,
  type Competency,
  type RoundType,
} from "@/lib/internship/interviews";
import {
  interviewApiConfigured,
  resolveAccountEmail,
  assignInterview,
} from "@/lib/internship/growqr-interview-api";
import { getCompanyConnection, createMeetEvent } from "@/lib/google/calendar";
import { finalRoundScheduled } from "@/lib/internship/emails";
import { sendInternshipEmail } from "@/lib/internship/send-email";
import { nextStatusOrNull } from "@/lib/internship/status-flow";
import { getInternshipSettings, resolveFinalRoundCalendarId, roundTypeForRole } from "@/lib/internship/settings";
import type { TablesInsert, TablesUpdate } from "@/types/database";

/**
 * Interview and assessment rounds for an internship application.
 *
 * No email is sent from here. Candidate mail is the status-change pipeline's
 * job, and giving two subsystems the ability to mail the same person about the
 * same event is how people end up receiving it twice.
 */

/** Competencies arrive from a form, so validate before they reach jsonb. */
function parseCompetencies(input: unknown): Competency[] | null {
  if (input === null || input === undefined) return null;
  if (!Array.isArray(input)) return null;
  const out: Competency[] = [];
  for (const entry of input.slice(0, 12)) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim().slice(0, 80) : "";
    const score = Number(e.score);
    if (!name || !Number.isFinite(score)) continue;
    const max = Number(e.max);
    out.push({ name, score, max: Number.isFinite(max) && max > 0 ? max : 100 });
  }
  return out;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid request body");

  const { applicationId, kind, roundType, role, dueAt, scheduledAt, interviewer, interviewerEmail, meetingUrl } = body as {
    applicationId?: string;
    kind?: string;
    roundType?: string;
    role?: string;
    dueAt?: string;
    scheduledAt?: string;
    interviewer?: string;
    interviewerEmail?: string;
    meetingUrl?: string;
  };

  if (!applicationId) return badRequest("Missing applicationId");
  if (!kind || !isInterviewKind(kind)) return badRequest("Invalid round type");
  if (kind === "final_discussion" && !scheduledAt) {
    return badRequest("A final discussion needs a date and time");
  }

  const admin = createAdminClient();

  // HR-set automation config: the default AI round, the default interviewer and
  // calendar for a final round, and whether the final-round email fires.
  const settings = await getInternshipSettings();

  const { data: application, error: appError } = await admin
    .from("internship_applications")
    .select("id, full_name, email, status, growqr_user_id, preferred_role, growqr_account_email")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Rounds are numbered in the order they are created. Reading the current max
  // rather than counting means a deleted round does not cause a collision with
  // the unique (application_id, round) constraint.
  const { data: existing } = await admin
    .from("internship_interviews")
    .select("round")
    .eq("application_id", applicationId)
    .order("round", { ascending: false })
    .limit(1);

  const round = (existing?.[0]?.round ?? 0) + 1;
  if (round > 10) return badRequest("This application already has ten rounds");

  // For an AI assessment, assign it live on the GrowQR interview service when
  // the integration is configured. When it is not (no key, e.g. local dev), the
  // round is still created and tracked by hand, which is the path that works
  // today. A configured call that FAILS is surfaced as an error rather than
  // written as though it had succeeded, because a silent phantom invite is the
  // exact failure mode this integration is prone to.
  let externalInterviewId: string | null = null;
  let batchId: string | null = null;
  let assignedRoundType: RoundType | null = null;
  let targetRole: string | null = null;

  if (kind === "ai_assessment") {
    targetRole = (typeof role === "string" && role.trim() ? role : application.preferred_role).slice(0, 200);
    // An explicit round from the form wins; otherwise the role's configured type.
    assignedRoundType =
      typeof roundType === "string" && isRoundType(roundType) ? roundType : roundTypeForRole(settings, targetRole);

    if (interviewApiConfigured()) {
      if (!application.growqr_user_id) {
        return badRequest(
          "This candidate has no linked GrowQR profile, so the interview cannot be assigned automatically. Record the round by hand instead.",
        );
      }

      // Resolve the ACCOUNT email once and cache it on the application. The form
      // email and the profile's public_email are both unsafe to assign against:
      // the wrong address returns success and a real id, but the candidate never
      // sees the interview.
      let accountEmail = application.growqr_account_email;
      if (!accountEmail) {
        const resolved = await resolveAccountEmail(application.growqr_user_id);
        if (!resolved.ok) {
          return NextResponse.json(
            { error: `Could not resolve the candidate's GrowQR account email. ${resolved.error}` },
            { status: 502 },
          );
        }
        accountEmail = resolved.data;
        await admin
          .from("internship_applications")
          .update({ growqr_account_email: accountEmail })
          .eq("id", applicationId);
      }

      const assigned = await assignInterview({
        role: targetRole,
        round: assignedRoundType,
        emails: [accountEmail],
      });
      if (!assigned.ok) {
        return NextResponse.json(
          { error: `The interview service rejected the assignment. ${assigned.error}` },
          { status: 502 },
        );
      }
      const first = assigned.data.assignments?.[0];
      if (!first?.assignment_id) {
        return NextResponse.json(
          { error: "The interview service returned no assignment id." },
          { status: 502 },
        );
      }
      externalInterviewId = first.assignment_id;
      batchId = assigned.data.batch_id ?? null;
    }
  }

  // For a final discussion, auto-create a Google Meet on the internship
  // calendar so the candidate (and the interviewer, if their email is given)
  // receive a real invite and link, the same mechanism the expert booking flow
  // uses. When the calendar is not connected, fall back to whatever link HR
  // pasted. A calendar failure never blocks the round from being recorded.
  let finalMeetingUrl: string | null = meetingUrl?.trim() || null;
  let finalScheduledISO: string | null = scheduledAt || null;
  let finalEventId: string | null = null;

  // The interviewer defaults to the one HR set in settings when the form leaves
  // it blank, so the person who always runs these does not get retyped.
  const effInterviewer = interviewer?.trim() || settings.defaultInterviewerName || null;
  const effInterviewerEmail = interviewerEmail?.trim() || settings.defaultInterviewerEmail || null;

  if (kind === "final_discussion" && scheduledAt) {
    // datetime-local carries no timezone. HR enters it as IST, so anchor it to
    // IST rather than let the server (UTC on Vercel) read it as its own zone.
    const base = scheduledAt.length >= 16 ? scheduledAt.slice(0, 16) : scheduledAt;
    const istStart = new Date(`${base}:00+05:30`);
    const start = Number.isNaN(istStart.getTime()) ? new Date(scheduledAt) : istStart;
    finalScheduledISO = start.toISOString();
    const endISO = new Date(start.getTime() + 30 * 60_000).toISOString();

    try {
      const conn = await getCompanyConnection();
      if (conn?.google_refresh_token) {
        const attendees = [application.email, effInterviewerEmail].filter(
          (e): e is string => Boolean(e),
        );
        const { eventId, meetLink } = await createMeetEvent(conn, {
          summary: `GrowQR Internship · Final round · ${application.full_name}`,
          description: `Final internship discussion for ${application.full_name} (${targetRole ?? application.preferred_role ?? "role to be confirmed"}).\n\nBooked from the GrowQR admin portal.`,
          startISO: finalScheduledISO,
          endISO,
          timeZone: "Asia/Kolkata",
          attendees,
          calendarId: resolveFinalRoundCalendarId(settings),
        });
        if (meetLink) finalMeetingUrl = meetLink;
        finalEventId = eventId || null;
      } else {
        console.warn("[internship final round] No company calendar connected; using the pasted link if any.");
      }
    } catch (e) {
      console.error("[internship final round] Google Meet creation failed (kept manual link):", e);
    }
  }

  const now = new Date().toISOString();
  const insert: TablesInsert<"internship_interviews"> = {
    application_id: applicationId,
    growqr_user_id: application.growqr_user_id,
    round,
    kind,
    source: "manual",
    status: kind === "ai_assessment" ? "invited" : "scheduled",
    invited_at: kind === "ai_assessment" ? now : null,
    due_at: dueAt || null,
    interview_url: kind === "ai_assessment" ? assessmentUrlFor() : null,
    scheduled_at: finalScheduledISO,
    interviewer: effInterviewer?.slice(0, 200) || null,
    meeting_url: finalMeetingUrl,
    external_interview_id: externalInterviewId,
    batch_id: batchId,
    round_type: assignedRoundType,
    target_role: targetRole,
    // Our Google event id for a final round, kept for traceability. NOT put in
    // external_interview_id, which is the interview service's assignment id and
    // is what the results poller keys on.
    raw: finalEventId ? { google_event_id: finalEventId } : null,
  };

  const { data: created, error } = await admin
    .from("internship_interviews")
    .insert([insert])
    .select("id, round")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "details_updated",
    target_id: applicationId,
    target_name: application.full_name,
    new_value: `${KIND_CONFIG[kind].label} round ${round}`,
    details: { module: "internship", interview_id: created.id, round, kind },
  }).catch((e) => console.error("Interview create log failed:", e));

  // Opening any interview round moves the pipeline to the interview stage,
  // forward-only: it never pulls back a candidate already Selected/Offer, and
  // never disturbs a Rejected/Waitlist a person set.
  const advanced = nextStatusOrNull(application.status, "interview");
  if (advanced) {
    await admin
      .from("internship_applications")
      .update({ status: advanced })
      .eq("id", applicationId)
      .then(({ error: e }) => e && console.error("Status advance failed:", e.message));
  }

  // Tell the candidate their final round is booked, with the time and the Meet
  // link. Sent after the response so scheduling returns immediately; a failure
  // is recorded in the email ledger, never fails the scheduling. The AI
  // assessment sends nothing from here: its candidate mail is the status
  // pipeline's job, so exactly one place owns each email.
  if (kind === "final_discussion" && application.email && finalScheduledISO && settings.emailFinalRound) {
    const whenLabel =
      new Date(finalScheduledISO).toLocaleString("en-IN", {
        weekday: "long", day: "numeric", month: "long",
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
      }) + " IST";
    const email = finalRoundScheduled(
      application.full_name,
      whenLabel,
      effInterviewer,
      finalMeetingUrl,
    );
    const to = application.email;
    const sentBy = user.email ?? null;
    after(async () => {
      await sendInternshipEmail({
        applicationId,
        kind: "final_round",
        to,
        subject: email.subject,
        html: email.html,
        sentBy,
      });
    });
  }

  return NextResponse.json({ success: true, id: created.id, round, assignmentId: externalInterviewId });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid request body");

  const {
    id, status, score, maxScore, hrVerdict, summary,
    competencies, transcriptUrl, scheduledAt, interviewer, meetingUrl,
  } = body as Record<string, unknown>;

  if (typeof id !== "string" || !id) return badRequest("Missing id");

  const admin = createAdminClient();

  const { data: current, error: fetchError } = await admin
    .from("internship_interviews")
    .select("id, application_id, round, kind, status, source")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const updates: TablesUpdate<"internship_interviews"> = {};

  if (typeof status === "string") {
    if (!isInterviewStatus(status)) return badRequest("Invalid status");
    updates.status = status;
    // Stamp the completion instant on the transition, not on every later edit
    // of an already-completed round.
    if (status === "completed" && current.status !== "completed") {
      updates.completed_at = new Date().toISOString();
    }
  }

  if (score !== undefined) {
    if (score === null) {
      updates.score = null;
    } else {
      const n = Number(score);
      if (!Number.isFinite(n) || n < 0) return badRequest("Score must be zero or more");
      updates.score = n;
    }
  }

  if (maxScore !== undefined) {
    const n = Number(maxScore);
    if (!Number.isFinite(n) || n <= 0) return badRequest("Maximum score must be greater than zero");
    updates.max_score = n;
  }

  if (hrVerdict !== undefined) {
    if (hrVerdict === null || hrVerdict === "") {
      updates.hr_verdict = null;
    } else if (typeof hrVerdict === "string" && isHrVerdict(hrVerdict)) {
      updates.hr_verdict = hrVerdict;
    } else {
      return badRequest("Invalid verdict");
    }
  }

  if (summary !== undefined) {
    updates.summary = typeof summary === "string" && summary.trim()
      ? summary.trim().slice(0, 4000)
      : null;
  }

  if (competencies !== undefined) {
    updates.competencies = parseCompetencies(competencies);
  }

  if (transcriptUrl !== undefined) {
    const v = typeof transcriptUrl === "string" ? transcriptUrl.trim() : "";
    if (v && !/^https?:\/\//i.test(v)) return badRequest("Transcript link must start with https://");
    updates.transcript_url = v || null;
  }

  if (scheduledAt !== undefined) {
    updates.scheduled_at = typeof scheduledAt === "string" && scheduledAt ? scheduledAt : null;
  }
  if (interviewer !== undefined) {
    updates.interviewer = typeof interviewer === "string" && interviewer.trim()
      ? interviewer.trim().slice(0, 200)
      : null;
  }
  if (meetingUrl !== undefined) {
    const v = typeof meetingUrl === "string" ? meetingUrl.trim() : "";
    if (v && !/^https?:\/\//i.test(v)) return badRequest("Meeting link must start with https://");
    updates.meeting_url = v || null;
  }

  if (!Object.keys(updates).length) return badRequest("Nothing to update");

  // A person touched this row, so it is no longer purely what the app said.
  // Recorded rather than inferred, so the card can label provenance honestly.
  updates.recorded_by = user.email!;

  const { error: updateError } = await admin
    .from("internship_interviews")
    .update(updates)
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: application } = await admin
    .from("internship_applications")
    .select("full_name")
    .eq("id", current.application_id)
    .single();

  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "details_updated",
    target_id: current.application_id,
    target_name: application?.full_name ?? "Unknown",
    old_value: current.status,
    new_value: (updates.status as string) ?? current.status,
    details: { module: "internship", interview_id: id, round: current.round, kind: current.kind },
  }).catch((e) => console.error("Interview update log failed:", e));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return badRequest("Missing id");

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("internship_interviews")
    .select("application_id, round, kind")
    .eq("id", id)
    .single();

  const { error } = await admin.from("internship_interviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (current) {
    createAdminLog({
      admin_email: user.email!,
      admin_id: user.id,
      action_type: "details_updated",
      target_id: current.application_id,
      target_name: "Interview round removed",
      details: { module: "internship", round: current.round, kind: current.kind, deleted: true },
    }).catch((e) => console.error("Interview delete log failed:", e));
  }

  return NextResponse.json({ success: true });
}
