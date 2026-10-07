import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/escape-html";
import { emailLogo } from "@/lib/email/logo";
import { createLogger } from "@/lib/log";
import { createFormRoute } from "@/lib/forms/handler";
import { parseNewsletter, type NewsletterSubmission } from "@/lib/forms/schemas";

const FROM_EMAIL = "GrowQR Updates <updates@growqr.ai>";

const log = createLogger("newsletter");

function buildEmails(data: NewsletterSubmission): Array<Promise<unknown>> {
  // Email is best-effort after persistence: a temporary Resend problem must
  // not turn a successfully saved subscription into a misleading failure.
  const safeName = data.name ? ` ${escapeHtml(data.name)}` : "";
  return [
    getResend().emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "Welcome to GrowQR Updates",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 28px;">
            ${emailLogo({ width: 140, align: "center" })}
          </div>

          <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8F5C 100%); padding: 34px; border-radius: 14px 14px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; line-height: 1.25; font-weight: 600;">Thanks for subscribing</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">You are now part of the GrowQR community</p>
          </div>

          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 14px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <p style="color: #111827; font-size: 17px; line-height: 1.6; margin: 0 0 18px 0;">Hello${safeName},</p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0;">
              Welcome to GrowQR. We are excited to share product updates as we build the future of skill identity and verification.
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 6px 0;">Questions? <a href="mailto:support@growqr.ai" style="color: #FF6B35; text-decoration: none;">support@growqr.ai</a></p>
            <p style="margin: 0;">© 2025-2026 GrowQR. All rights reserved.</p>
          </div>
        </div>
      `,
    }),
  ];
}

// POST /api/send-newsletter-subscribe — backs the footer newsletter form.
export const POST = createFormRoute<NewsletterSubmission>({
  key: "newsletter",
  turnstile: {
    label: "Newsletter",
    errorMessage: "Security check failed. Please try again.",
  },
  parse: parseNewsletter,
  persist: async (data) => {
    const admin = createAdminClient();
    const { error } = await admin.from("newsletter_subscribers").insert({
      email: data.email,
      source: data.source,
      subscribed_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already subscribed." }, { status: 409 });
      }
      log.error("insert error:", error);
      return NextResponse.json({ error: "Could not save your subscription." }, { status: 500 });
    }
    return null;
  },
  sideEffects: buildEmails,
  successBody: { success: true, message: "Subscription saved" },
  failureMessage: "Failed to process subscription",
});
