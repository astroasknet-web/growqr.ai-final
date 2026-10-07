export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Phone, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-server";
import InternshipDecisionBar from "@/components/admin/InternshipDecisionBar";
import InternshipStatusBadgeServer from "@/components/admin/InternshipStatusBadgeServer";
import InternshipInterviewCard from "@/components/admin/InternshipInterviewCard";
import InternshipAppointmentCard from "@/components/admin/InternshipAppointmentCard";
import GrowqrAvatar from "@/components/admin/GrowqrAvatar";
import { readProfileSnapshot, formatEducationEntry } from "@/lib/growqr-profile";
import { syncInterviewResults } from "@/lib/internship/sync-results";
import { AVAILABILITY_LABEL, MODE_LABEL, DURATION_LABEL } from "@/lib/internship-options";
import { TRIAGE_CONFIG, RQ_SHORTLIST_THRESHOLD, type TriageBand } from "@/lib/internship/triage";
import { parseDateOnly } from "@/lib/dob";

const EXPERIENCE_LABEL: Record<string, string> = {
  fresher: "Fresher",
  student: "Student",
  experienced: "Experienced",
};

const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
};

/** `1999-05-04` reads as "4 May 1999"; anything unparseable renders as-is. */
function formatDob(dob: string | null): string | null {
  if (!dob) return null;
  const parsed = parseDateOnly(dob);
  if (!parsed) return dob;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

async function getApplication(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("internship_applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

/** Every round for this application, oldest first, so the card reads as a sequence. */
async function getInterviews(applicationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("internship_interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("round", { ascending: true });
  if (error) {
    // A missing interview list must not take down the whole candidate page.
    console.error("Internship interviews read failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** The single appointment-letter record for this application, if one has been prepared. */
async function getAppointment(applicationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("internship_appointments")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("Internship appointment read failed:", error.message);
    return null;
  }
  return data;
}

async function getResumeUrl(path: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("internship-resumes")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

const CARD = "bg-white rounded-2xl border border-black/[0.1] shadow-card p-6";
const HEADING = "text-[15px] md:text-[16px] font-semibold text-ink";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[15px] text-ink-2">{value}</p>
    </div>
  );
}

/**
 * Single column rather than the 2/3 + 1/3 sidebar the ambassador detail page
 * uses. The page is ordered by what HR needs in the order they need it: the
 * decision controls, then the GrowQR profile the decision is mostly made on,
 * then the supporting material. The raw form fields, which were at the top,
 * are the least-read part of the page and now sit near the bottom.
 */
export default async function InternshipApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const [resumeUrl, appointment] = await Promise.all([
    app.resume ? getResumeUrl(app.resume) : Promise.resolve(null),
    getAppointment(app.id),
  ]);

  // Auto-sync on open: if this candidate has an AI assessment still in flight,
  // pull the latest result before rendering so HR sees it fresh without ever
  // clicking. This calls the interview service ONLY when there is a pending
  // round (an assigned assessment with no result yet); a candidate with none,
  // or whose rounds are already complete, makes no external call. The daily
  // cron remains the backstop for anyone nobody opens. Never throws.
  let interviews = await getInterviews(app.id);
  const hasPendingAssessment = interviews.some(
    (i) => i.kind === "ai_assessment" && i.external_interview_id && !i.completed_at,
  );
  if (hasPendingAssessment) {
    const synced = await syncInterviewResults({ applicationId: app.id }).catch(() => null);
    if (synced?.ok && synced.data.updated > 0) {
      interviews = await getInterviews(app.id);
    }
  }
  const snapshot = readProfileSnapshot(app.growqr_profile_snapshot);
  const band = TRIAGE_CONFIG[app.triage as TriageBand];

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <Link
        href="/admin/internship"
        className="inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] text-ink-3 hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="space-y-5">
        {/* Identity header */}
        <div className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] md:text-[24px] lg:text-[26px] font-bold text-ink tracking-tightest">{app.full_name}</h1>
              <p className="text-[14px] md:text-[15px] text-ink-3 mt-0.5">{app.preferred_role}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {band && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 ${band.bg} ${band.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
                  {band.label}
                </span>
              )}
              <InternshipStatusBadgeServer status={app.status} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {app.phone && (
              <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-orange transition-colors">
                <Phone className="w-3.5 h-3.5" /> {app.phone}
              </a>
            )}
            <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-orange transition-colors">
              <Mail className="w-3.5 h-3.5" /> {app.email}
            </a>
            {app.created_at && (
              <span className="text-[13px] text-ink-4">Applied {formatDay(app.created_at)}</span>
            )}
            {app.updated_at && app.updated_at !== app.created_at && (
              <span className="text-[13px] text-ink-4">Updated {formatDay(app.updated_at)}</span>
            )}
          </div>
        </div>

        {/* Decision surface: status, triage and notes in one horizontal bar */}
        <InternshipDecisionBar
          applicationId={app.id}
          status={app.status}
          triage={app.triage}
          triageScore={app.triage_score}
          internalNotes={app.internal_notes}
        />

        {/* GrowQR platform profile, as captured at submit time */}
        <div className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <GrowqrAvatar
                userId={app.growqr_user_id}
                avatarUrl={app.growqr_avatar_url ?? snapshot?.avatar_url}
                name={app.full_name}
                size={48}
              />
              <div className="min-w-0">
                <h2 className={HEADING}>GrowQR Profile</h2>
                {snapshot?.headline && (
                  <p className="text-[13px] text-ink-3 truncate">{snapshot.headline}</p>
                )}
              </div>
            </div>

            {app.growqr_rq_score !== null && (
              <div className="flex items-center gap-4 rounded-xl border border-black/[0.08] bg-cream/40 px-4 py-2.5 shrink-0">
                <div>
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">RQ-Score</p>
                  <p className="text-[30px] font-bold text-orange leading-none mt-0.5">{app.growqr_rq_score}</p>
                </div>
                <div className="max-w-[190px]">
                  {band && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-black/10 ${band.bg} ${band.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
                      {band.label}
                    </span>
                  )}
                  <p className="text-[12px] text-ink-4 mt-1.5 leading-snug">
                    {RQ_SHORTLIST_THRESHOLD} and above auto-shortlists.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!app.growqr_user_id ? (
            <p className="text-[14px] text-ink-3">
              No GrowQR profile linked. This application predates the profile requirement.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1">GrowQR User ID</p>
                  <p className="text-[13px] text-ink-2 font-mono break-all">{app.growqr_user_id}</p>
                </div>
                <Field label="Target Role" value={snapshot?.target_role} />
                <Field label="Experience" value={EXPERIENCE_LABEL[snapshot?.experience ?? ""] ?? snapshot?.experience} />
                <Field
                  label="Profile Location"
                  value={[snapshot?.location, snapshot?.country].filter(Boolean).join(", ") || null}
                />
                <Field label="Institution" value={snapshot?.institution} />
                <Field label="Profile Email" value={snapshot?.public_email} />
                <Field label="Plan" value={snapshot?.plan} />
              </div>

              {!!snapshot?.skills?.length && (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">Profile Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-full bg-cream text-[13px] text-ink-2 border border-black/[0.06]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!snapshot?.education_entries?.length && (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-2">Education</p>
                  <ul className="space-y-1">
                    {snapshot.education_entries.map((entry, i) => (
                      <li key={i} className="text-[14px] text-ink-2">{formatEducationEntry(entry)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {snapshot?.summary && (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1">Profile Summary</p>
                  <p className="text-[14px] text-ink-2 leading-relaxed whitespace-pre-line">{snapshot.summary}</p>
                </div>
              )}

              {!snapshot && (
                <p className="mt-4 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Profile was linked but GrowQR was unreachable at submit time, so no details were captured.
                  Open the profile link for the live version.
                </p>
              )}

              {snapshot?.captured_at && (
                <p className="mt-4 text-[12px] text-ink-4">
                  Captured {new Date(snapshot.captured_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.
                  The live profile may have changed since.
                </p>
              )}
            </>
          )}
        </div>

        {/* Assessment from the GrowQR app, then the human rounds that follow */}
        <InternshipInterviewCard
          applicationId={app.id}
          candidateName={app.full_name}
          preferredRole={app.preferred_role}
          interviews={interviews}
        />

        {/* Appointment letter: the last step, once the decision is made */}
        <InternshipAppointmentCard
          applicationId={app.id}
          preferredRole={app.preferred_role}
          appointment={appointment}
        />

        {/* Links & resume */}
        <div className={CARD}>
          <h2 className={`${HEADING} mb-4`}>Links &amp; Resume</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">GrowQR Profile</p>
              {app.growqr_profile_url ? (
                <a href={app.growqr_profile_url} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-orange-lighter text-orange text-[14px] hover:bg-orange-light transition-colors">
                  <span className="flex items-center gap-1.5">
                    View
                    {app.growqr_rq_score !== null && (
                      <span className="font-semibold">RQ {app.growqr_rq_score}</span>
                    )}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not linked</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">LinkedIn</p>
              {app.linkedin ? (
                <a href={app.linkedin} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[14px] hover:bg-blue-100 transition-colors">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Portfolio</p>
              {app.portfolio ? (
                <a href={app.portfolio} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-[14px] hover:bg-violet-100 transition-colors">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Resume</p>
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-orange-lighter text-orange text-[14px] hover:bg-orange-light transition-colors">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> View</span> <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Motivation */}
        <div className={CARD}>
          <h2 className={`${HEADING} mb-4`}>Application Answers</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-ink mb-1.5">Why do you want to intern with GrowQR?</p>
              <p className="text-[14px] md:text-[15px] text-ink-2 leading-relaxed">{app.why_intern}</p>
            </div>
            {app.additional_notes && (
              <div>
                <p className="text-[13px] font-semibold text-ink mb-1.5">Anything else?</p>
                <p className="text-[14px] md:text-[15px] text-ink-2 leading-relaxed">{app.additional_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Everything the candidate typed into the form. Least-read section, so
            it sits last rather than at the top where it used to be. */}
        <div className={CARD}>
          <h2 className={`${HEADING} mb-4`}>Candidate Details</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="College" value={app.college} />
            <Field label="Campus Location" value={app.college_location} />
            <Field label="Course" value={app.course} />
            <Field label="Degree Specialization" value={app.degree_specialization} />
            <Field label="Graduation Year" value={app.graduation_year} />
            <Field label="Preferred Role" value={app.preferred_role} />
            <Field label="Mode" value={MODE_LABEL[app.mode ?? ""] ?? app.mode} />
            <Field label="Duration" value={DURATION_LABEL[app.duration ?? ""] ?? app.duration} />
            <Field label="Availability" value={AVAILABILITY_LABEL[app.availability] ?? app.availability} />
            <Field label="Languages" value={app.languages} />
            <Field label="Career Profile Score" value={app.career_profile_score?.toString() ?? null} />
            <Field label="Skills" value={app.skills} />
            <Field label="Gender" value={GENDER_LABEL[app.gender ?? ""] ?? app.gender} />
            <Field label="Date of Birth" value={formatDob(app.dob)} />
            <Field label="Father's Name" value={app.father_name} />
            <Field label="Mother's Name" value={app.mother_name} />
            <Field label="Aadhaar Number" value={app.aadhaar_number} />
            <Field label="Home Town" value={app.home_town} />
            <Field label="Current Address" value={app.current_address} />
          </div>
        </div>
      </div>
    </main>
  );
}
