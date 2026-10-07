import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `createClient` throws when `supabaseUrl` is an empty string, which would
 * break the whole page at import time if env vars aren't set (e.g. a fresh
 * clone with no `.env.local`). Fall back to a placeholder URL that's valid
 * enough to instantiate — any real call will still fail with a network
 * error, which is the correct behaviour when credentials are missing.
 *
 * We deliberately don't warn here: the placeholder is a known, documented
 * safe state and Next.js dev-overlay surfaces any `console.warn` from
 * module scope as a red "Issue" pill on every page of the site.
 */
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY = "placeholder-anon-key";

export const supabase = createClient<Database>(
  supabaseUrl || FALLBACK_URL,
  supabaseAnonKey || FALLBACK_KEY,
);