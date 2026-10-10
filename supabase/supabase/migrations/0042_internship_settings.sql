-- Internship automation settings: a single, org-wide config row that HR sets
-- once. Every automatic step in the pipeline reads it, so the thresholds and
-- defaults live in one place instead of being scattered as constants across
-- the codebase. There is deliberately no compensation field here, the same as
-- the appointment letter: this system never states pay.
--
-- Singleton pattern: the primary key is a boolean pinned to true by a CHECK, so
-- the table can only ever hold one row. Read it with .eq('id', true).

create table if not exists public.internship_settings (
  id boolean primary key default true,
  constraint internship_settings_singleton check (id = true),

  -- On apply: the RQ-Score bar for the auto-shortlist band, and whether crossing
  -- it assigns the AI interview and mails the invite the moment they apply.
  shortlist_min_rq       integer not null default 50 check (shortlist_min_rq between 0 and 100),
  auto_assign_enabled    boolean not null default true,
  interview_round_type   text    not null default 'behavioral'
                           check (interview_round_type in ('warm_up','behavioral','technical')),

  -- Interview scoring: when a completed AI interview scores at or above the bar
  -- and this is on, move the pipeline forward to Selected on its own.
  auto_advance_enabled   boolean not null default false,
  interview_pass_score   integer not null default 60 check (interview_pass_score between 0 and 100),

  -- One-on-one final round defaults. The interviewer and calendar HR uses every
  -- time, pre-filled so they are not retyped per candidate.
  default_interviewer_name  text,
  default_interviewer_email text,
  final_round_calendar_id   text,

  -- Appointment letter defaults, pre-filled into the letter form.
  default_department        text,
  default_duration          text not null default '6 months',
  default_location          text not null default 'Remote',
  default_reporting_manager text not null default 'Chandni Jha',
  default_signatory_name    text not null default 'Chandni Jha',
  default_signatory_title   text not null default 'Head of HR',

  -- Automatic candidate emails. The manual sends (selected/offer/rejected from
  -- the status dropdown, and the appointment letter) stay per-action decisions
  -- and are not gated here.
  email_application_received boolean not null default true,
  email_interview_invite     boolean not null default true,
  email_final_round          boolean not null default true,
  email_auto_selected        boolean not null default true,

  updated_at timestamptz not null default now(),
  updated_by text
);

-- The one row. Defaults above are the shipped configuration.
insert into public.internship_settings (id) values (true)
  on conflict (id) do nothing;

-- Service-role only, like every other internship table (see 0025). No policies.
alter table public.internship_settings enable row level security;
