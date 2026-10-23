import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isDatabaseConfigured } from "@/lib/data/server";
import { Resend } from "resend";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { emailLogo } from "@/lib/email/logo";

const FROM_EMAIL = "GrowQR | Ambassadors <hello@growqr.ai>";

export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "ambassador-waitlist", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  try {
    const { email, token } = await req.json();

    // ── Email validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // Demo mode (no the database configured): accept without verifying/persisting.
    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    // ── Turnstile ─────────────────────────────────────────────────────────────
    if (!(await verifyTurnstile(token, "Ambassador waitlist"))) {
      return NextResponse.json(
        { error: "Security check failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    // ── Persist to the database ───────────────────────────────────────────────────
    // Service role, not the anon key: the anon INSERT policy this used to rely
    // on let anyone post straight to PostgREST and bypass the Turnstile check
    // above. Revoked in migration 0021, so this route is the only way in.
    // Fail closed. This used to be `if (url && key) { …insert… }`, so a deploy
    // missing either variable skipped the insert, still sent the "you're on the
    // waitlist" email, and returned success — leaving someone confidently
    // waiting on a list they were never added to.
    if (!isDatabaseConfigured()) {
      console.error(
        "Ambassador waitlist: the database env missing — refusing the signup rather than dropping it",
      );
      return NextResponse.json(
        { error: "Could not save your email. Please try again." },
        { status: 500 },
      );
    }

    const db = createAdminClient();

    const { error } = await db
      .from("ambassador_waitlist")
      .insert({ email: trimmed });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already subscribed." }, { status: 409 });
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Could not save your email. Please try again." },
        { status: 500 }
      );
    }

    // ── Confirmation email ────────────────────────────────────────────────────
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: trimmed,
        subject: "You're on the GrowQR Ambassador waitlist",
        html: `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:24px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td align="center" style="padding:6px 0 16px 0;">
          ${emailLogo({ width: 140, align: "center" })}
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#111827;">Hi there,</p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            You're on the waitlist for the <strong style="color:#111827;">GrowQR AI Global Campus Ambassador Program.</strong>
          </p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            Applications for Cohort 02 have closed, but we'll notify you the moment the next cohort opens. Stay tuned, big things are ahead.
          </p>
          <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#4b5563;">
            Building AI-ready talent, campus by campus.
          </p>
          <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:600;">Warm regards,</p>
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:700;">Team GrowQR</p>
            <p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">Building AI-ready talent, campus by campus</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding:16px 0 0 0;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? <a href="mailto:support@growqr.ai" style="color:#ff6b35;text-decoration:none;">support@growqr.ai</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      });
    } catch (emailErr) {
      // Email failure is non-fatal — the signup is already saved
      console.error("Waitlist confirmation email error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
