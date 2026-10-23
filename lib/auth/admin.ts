import "server-only";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";

/**
 * The signed-in admin, or null. Admin status is the portal account's role ("admin"): the same staff login as the rest of the
 * portal, with its throttling, human check and two-step sign-in (required for staff). Use from route handlers, server actions and
 * server components.
 */
export interface AdminUser { id: string; email: string }

export async function getAdminUser(): Promise<AdminUser | null> {
  if (!databaseConfigured()) return null;
  const s = await getSession();
  const u = s?.user;
  if (!u || u.role !== "admin") return null;
  return { id: String(u.id), email: u.email };
}
