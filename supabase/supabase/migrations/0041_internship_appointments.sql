-- The particulars a person fills in to issue an internship appointment letter.
--
-- Kept out of internship_applications on purpose: these are decided once, near
-- the end of the pipeline, by HR, and most applications never reach this stage.
-- A separate one-row-per-application table keeps the applications row about the
-- candidate and this row about the offer, and lets "has a letter been prepared"
-- be a single existence check.
--
-- Deliberately holds NO stipend, salary or compensation field. The letter says
-- nothing about pay (see lib/internship/appointment-letter.ts), so there is
-- nothing of the sort to store here either.

create table if not exists public.internship_appointments (
  id                uuid primary key default gen_random_uuid(),

  application_id    uuid not null unique
                      references public.internship_applications(id) on delete cascade,

  -- Letter reference, e.g. GQR/INT/2026/0041. Suggested by the server, and
  -- editable, so a house numbering scheme can override it.
  reference_no      text not null,

  designation       text not null,
  department        text not null,
  start_date        date not null,
  -- Either a real end date or left null when only a duration is quoted.
  end_date          date,
  duration          text not null,
  reporting_manager text not null,
  location          text not null,

  -- Who signs. Null falls back to a neutral title in the renderer, so the
  -- letter is never unsigned.
  signatory_name    text,
  signatory_title   text,

  -- Set the moment the letter is actually emailed to the candidate. Null while
  -- it is still a draft being prepared. Distinguishes "prepared" from "issued".
  issued_at         timestamptz,

  -- Admin email that prepared it.
  created_by        text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists internship_appointments_application_idx
  on public.internship_appointments (application_id);

drop trigger if exists set_updated_at on public.internship_appointments;
create trigger set_updated_at
  before update on public.internship_appointments
  for each row execute function public.update_updated_at_column();

-- RLS on, zero policies: service-role only, same posture as the tables above.
alter table public.internship_appointments enable row level security;
