"use server";

import {
  insertRegistration,
  markConfirmationSent,
} from "../services/registrations.service";
import { getActiveEventBySlug } from "../services/events.service";
import { buildRegistrationConfirmationEmail } from "../emails/registrationConfirmation";
import {
  getResend,
  EVENTS_FROM_EMAIL,
  EVENTS_REPLY_TO,
} from "@/lib/resend";
import { verifyTurnstile } from "@/lib/turnstile";
import type { RegistrationResult } from "../types/event";

interface ActionInput {
  slug: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  expectations?: string;
  token?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerForEvent(
  input: ActionInput,
): Promise<RegistrationResult> {
  // 1. Validate inputs
  const fullName = input.fullName?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";
  const company = input.company?.trim() ?? "";
  const expectations = input.expectations?.trim() ?? "";

  if (!fullName || !email || !phone) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  // 1b. Turnstile bot check. Always verified: a missing token used to skip this
  // entirely, so omitting the field was enough to walk past it.
  if (!(await verifyTurnstile(input.token, "registerForEvent"))) {
    return { ok: false, error: "Security check failed. Please try again." };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (fullName.length > 120 || company.length > 160) {
    return { ok: false, error: "One of your inputs is too long." };
  }
  if (expectations.length > 1000) {
    return { ok: false, error: "Expectations are too long (max 1000 chars)." };
  }

  // 2. Resolve event
  const event = await getActiveEventBySlug(input.slug);
  if (!event) {
    return { ok: false, error: "This event is no longer available." };
  }

  // 2b. Reject registrations for events that have already taken place.
  const todayKey = new Date().toISOString().split("T")[0];
  if (event.event_date && event.event_date < todayKey) {
    return { ok: false, error: "This event has already taken place." };
  }

  // 3. Insert
  const insert = await insertRegistration(
    {
      event_id: event.id,
      full_name: fullName,
      email,
      phone,
      company: company || null,
      expectations: expectations || null,
    },
    event,
  );

  if (insert.duplicate) {
    return {
      ok: true,
      alreadyRegistered: true,
    };
  }
  if (insert.capacityReached) {
    return {
      ok: false,
      error: "This event has reached capacity. Join the next one!",
    };
  }
  if (!insert.inserted || !insert.registrationId) {
    return {
      ok: false,
      error: "Couldn't save your registration. Please try again.",
    };
  }

  // 4. Send confirmation email (failure here shouldn't fail the registration)
  try {
    const { subject, html, text } = buildRegistrationConfirmationEmail({
      attendeeName: fullName,
      event,
    });
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EVENTS_FROM_EMAIL,
      to: email,
      replyTo: EVENTS_REPLY_TO,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("Resend send error:", error);
    } else {
      await markConfirmationSent(insert.registrationId);
    }
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }

  return { ok: true };
}
