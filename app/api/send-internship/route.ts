import { NextRequest, NextResponse, after } from "next/server";
import { Resend } from "resend";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { escapeHtml } from "@/lib/escape-html";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  parseGrowqrProfileId,
  fetchGrowqrProfile,
  growqrProfileUrl,
  buildProfileSnapshot,
} from "@/lib/growqr-profile";
import type { TablesInsert } from "@/types/database";
import { PREFERRED_ROLES, AVAILABILITY_VALUES, MODE_VALUES, DURATION_VALUES, DEGREE_SPECIALIZATIONS } from "@/lib/internship-options";
import { isValidIndianMobile } from "@/lib/phone";
import { triageFor } from "@/lib/internship/triage";
import { getInternshipSettings, roundTypeForRole } from "@/lib/internship/settings";
import { dobError } from "@/lib/dob";
import { interviewInvite } from "@/lib/internship/emails";
import { sendInternshipEmail } from "@/lib/internship/send-email";
import {
  interviewApiConfigured,
  resolveAccountEmail,
  assignInterview,
} from "@/lib/internship/growqr-interview-api";
import { assessmentUrlFor } from "@/lib/internship/interviews";
import { SITE_URL } from "@/lib/seo";
import { EMAIL_LOGO_URL } from "@/lib/email/logo";

const FROM_EMAIL = "GrowQR | Careers <hello@growqr.ai>";

// Canonical lists live in lib/internship-options.ts, shared with the apply
// form and the admin filters so a value can't drift between the three.
const PREFERRED_ROLE_VALUES = PREFERRED_ROLES;

interface InternshipApplication {
  growqrProfileUrl: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  aadhaarNumber: string;
  dob: string;
  fatherName: string;
  motherName: string;
  college: string;
  collegeLocation: string;
  course: string;
  degreeSpecialization: string;
  graduationYear: string;
  homeTown: string;
  currentAddress: string;
  preferredRole: string;
  skills: string;
  availability: string;
  mode: string;
  duration: string;
  languages: string;
  careerProfileScore?: string;
  linkedin?: string;
  portfolio?: string;
  resume: string;
  whyIntern: string;
  additionalNotes?: string;
}

const GENDER_VALUES = ["male", "female"] as const;

