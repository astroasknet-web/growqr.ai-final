export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient, isGoogleConnectEnabled } from "@/lib/google/calendar";
import { createAdminClient } from "@/lib/supabase-server";
import { getExpertBySlug } from "@/features/experts/data/experts-data";
import { getAdminUser } from "@/lib/auth/admin";

// GET /api/google/callback?code=...&state=<slug|default>
// Exchanges the code for a refresh token and stores the calendar connection.
export async function GET(req: NextRequest) {
  // Checked here too, not just on /connect: this URL is reachable directly, so
  // gating only the consent link would leave the token write open.
  if (!isGoogleConnectEnabled()) return new NextResponse(null, { status: 404 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") ?? "default";
  const oauthError = searchParams.get("error");

  // Render outcomes on the branded /experts/connect page (UI only — no logic change).
  const expertForLink = state === "default" ? undefined : state;
  const result = (params: { status: "success" | "error"; email?: string; message?: string }) => {
    const url = new URL("/experts/connect", req.url);
    url.searchParams.set("status", params.status);
    if (params.email) url.searchParams.set("email", params.email);
    if (params.message) url.searchParams.set("message", params.message);
    if (expertForLink) url.searchParams.set("expert", expertForLink);
    return NextResponse.redirect(url);
  };

  // Google redirects back with ?error=... when the user denies or consent fails.
  if (oauthError) {
    return result({ status: "error", message: `Google returned: ${oauthError}` });
  }

  if (!code) {
    return result({
      status: "error",
      message: "Missing authorization code. Please start from your calendar connect link.",
    });
  }

  // Re-check admin here, not just on /connect: this URL is reachable directly,
  // so gating only the consent link would leave the shared-account write open.
  if (state === "default" && !(await getAdminUser())) {
    return result({
      status: "error",
      message: "Admin sign-in is required to connect the shared calendar. Nothing was changed.",
    });
  }

  try {
    const oauth = getOAuthClient();
    const { tokens } = await oauth.getToken(code);

    if (!tokens.refresh_token) {
      return result({
        status: "error",
        message: "No refresh token returned. Remove this app's access in your Google Account and connect again.",
      });
    }

    // Identify the connected Google account (email + verification status).
    oauth.setCredentials(tokens);
    let googleEmail: string | null = null;
    let emailVerified = false;
    try {
      const me = await google.oauth2({ version: "v2", auth: oauth }).userinfo.get();
      googleEmail = me.data.email ?? null;
      emailVerified = me.data.verified_email === true;
    } catch (e) {
      console.warn("[google/callback] Could not read account email:", e);
    }

    const expertSlug = state === "default" ? null : state;
    const db = createAdminClient();

    // ── Expected-email gate (expert connections only) ──────────────────────
    // Only the email stored on the expert's profile may connect to that
    // profile. On any mismatch we return early — before any DB write — so an
    // existing, valid connection is never touched. The shared "default"
    // account is admin-managed and intentionally skips this check.
    if (expertSlug !== null) {
      const expert = getExpertBySlug(expertSlug);
      if (!expert) {
        return result({ status: "error", message: `Unknown expert "${expertSlug}". Calendar was not connected.` });
      }
      const expected = expert.email?.trim().toLowerCase() ?? "";
      const actual = googleEmail?.trim().toLowerCase() ?? "";

      if (!expected) {
        return result({ status: "error", message: `No expected email is configured for ${expert.name}. Calendar was not connected.` });
      }
      if (!actual || !emailVerified) {
        return result({
          status: "error",
          message: `Could not read a verified email from this Google account. Sign in with ${expert.email} and try again. Nothing was changed.`,
        });
      }
      if (actual !== expected) {
        return result({
          status: "error",
          message: `This link is for ${expert.email} — you signed in as ${googleEmail}. Please sign in with the correct Google account. Your existing connection was not changed.`,
        });
      }
    }

    // Upsert by slug (the expression unique index can't be targeted by onConflict).
    const matchQuery = db.from("calendar_connections").select("id");
    const match = await (expertSlug === null
      ? matchQuery.is("expert_slug", null)
      : matchQuery.eq("expert_slug", expertSlug)
    ).maybeSingle();

    const payload = {
      expert_slug: expertSlug,
      google_email: googleEmail,
      google_refresh_token: tokens.refresh_token,
      is_active: true,
      connected_at: new Date().toISOString(),
    };

    if (match.data?.id) {
      await db.from("calendar_connections").update(payload).eq("id", match.data.id);
    } else {
      await db.from("calendar_connections").insert(payload);
    }

    return result({ status: "success", email: googleEmail ?? undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth callback failed";
    console.error("[google/callback]", message);
    return result({ status: "error", message });
  }
}
