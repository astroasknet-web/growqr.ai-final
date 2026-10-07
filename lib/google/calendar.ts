import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "../supabase-server";

/* ────────────────────────────────────────────────────────────────
   Google Calendar helper (Expert Booking)

   Access model: ONE shared connection — the GrowQR company account
   (expert_slug = null), reached through a stored OAuth refresh token
   from a one-time consent. It hosts every Meet, with the client and
   the expert added as attendees. Experts do not connect their own
   calendars: availability is rule-based (features/experts/services/
   slots.ts) and never reads Google free/busy. The expert_slug column
   is the seam if per-expert connections are ever wanted.
──────────────────────────────────────────────────────────────── */

/**
 * The OAuth connect + callback routes are disabled unless this is explicitly
 * "true". Consent on the shared ("default") account overwrites the stored
 * refresh token, so whoever completes the flow last owns every future Meet
 * link — including an admin who picks the wrong Google account by accident.
 * The connection is already made, so the flow stays off until it's needed.
 *
 * To reconnect: set GOOGLE_CONNECT_ENABLED=true in Vercel, redeploy, sign in
 * as an admin, run the flow, then unset it and redeploy again.
 */
export function isGoogleConnectEnabled(): boolean {
  return process.env.GOOGLE_CONNECT_ENABLED === "true";
}

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
// `openid` + email let us record which account connected; calendar is the functional scope.
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  GOOGLE_CALENDAR_SCOPE,
];

export type CalendarConnection = {
  id: string;
  expert_slug: string | null;
  google_email: string | null;
  google_refresh_token: string | null;
};

/** Shape of an excluded interval in slots.ts. No Google free/busy call feeds it. */
export type BusyInterval = { start: string; end: string };

/** Build a bare OAuth2 client from env (no credentials attached). */
export function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth env vars not configured");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Consent URL for a one-time calendar authorization. `state` carries the expert slug (or "default"). */
export function buildConsentUrl(state: string): string {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh_token even on re-consent
    scope: GOOGLE_OAUTH_SCOPES,
    state,
  });
}

/**
 * Resolve the single shared GrowQR company calendar connection (expert_slug = null).
 * All Meet events are created from this one account, with the client and the expert
 * added as attendees. Returns null if the company calendar hasn't been connected yet.
 */
export async function getCompanyConnection(): Promise<CalendarConnection | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("calendar_connections")
    .select("id, expert_slug, google_email, google_refresh_token")
    .eq("is_active", true)
    .is("expert_slug", null)
    .maybeSingle();

  if (error) {
    console.error("[google/calendar] getCompanyConnection error:", error.message);
    return null;
  }
  return (data as CalendarConnection | null) ?? null;
}

/** Authed OAuth2 client for a connection (uses its refresh token). */
function authedClient(conn: CalendarConnection): OAuth2Client {
  if (!conn.google_refresh_token) {
    throw new Error("Calendar connection has no refresh token");
  }
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: conn.google_refresh_token });
  return client;
}

/**
 * Create a calendar event with a Google Meet link. Returns the event id + Meet
 * link.
 *
 * Writes to the connection's `primary` calendar by default. Pass `calendarId`
 * to land the event on a specific secondary calendar the same account owns —
 * internship interviews use this to sit on their own calendar rather than mixed
 * in with expert bookings, so HR can watch just that one. A Meet link is still
 * created on a secondary calendar; the account is the conference organiser
 * either way.
 */
export async function createMeetEvent(
  conn: CalendarConnection,
  opts: {
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    timeZone?: string;
    attendees: string[];
    /** Target calendar id. Defaults to the connection's primary calendar. */
    calendarId?: string;
  },
): Promise<{ eventId: string; meetLink: string | null }> {
  const calendar = google.calendar({ version: "v3", auth: authedClient(conn) });
  const requestId = `growqr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const res = await calendar.events.insert({
    calendarId: opts.calendarId?.trim() || "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startISO, timeZone: opts.timeZone ?? "Asia/Kolkata" },
      end: { dateTime: opts.endISO, timeZone: opts.timeZone ?? "Asia/Kolkata" },
      attendees: opts.attendees.filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const event = res.data;
  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
    null;

  return { eventId: event.id ?? "", meetLink };
}
