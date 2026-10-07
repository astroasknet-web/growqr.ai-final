import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * True when the Supabase environment is configured. Lets read paths degrade
 * gracefully (return empty data) instead of throwing on a deploy that has no
 * Supabase keys yet — e.g. a preview/demo deployment. Once the keys are added
 * the app returns to full function with no code change. The service still
 * throws in createAdminClient/createAnonServerClient below so write paths fail
 * loudly rather than silently dropping data when they DO expect a DB.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

/**
 * Server-side client using the anon key, for tables that are deliberately
 * written under their RLS policies (e.g. seeker_waitlist's anon-insert
 * policy) instead of the service role. Throws when env vars are missing —
 * callers must fail closed rather than silently skip persistence.
 */
export function createAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
