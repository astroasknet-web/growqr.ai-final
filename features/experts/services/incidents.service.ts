import { createAdminClient } from "@/lib/supabase-server";

export type IncidentKind =
  | "amount_mismatch"
  | "verify_failed"
  | "invalid_slot"
  | "slot_taken_after_payment"
  | "booking_insert_failed"
  | "calendar_failed";

export interface PaymentIncidentInput {
  kind: IncidentKind;
  expert_slug?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  start_time?: string | null;
  amount_inr?: number | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  detail?: string | null;
}

/**
 * Record a payment incident — a captured payment that did not result in a
 * clean booking. Best-effort: never throws, so it can sit on any failure path
 * without risking the response. These rows are the manual-refund / recovery
 * queue until the full webhook reconciliation lands.
 */
export async function recordPaymentIncident(
  input: PaymentIncidentInput,
): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("payment_incidents").insert({
      kind: input.kind,
      expert_slug: input.expert_slug ?? null,
      user_email: input.user_email ?? null,
      user_name: input.user_name ?? null,
      start_time: input.start_time ?? null,
      amount_inr: input.amount_inr ?? null,
      razorpay_order_id: input.razorpay_order_id ?? null,
      razorpay_payment_id: input.razorpay_payment_id ?? null,
      detail: input.detail ?? null,
    });
    if (error) {
      console.error("[incidents] insert failed:", error.message, "kind:", input.kind);
    }
  } catch (err) {
    console.error("[incidents] unexpected error:", err);
  }
}
