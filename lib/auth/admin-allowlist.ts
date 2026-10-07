import type { User } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────────
   Admin check — pure logic, no next/headers import so it is safe to
   use from Edge middleware as well as Node route handlers / server
   actions.

   Authorization model:
   - Admin status lives entirely in Supabase, on the user's own
     app_metadata (`{ is_admin: true }`). app_metadata can only be set
     via the service role (see scripts or the Supabase dashboard), so
     users can never grant themselves access.
   - app_metadata is embedded in the session JWT, so this check never
     needs a network round trip.
──────────────────────────────────────────────────────────────── */

/** True if the given (already-authenticated) user is an authorized admin. */
export function isAdminUser(user: User | null | undefined): boolean {
  return user?.app_metadata?.is_admin === true;
}
