-- Ledger of every candidate/team email the internship pipeline sends.
--
-- A ledger, not a boolean column on the application: a resend can be
-- legitimate (a candidate lost the mail, an address was corrected), and a
-- boolean silently swallows the second real send. Recording every attempt,
-- sent or failed, means the detail page can show what actually went out and
-- the status dropdown can warn "already sent" without ever blocking a resend.
--
-- Same reasoning as 0019_attendee_notifications for the cal integration.
--
-- No unique on (application_id, kind): dedupe is advisory in the UI, never
-- enforced here.

create table if not exists public.internship_emails (
  id             uuid primary key default gen_random_uuid(),

  application_id uuid not null
                   references public.internship_applications(id) on delete cascade,

  -- 'application_received' | 'final_round' | 'selected' | 'offer'
  --  | 'rejected' | 'appointment_letter' | 'team_alert'
  kind           text not null,

  to_email       text not null,
  subject        text not null,

  -- Resend's message id when the send succeeded, for tracing a delivery.
  resend_id      text,

  status         text not null default 'sent'
                   check (status = any (array['sent','failed'])),
  -- The provider error when status = 'failed'. Null on success.
  error          text,

  -- Admin email for a human-triggered send (a status change, a letter). Null
  -- for a system send (the submit confirmation, the new-application alert).
  sent_by        text,

  created_at     timestamptz not null default now()
);

create index if not exists internship_emails_application_idx
  on public.internship_emails (application_id, created_at desc);

create index if not exists internship_emails_kind_idx
  on public.internship_emails (application_id, kind);

-- RLS on, zero policies: service-role only, reached exclusively through
-- createAdminClient() in API routes. Same posture as internship_applications
-- (0025) and internship_interviews (0036).
alter table public.internship_emails enable row level security;
