import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/seo";
import { emailLogo } from "@/lib/email/logo";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { CURRENT_COHORT } from "@/lib/cohorts";

const FROM_EMAIL = "GrowQR | Ambassadors <hello@growqr.ai>";
const TEAM_EMAIL = "support@growqr.ai";

interface AmbassadorApplication {
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  studentId: string;
  gender: string;
  aadhaarNumber: string;
  college: string;
  collegeLocation: string;
  course: string;
  passingYear: string;
  homeTown: string;
  currentAddress: string;
  linkedin: string;
  instagram?: string;
  youtube?: string;
  resume: string;
  whyJoin: string;
  whyFit: string;
  ledSomething: string;
  experience?: string;
}

const GENDER_VALUES = ["male", "female"] as const;

/**
 * Internal notification. Plain and dense on purpose: it exists so a reviewer can
 * triage from their inbox and click through, not to look like a product email.
 */
function buildTeamEmail(d: {
  fullName: string; email: string; phone: string; college: string;
  collegeLocation: string; course: string; passingYear: string;
  linkedin: string; whyJoin: string;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#8A8A8A;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>` +
    `<td style="padding:6px 0;color:#1A1A1A;font-size:13px;">${escapeHtml(value)}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
    <tr><td>
      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8A8A8A;">New ambassador application</p>
      <p style="margin:0 0 20px 0;font-size:20px;font-weight:600;color:#1A1A1A;">${escapeHtml(d.fullName)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        ${row("Email", d.email)}
        ${row("Phone", d.phone)}
        ${row("College", d.college)}
        ${row("Location", d.collegeLocation)}
        ${row("Course", d.course)}
        ${row("Passing year", d.passingYear)}
        ${row("LinkedIn", d.linkedin)}
      </table>
      <p style="margin:20px 0 6px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8A8A8A;">Why they want to join</p>
      <p style="margin:0 0 24px 0;font-size:14px;line-height:1.65;color:#333333;">${escapeHtml(d.whyJoin)}</p>
      <a href="${SITE_URL}/admin/ambassador" style="display:inline-block;background:#FF6A2F;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">Review in admin</a>
    </td></tr>
  </table>
</body></html>`;
}

function buildUserEmail(name: string) {
  const firstName = escapeHtml(name.split(" ")[0]);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:24px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td align="center" style="padding:6px 0 16px 0;">
          ${emailLogo({ width: 140, align: "center" })}
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#111827;">Hi ${firstName},</p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            Thanks for applying to the <strong style="color:#111827;">GrowQR AI Global Campus Program!</strong>
          </p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            We've received your application successfully. Our team is reviewing it, and if shortlisted, we'll get back to you within <strong style="color:#111827;">2 business days</strong> with the next steps.
          </p>
          <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            Meanwhile, stay tuned, exciting things are ahead.
          </p>
          <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:600;">Warm regards,</p>
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:700;">Team GrowQR</p>
            <p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">Building AI-ready talent, campus by campus</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "send-ambassador", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body: AmbassadorApplication & {
      token?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    } = await req.json();
    const { token, utmSource, utmMedium, utmCampaign, ...data } = body;

    // Required field validation
    const requiredFields: [keyof AmbassadorApplication, string][] = [
      ["fullName", "Full Name"],
      ["email", "Email Address"],
      ["phone", "Contact Number"],
      ["whatsapp", "WhatsApp Number"],
      ["studentId", "Student ID"],
      ["gender", "Gender"],
      ["aadhaarNumber", "Aadhaar Number"],
      ["college", "College Name"],
      ["collegeLocation", "Campus Location"],
      ["course", "Course"],
      ["passingYear", "Passing Year"],
      ["homeTown", "Home Town"],
      ["currentAddress", "Current Address"],
      ["linkedin", "LinkedIn Profile"],
      ["resume", "Resume Link"],
      ["whyJoin", "Why do you want to join?"],
      ["whyFit", "What makes you a great fit?"],
      ["ledSomething", "Have you led or organized something?"],
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
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

    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(data.linkedin.trim())) {
      return NextResponse.json({ error: "LinkedIn URL must start with https://" }, { status: 400 });
    }
    if (!data.resume?.trim()) {
      return NextResponse.json({ error: "Resume is required." }, { status: 400 });
    }
    if (data.youtube?.trim() && !urlRegex.test(data.youtube.trim())) {
      return NextResponse.json({ error: "YouTube link must start with https://" }, { status: 400 });
    }
    if (!["yes", "no"].includes(data.ledSomething)) {
      return NextResponse.json(
        { error: "Please select yes or no for the leadership question." },
        { status: 400 }
      );
    }

    // Demo mode (no Supabase configured): accept without verifying/persisting.
    if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

    // Turnstile
    if (!(await verifyTurnstile(token, "Ambassador"))) {
      return NextResponse.json(
        { error: "Security check failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    // Persist to Supabase — duplicate email returns 409
    // Service role, not the anon key: the anon INSERT policy this used to rely
    // on let anyone post straight to PostgREST and bypass the Turnstile check
    // above. Revoked in migration 0021, so this route is the only way in.
    // Fail closed. This used to be `if (url && key) { …insert… }`, which meant a
    // deploy missing either variable skipped the insert entirely, sent the
    // applicant a confirmation email, and returned success — the application was
    // simply gone, with nothing in the logs to say so. An applicant who is told
    // they applied and never hears again is the worst outcome this route has.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "Ambassador submit: Supabase env missing — refusing the application rather than dropping it",
      );
      return NextResponse.json(
        { error: "We couldn't submit your application right now. Please try again shortly." },
        { status: 500 },
      );
    }

    const supabase = createAdminClient();

    // Phone has no DB-level unique constraint (the live table already has
    // legitimate duplicate phone numbers from before this check existed, so
    // adding one needs a data cleanup decision first). This pre-insert
    // lookup enforces uniqueness for new submissions going forward; it has
    // the usual check-then-insert race window under concurrent duplicate
    // submits, which a hard constraint wouldn't.
    const { data: existingPhone } = await supabase
      .from("ambassador_applications")
      .select("id")
      .eq("phone", data.phone.trim())
      .limit(1)
      .maybeSingle();
    if (existingPhone) {
      return NextResponse.json(
        { error: "This phone number is already registered." },
        { status: 409 }
      );
    }

    let dbError: any = null;
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      attempt++;
      const { error } = await supabase.from("ambassador_applications").insert([{
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        student_id: data.studentId.trim(),
        gender: data.gender,
        aadhaar_number: data.aadhaarNumber.replace(/\D/g, "").slice(0, 12),
        college: data.college.trim(),
        college_location: data.collegeLocation.trim().slice(0, 200),
        course: data.course.trim(),
        passing_year: data.passingYear.trim(),
        home_town: data.homeTown.trim().slice(0, 200),
        current_address: data.currentAddress.trim().slice(0, 500),
        linkedin: data.linkedin.trim(),
        instagram: data.instagram?.trim() || null,
        youtube: data.youtube?.trim() || null,
        resume: data.resume.trim(),
        why_join: data.whyJoin.trim(),
        why_fit: data.whyFit.trim(),
        led_something: data.ledSomething,
        experience: data.experience?.trim() || null,
        // Which intake this application belongs to. Written explicitly rather
        // than leaning on the column default so the live cohort is visible in
        // lib/cohorts.ts, not buried in a migration.
        cohort: CURRENT_COHORT,
        // UTM attribution — which ambassador's referral link this came through
        utm_source: utmSource?.trim().slice(0, 200) || null,
        utm_medium: utmMedium?.trim().slice(0, 200) || null,
        utm_campaign: utmCampaign?.trim().slice(0, 200) || null,
      }]);

      dbError = error;

      if (!error) break; // Success
      
      // 23505 = unique_violation (duplicate email). Don't retry on this.
      if (error.code === "23505") break;

      // Exponential backoff for network/timeout errors
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }

    if (dbError) {
      if (dbError.code === "23505") {
        const isAadhaar = dbError.message?.includes("_aadhaar_number_key") || dbError.details?.includes("(aadhaar_number)");
        return NextResponse.json(
          {
            error: isAadhaar
              ? "This Aadhaar number is already registered."
              : "This email is already registered.",
          },
          { status: 409 }
        );
      }
      console.error(`Ambassador Supabase insert error after ${maxRetries} attempts:`, dbError);
      return NextResponse.json(
        { error: "Failed to save application due to a network error. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant. Non-fatal if it fails: the
    // application row is already committed above, so letting a Resend outage
    // throw would return "Failed to submit application. Please try again." for
    // a submission that actually succeeded. The applicant then retries, hits
    // the duplicate-email 409, and reasonably concludes they never got in —
    // which is exactly how a real applicant goes missing. Same tradeoff the
    // internship and ambassador-waitlist routes already make.
    // Team notification. TEAM_EMAIL was declared here and never used, so nothing
    // told anyone an application had arrived — reviewers had to remember to open
    // /admin/ambassador and look. Sent independently of the applicant email
    // below so one bounce cannot suppress the other.
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: TEAM_EMAIL,
        replyTo: data.email.trim(),
        subject: `New ambassador application: ${data.fullName.trim()} (${data.college.trim()})`,
        html: buildTeamEmail(data),
      });
    } catch (emailErr) {
      console.error(
        "Ambassador team notification failed (application WAS saved) for",
        data.email.trim(),
        emailErr,
      );
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: data.email.trim(),
        subject: "Your GrowQR AI Global Campus Program Application is Received",
        html: buildUserEmail(data.fullName.trim()),
      });
    } catch (emailErr) {
      console.error(
        "Ambassador confirmation email failed (application WAS saved) for",
        data.email.trim(),
        emailErr,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Ambassador submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
