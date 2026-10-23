import "server-only";
import { createAdminClient } from "@/lib/data/server";
import type { EventRow } from "../types/event";

export interface InsertRegistrationArgs {
  event_id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  expectations: string | null;
}

export interface InsertRegistrationResult {
  inserted: boolean;
  registrationId: string | null;
  duplicate: boolean;
  capacityReached: boolean;
  error?: string;
}

/**
 * Insert a registration row. Treats a unique-key violation (23505)
 * as "already registered" rather than an error.
 */
export async function insertRegistration(
  args: InsertRegistrationArgs,
  event: EventRow,
): Promise<InsertRegistrationResult> {
  const db = createAdminClient();

  // Capacity check (soft — race-tolerant; final source of truth is the DB)
  if (event.registration_limit != null) {
    const { count, error: countErr } = await db
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);
    if (countErr) {
      console.error("capacity check error:", countErr);
    } else if ((count ?? 0) >= event.registration_limit) {
      return {
        inserted: false,
        registrationId: null,
        duplicate: false,
        capacityReached: true,
      };
    }
  }

  const { data, error } = await db
    .from("event_registrations")
    .insert(args)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        inserted: false,
        registrationId: null,
        duplicate: true,
        capacityReached: false,
      };
    }
    console.error("insertRegistration error:", error);
    return {
      inserted: false,
      registrationId: null,
      duplicate: false,
      capacityReached: false,
      error: error.message,
    };
  }

  return {
    inserted: true,
    registrationId: data.id,
    duplicate: false,
    capacityReached: false,
  };
}

export async function markConfirmationSent(registrationId: string) {
  const db = createAdminClient();
  const { error } = await db
    .from("event_registrations")
    .update({ confirmation_sent: true })
    .eq("id", registrationId);
  if (error) console.error("markConfirmationSent error:", error);
}
