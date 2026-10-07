import "server-only";
import { redirect } from "next/navigation";
import { requireMfaIfStaff, requireUser } from "../portal/guard";
import type { PortalUser } from "../portal/session";
import { levelOf, type Level } from "./access";

/**
 * Every staff CRM page starts here: signed in, staff, two-step login done, and explicitly granted CRM access (port of crm_gate()).
 * Staff without access are sent to a plain explanation page rather than shown an error.
 */
export async function gate(managerOnly = false, here = "/crm"): Promise<{ me: PortalUser; level: Level; manager: boolean }> {
  const me = await requireUser("admin", "counselor");
  await requireMfaIfStaff(me, here);
  const level = await levelOf(me);
  const manager = level === "admin" || level === "manager";
  if (!level || (managerOnly && !manager)) redirect("/crm/denied");
  return { me, level, manager };
}
