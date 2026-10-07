export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { buildConsentUrl, isGoogleConnectEnabled } from "@/lib/google/calendar";
import { getAdminUser } from "@/lib/auth/admin";
import { rateLimit, rateLimited } from "@/lib/rate-limit";

// GET /api/google/connect?expert=<slug>
// Starts the one-time Google Calendar consent. Omit `expert` to connect the
// shared V1 account (the GrowQR calendar used for all experts).
//
// Off by default — completing consent replaces the stored refresh token, and
// the calendar is already connected. See isGoogleConnectEnabled(). When it is
// switched on, the shared "default" account is additionally admin-only: it
// skips the callback's expected-email gate, so anyone completing the flow would
// otherwise repoint every Meet link at their own calendar.
export async function GET(req: NextRequest) {
  // 404, not 403: a disabled route shouldn't advertise that it exists.
  if (!isGoogleConnectEnabled()) return new NextResponse(null, { status: 404 });

  const limit = await rateLimit(req, { key: "google-connect", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  try {
    const slug = new URL(req.url).searchParams.get("expert");
    const state = slug && slug.trim() ? slug.trim() : "default";

    if (state === "default" && !(await getAdminUser())) {
      return NextResponse.json(
        { status: "error", error: "Admin sign-in required to connect the shared calendar." },
        { status: 403 },
      );
    }

    return NextResponse.redirect(buildConsentUrl(state));
  } catch (err) {
    // Log the detail; don't hand internals to the caller.
    const message = err instanceof Error ? err.message : "Failed to start Google connect";
    console.error("[google/connect]", message);
    return NextResponse.json({ status: "error", error: "Failed to start Google connect" }, { status: 500 });
  }
}
