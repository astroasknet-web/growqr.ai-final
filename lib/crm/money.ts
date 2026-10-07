import { all, one, run } from "../portal/db";
import { find, log, move, stageIndex } from "./leads";
import { markPaid } from "./verify";

/** Fees due and received per lead (port of Crm\Money). Verification fees are paid by the student and also appear here as revenue held for the partner. */
export const KINDS: Record<string, string> = { service_fee: "Service fee", deposit: "Deposit", tuition: "Tuition assistance", verification: "Verification fee (student-paid)", other: "Other" };
export const METHODS: Record<string, string> = { cash: "Cash", upi: "UPI", bank: "Bank transfer", card: "Card", razorpay: "Online (Razorpay)" };

export interface Payment { id: number; lead_id: number; kind: string; amount_inr: number; status: string; due_on: string | null; received_on: string | null; method: string; reference: string; note: string; verification_id: number | null; order_id: string | null; payment_id: string | null; recorded_by: number | null; created_at: string }

export const forLead = (leadId: number): Promise<Payment[]> => all<Payment>("SELECT * FROM crm_payments WHERE lead_id = $1 ORDER BY created_at DESC, id DESC", [leadId]);

const inr = (n: number): string => n.toLocaleString("en-US");
const date = (v: unknown): string | null => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : null);

export async function add(leadId: number, kind: string, amount: number, statusIn: string, dueOn: string | null, method: string, ref: string, note: string, actor: number): Promise<string | null> {
  if (!KINDS[kind] || kind === "verification") return "Choose a fee type. Verification fees are created automatically.";
  if (!(amount >= 1 && amount <= 50000000)) return "Enter an amount in rupees.";
  const status = statusIn === "received" ? "received" : "due";
  await run("INSERT INTO crm_payments (lead_id, kind, amount_inr, status, due_on, received_on, method, reference, note, recorded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [
    leadId, kind, Math.trunc(amount), status, date(dueOn), status === "received" ? new Date().toISOString().slice(0, 10) : null, METHODS[method] ? method : "", Array.from(ref).slice(0, 80).join(""), Array.from(note).slice(0, 255).join(""), actor,
  ]);
  await log(leadId, actor, "system", `${KINDS[kind]} INR ${inr(amount)}${status === "received" ? " received." : " raised as due."}`);
  if (status === "received" && kind === "deposit") await liftStage(leadId, actor);
  return null;
}

/** Mark a due payment received (staff). A verification fee also releases that verification to the partner. */
export async function receive(paymentId: number, method: string, ref: string, actor: number): Promise<string | null> {
  const p = await one<Payment>("SELECT * FROM crm_payments WHERE id = $1", [paymentId]);
  if (!p || p.status !== "due") return "That payment is not waiting to be received.";
  await run("UPDATE crm_payments SET status = 'received', received_on = CURRENT_DATE, method = $1, reference = $2, recorded_by = $3 WHERE id = $4 AND status = 'due'", [METHODS[method] ? method : "", Array.from(ref).slice(0, 80).join(""), actor, paymentId]);
  await log(p.lead_id, actor, "system", `${KINDS[p.kind]} INR ${inr(Number(p.amount_inr))} received (${METHODS[method] ?? "recorded"}).`);
  if (p.kind === "verification" && p.verification_id) await markPaid(Number(p.verification_id), actor, METHODS[method] ?? "desk");
  if (p.kind === "deposit") await liftStage(p.lead_id, actor);
  return null;
}

async function liftStage(leadId: number, actor: number): Promise<void> {
  const lead = await find(leadId);
  if (lead && !["lost", "on_hold"].includes(lead.stage) && stageIndex(lead.stage) < stageIndex("deposit_paid")) await move(leadId, "deposit_paid", actor, "automatic from deposit received");
}

export async function summary(leadId: number): Promise<{ received: number; due: number }> {
  const r = await one<{ received: number; due: number }>("SELECT COALESCE(SUM(CASE WHEN status = 'received' THEN amount_inr END), 0) AS received, COALESCE(SUM(CASE WHEN status = 'due' THEN amount_inr END), 0) AS due FROM crm_payments WHERE lead_id = $1", [leadId]);
  return { received: Number(r?.received ?? 0), due: Number(r?.due ?? 0) };
}
