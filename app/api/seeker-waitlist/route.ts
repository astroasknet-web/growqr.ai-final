import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { getResend } from "@/lib/resend";
import { emailLogo } from "@/lib/email/logo";
import { createLogger } from "@/lib/log";
import { createFormRoute } from "@/lib/forms/handler";
import { parseSeekerWaitlist, type SeekerWaitlistSubmission } from "@/lib/forms/schemas";

const FROM_EMAIL = "GrowQR <hello@growqr.ai>";

const log = createLogger("seeker-waitlist");

function buildEmails(data: SeekerWaitlistSubmission): Array<Promise<unknown>> {
  return [
    getResend().emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "You're on the GrowQR early access list",
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
            You're on the <strong style="color:#111827;">GrowQR early access list.</strong> We'll email you the moment self-serve signup opens in your region.
          </p>
          <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:600;">Warm regards,</p>
            <p style="margin:0 0 4px 0;font-size:14px;color:#111827;font-weight:700;">Team GrowQR</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding:16px 0 0 0;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? <a href="mailto:support@growqr.ai" style="color:#ff6b35;text-decoration:none;">support@growqr.ai</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    }),
  ];
}

// POST /api/seeker-waitlist
// Backs the SeekerWaitlistModal shown to visitors in non-live regions.
export const POST = createFormRoute<SeekerWaitlistSubmission>({
  key: "seeker-waitlist",
  turnstile: {
    label: "Seeker waitlist",
    errorMessage: "Security check failed. Please refresh and try again.",
  },
  parse: parseSeekerWaitlist,
  // Fail closed: the UI must never report success (or send a confirmation
  // email) when the signup was not actually saved. createAdminClient throws on
  // missing env vars, surfaced as the route's generic 500.
  persist: async (data, meta) => {
    // Service role, not the anon key. The anon INSERT policy this route used to
    // rely on was reachable by anyone holding the public anon key, which means a
    // bot could post straight to PostgREST and skip both the Turnstile check and
    // the rate limit this pipeline enforces. Writing as the service role lets
    // that policy be revoked (migration 0021) so this route is the ONLY way in.
    //
    // It also removes a workaround: anon had no SELECT policy, so the insert
    // could not RETURN its own id and a second admin-client lookup was needed.
    // crm_sync_status still relies on the DB default 'pending'.
    const db = createAdminClient();
    const { data: inserted, error } = await db
      .from("seeker_waitlist")
      .insert({
        email: data.email,
        source: data.source,
        country_code: meta.countryCode,
        ...meta.attribution,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already on the waitlist." }, { status: 409 });
      }
      log.error("insert error:", error);
      return NextResponse.json(
        { error: "Could not save your email. Please try again." },
        { status: 500 }
      );
    }

    return inserted ? { crmRowId: inserted.id } : null;
  },
  crmSource: "seeker_waitlist",
  sideEffects: buildEmails,
  successBody: { success: true },
  failureMessage: "Something went wrong. Please try again.",
});