function buildUserEmail(name: string) {
  const firstName = escapeHtml(name.split(" ")[0]);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:24px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td align="center" style="padding:6px 0 16px 0;">
          <img src="${EMAIL_LOGO_URL}" width="132" height="66" alt="GrowQR"
               style="display:block;border:0;outline:none;width:132px;height:66px;margin:0 auto;">
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#111827;">Hi ${firstName},</p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            Thanks for applying for an internship at <strong style="color:#111827;">GrowQR!</strong>
          </p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            We've received your application successfully. Our team will review it and reach out if you're shortlisted for the next step.
          </p>
          <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:600;">Warm regards,</p>
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:700;">Team GrowQR</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "send-internship", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body: InternshipApplication & {
      token?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    } = await req.json();
    const { token, utmSource, utmMedium, utmCampaign, ...data } = body;

    // Required field validation
    const requiredFields: [keyof InternshipApplication, string][] = [
      ["growqrProfileUrl", "GrowQR Profile Link"],
      ["fullName", "Full Name"],
      ["email", "Email Address"],
      ["phone", "Phone Number"],
      ["gender", "Gender"],
      ["dob", "Date of Birth"],
      ["fatherName", "Father's Name"],
      ["motherName", "Mother's Name"],
      ["aadhaarNumber", "Aadhaar Number"],
      ["college", "College Name"],
      ["collegeLocation", "Campus Location"],
      ["course", "Course"],
      ["degreeSpecialization", "Degree Specialization"],
      ["graduationYear", "Graduation Year"],
      ["homeTown", "Home Town"],
      ["currentAddress", "Current Address"],
      ["preferredRole", "Preferred Internship Role"],
      ["skills", "Skills"],
      ["availability", "Availability"],
      ["mode", "Preferred Mode"],
      ["duration", "Internship Duration"],
      ["languages", "Languages"],
      ["resume", "Resume"],
      ["whyIntern", "Why do you want to intern with GrowQR?"],
    ];
    const missing = requiredFields
      .filter(([key]) => !data[key]?.trim())
      .map(([, label]) => label);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    // Format validation
    // Parsed before Turnstile because it's a pure string check: no point
    // spending an outbound request on a link that was never well-formed.
    const growqrProfileId = parseGrowqrProfileId(data.growqrProfileUrl);
    if (!growqrProfileId) {
      return NextResponse.json(
        { error: "Enter a valid GrowQR profile link, for example https://app.growqr.ai/p/your-id" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!isValidIndianMobile(data.phone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(data.graduationYear.trim())) {
      return NextResponse.json({ error: "Enter a valid 4-digit graduation year." }, { status: 400 });
    }
    const dobProblem = dobError(data.dob);
    if (dobProblem) {
      return NextResponse.json({ error: `${dobProblem}.` }, { status: 400 });
    }
    if (!(GENDER_VALUES as readonly string[]).includes(data.gender)) {
      return NextResponse.json({ error: "Please select a valid gender option." }, { status: 400 });
    }
    if (!/^\d{12}$/.test(data.aadhaarNumber.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Enter a valid 12-digit Aadhaar number." }, { status: 400 });
    }
    if (data.currentAddress.trim().length < 5) {
      return NextResponse.json({ error: "Enter your full current address." }, { status: 400 });
    }
    if (!(PREFERRED_ROLE_VALUES as readonly string[]).includes(data.preferredRole)) {
      return NextResponse.json({ error: "Please select a valid internship role." }, { status: 400 });
    }
    if (!AVAILABILITY_VALUES.includes(data.availability)) {
      return NextResponse.json({ error: "Please select a valid availability option." }, { status: 400 });
    }
    if (!MODE_VALUES.includes(data.mode)) {
      return NextResponse.json({ error: "Please select a valid mode." }, { status: 400 });
    }
    if (!DURATION_VALUES.includes(data.duration)) {
      return NextResponse.json({ error: "Please select a valid duration." }, { status: 400 });
    }
    if (!(DEGREE_SPECIALIZATIONS as readonly string[]).includes(data.degreeSpecialization)) {
      return NextResponse.json({ error: "Please select a valid degree specialization." }, { status: 400 });
    }
    // Not a required field, so only a supplied value is checked.
    if (data.careerProfileScore?.trim()) {
      const score = Number(data.careerProfileScore);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        return NextResponse.json({ error: "Career profile score must be between 0 and 100." }, { status: 400 });
      }
    }
    const urlRegex = /^https?:\/\/.+/i;
    if (data.linkedin?.trim() && !urlRegex.test(data.linkedin.trim())) {
      return NextResponse.json({ error: "LinkedIn URL must start with https://" }, { status: 400 });
    }
    if (data.portfolio?.trim() && !urlRegex.test(data.portfolio.trim())) {
      return NextResponse.json({ error: "Portfolio link must start with https://" }, { status: 400 });
    }

    // Demo mode (no Supabase configured): accept without verifying/persisting.
    if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

    // Turnstile
    if (!(await verifyTurnstile(token, "Internship"))) {
      return NextResponse.json(
        { error: "Security check failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    // Re-resolve the profile server-side. The browser already did this to
    // prefill the form, but a direct API call could claim any link, so the
    // snapshot and RQ-Score we store must come from our own fetch.
    const profileResult = await fetchGrowqrProfile(growqrProfileId);

    if (profileResult.status === "not_found") {
      return NextResponse.json(
        { error: "We couldn't find that GrowQR profile. Check the link and try again." },
        { status: 400 }
      );
    }

    // `unavailable` means GrowQR was unreachable, not that the link was bad.
    // The id and URL are already known from parsing, so record the application
    // and leave the snapshot to be backfilled rather than losing a submission
    // to a transient outage.
    const profile = profileResult.status === "ok" ? profileResult.profile : null;
    if (!profile) {
      console.error("Internship: GrowQR profile unavailable at submit:", growqrProfileId);
    }

    // One read of the profile's score, used for both the stored column and the
    // triage band so the two can never disagree about what the rule saw.
    const rqScore = typeof profile?.q_score === "number" ? profile.q_score : null;

    // Automation config (HR-set, read once). The band, the confirmation email,
    // the auto-assign and its round all key off this. A DB hiccup falls back to
    // the shipped defaults, so a submission is never lost to a settings read.
    const settings = await getInternshipSettings();
    const band = triageFor(rqScore, settings.shortlistMinRq);

    // Persist to Supabase. Email + phone are both UNIQUE at the DB level
    // (migration 0025). Service role from the start, no anon-insert phase.
    let insertedId: string | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminClient();

      let dbError: any = null;
      let attempt = 0;
      const maxRetries = 3;

      while (attempt < maxRetries) {
        attempt++;
        // Defense in depth: the form caps these client-side to match the DB
        // CHECK constraints, but a direct API call could bypass that. Slice
        // here so an oversized value truncates instead of 500ing on insert.
        const { data: insertedRow, error } = await supabase.from("internship_applications").insert([{
          growqr_user_id: growqrProfileId,
          growqr_profile_url: growqrProfileUrl(growqrProfileId),
          growqr_profile_snapshot: profile ? buildProfileSnapshot(profile) : null,
          growqr_rq_score: rqScore,
          growqr_avatar_url: profile?.avatar_url?.trim() || null,
          // Automatic first pass. Bands the applicant on the RQ-Score we just
          // read ourselves, so HR opens the list already triaged. Deliberately
          // NOT a status: `status` stays 'new' and stays human. See migration
          // 0035 and lib/internship/triage.ts.
          triage: band,
          triage_score: rqScore,
          triaged_at: new Date().toISOString(),
          full_name: data.fullName.trim().slice(0, 200),
          email: data.email.trim().toLowerCase().slice(0, 254),
          phone: data.phone.trim().slice(0, 25),
          gender: data.gender,
          dob: data.dob,
          father_name: data.fatherName.trim().slice(0, 200),
          mother_name: data.motherName.trim().slice(0, 200),
          aadhaar_number: data.aadhaarNumber.replace(/\D/g, "").slice(0, 12),
          college: data.college.trim().slice(0, 300),
          college_location: data.collegeLocation.trim().slice(0, 200),
          course: data.course.trim().slice(0, 200),
          degree_specialization: data.degreeSpecialization.trim().slice(0, 200),
          graduation_year: data.graduationYear.trim(),
          home_town: data.homeTown.trim().slice(0, 200),
          current_address: data.currentAddress.trim().slice(0, 500),
          preferred_role: data.preferredRole.trim().slice(0, 150),
          skills: data.skills.trim().slice(0, 500),
          availability: data.availability,
          mode: data.mode,
          duration: data.duration,
          languages: data.languages.trim().slice(0, 300),
          career_profile_score: data.careerProfileScore?.trim() ? Number(data.careerProfileScore) : null,
          linkedin: data.linkedin?.trim() || null,
          portfolio: data.portfolio?.trim() || null,
          resume: data.resume.trim().slice(0, 500),
          why_intern: data.whyIntern.trim(),
          additional_notes: data.additionalNotes?.trim().slice(0, 2000) || null,
          utm_source: utmSource?.trim().slice(0, 200) || null,
          utm_medium: utmMedium?.trim().slice(0, 200) || null,
          utm_campaign: utmCampaign?.trim().slice(0, 200) || null,
        } satisfies TablesInsert<"internship_applications">]).select("id").single();

        dbError = error;

        if (!error) {
          insertedId = insertedRow?.id ?? null;
          break; // Success
        }

        // 23505 = unique_violation (duplicate email or phone). Don't retry.
        if (error.code === "23505") break;

        // Exponential backoff for network/timeout errors
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }

      if (dbError) {
        if (dbError.code === "23505") {
          let field: "phone" | "aadhaar_number" | "growqr_user_id" | "email" = "email";
          if (dbError.message?.includes("_phone_key") || dbError.details?.includes("(phone)")) field = "phone";
          else if (dbError.message?.includes("_aadhaar_number_key") || dbError.details?.includes("(aadhaar_number)")) field = "aadhaar_number";
          else if (dbError.message?.includes("_growqr_user_id_key") || dbError.details?.includes("(growqr_user_id)")) field = "growqr_user_id";
          const duplicateMessages: Record<typeof field, string> = {
            phone: "This phone number is already registered.",
            aadhaar_number: "This Aadhaar number is already registered.",
            growqr_user_id: "An application already exists for this GrowQR profile.",
            email: "This email is already registered.",
          };
          return NextResponse.json({ error: duplicateMessages[field] }, { status: 409 });
        }
        console.error(`Internship Supabase insert error after ${maxRetries} attempts:`, dbError);
        return NextResponse.json(
          { error: "Failed to save application due to a network error. Please try again." },
          { status: 500 }
        );
      }
    }

    // Send confirmation email to applicant, when HR has that automatic email on.
    // Non-fatal if it fails, the application is already saved (same tradeoff as
    // ambassador-waitlist).
    if (settings.emailApplicationReceived) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: data.email.trim(),
          subject: "Your GrowQR Internship Application is Received",
          html: buildUserEmail(data.fullName.trim()),
        });
      } catch (emailErr) {
        console.error("Internship confirmation email error:", emailErr);
      }
    }

    // Auto-shortlist: a strong applicant (RQ-Score at or above the threshold)
    // is assigned the AI interview and emailed the invite the moment they
    // apply. No HR action needed. This is the whole point of the RQ-Score gate.
    //
    // Runs after the response so the applicant's submit stays fast, and is
    // best-effort: any failure (profile unresolved, service down) is logged and
    // leaves the application saved for HR to invite by hand. Only runs when the
    // interview service is configured; otherwise the manual path stands.
    if (
      insertedId &&
      band === "auto_shortlist" &&
      settings.autoAssignEnabled &&
      interviewApiConfigured()
    ) {
      const applicationId = insertedId;
      const profileId = growqrProfileId;
      const role = data.preferredRole.trim().slice(0, 200);
      const roundType = roundTypeForRole(settings, role);
      const sendInvite = settings.emailInterviewInvite;
      const candidateEmail = data.email.trim().toLowerCase();
      const candidateName = data.fullName.trim();

      after(async () => {
        try {
          const admin = createAdminClient();

          // Resolve the ACCOUNT email (not the form email, not public_email):
          // the interview is assigned to it, and it is cached for later rounds.
          const resolved = await resolveAccountEmail(profileId);
          if (!resolved.ok) {
            console.error("[auto-shortlist] account email unresolved:", resolved.error);
            return;
          }
          const accountEmail = resolved.data;
          await admin
            .from("internship_applications")
            .update({ growqr_account_email: accountEmail })
            .eq("id", applicationId);

          const assigned = await assignInterview({
            role,
            round: roundType,
            emails: [accountEmail],
          });
          if (!assigned.ok) {
            console.error("[auto-shortlist] assign failed:", assigned.error);
            return;
          }
          const first = assigned.data.assignments?.[0];
          if (!first?.assignment_id) {
            console.error("[auto-shortlist] assign returned no assignment id");
            return;
          }

          const now = new Date().toISOString();
          await admin.from("internship_interviews").insert({
            application_id: applicationId,
            growqr_user_id: profileId,
            round: 1,
            kind: "ai_assessment",
            source: "manual",
            status: "invited",
            invited_at: now,
            interview_url: assessmentUrlFor(),
            external_interview_id: first.assignment_id,
            batch_id: assigned.data.batch_id ?? null,
            round_type: roundType,
            target_role: role,
          });

          // The candidate is now interviewing, so move the pipeline forward. The
          // row was just created as 'new', so this is always a forward step.
          await admin
            .from("internship_applications")
            .update({ status: "interview" })
            .eq("id", applicationId);

          // The candidate email announcing the interview goes to the address
          // they applied with (our contact point); the interview itself lives
          // on their GrowQR account. Skipped when HR has this automatic email off.
          if (sendInvite) {
            const invite = interviewInvite(candidateName, role, assessmentUrlFor(), null);
            await sendInternshipEmail({
              applicationId,
              kind: "interview_invite",
              to: candidateEmail,
              subject: invite.subject,
              html: invite.html,
              sentBy: null,
            });
          }
        } catch (e) {
          console.error("[auto-shortlist] unexpected failure:", e);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Internship submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
