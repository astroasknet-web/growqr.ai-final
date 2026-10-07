import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "./admin-allowlist";

/**
 * Resolve the current request's authenticated user IF they are an authorized
 * admin. Returns null otherwise (not signed in, or signed in but not on the
 * admin allowlist). Use from route handlers and server actions.
 */
export async function getAdminUser(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a context where cookies are read-only (e.g. some
          // server-action paths). Token refresh writes can be safely ignored.
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) return null;
  return user;
}
