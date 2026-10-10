-- GrowQR Events V1 — schema + seed
-- Apply via Supabase SQL editor or `supabase db push` once MCP write-mode is enabled.

----------------------------------------------------------------------
-- events
----------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  full_description text,
  speaker_name text,
  speaker_designation text,
  speaker_company text,
  speaker_image text,
  speaker_bio text,
  poster_url text,
  venue text,
  city text,
  country text,
  event_date date not null,
  start_time text,
  end_time text,
  timezone text default 'Asia/Kolkata',
  duration text,
  format text default 'Online',
  badge text default 'Free',
  price text,
  learnings jsonb default '[]'::jsonb,
  agenda jsonb default '[]'::jsonb,
  registration_limit int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_slug_idx on public.events(slug);
create index if not exists events_event_date_idx on public.events(event_date);
create index if not exists events_is_active_idx on public.events(is_active);

----------------------------------------------------------------------
-- event_registrations
----------------------------------------------------------------------
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  designation text,
  linkedin_url text,
  expectations text,
  confirmation_sent boolean not null default false,
  reminder_24h_sent boolean not null default false,
  reminder_1h_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

create index if not exists event_registrations_event_id_idx
  on public.event_registrations(event_id);
create index if not exists event_registrations_email_idx
  on public.event_registrations(email);
create index if not exists event_registrations_reminders_idx
  on public.event_registrations(event_id, reminder_24h_sent, reminder_1h_sent);

----------------------------------------------------------------------
-- updated_at trigger
----------------------------------------------------------------------
create or replace function public.set_events_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute procedure public.set_events_updated_at();

----------------------------------------------------------------------
-- Row-Level Security
--   - events: anyone can SELECT active events.
--   - event_registrations: no public access; writes go through the
--     server using the service-role key, which bypasses RLS.
----------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Active events are readable by anyone" on public.events;
create policy "Active events are readable by anyone"
on public.events for select
using (is_active = true);

----------------------------------------------------------------------
-- Seed: 3 upcoming GrowQR workshop events
-- (All free for V1 — payment not yet integrated.)
----------------------------------------------------------------------
insert into public.events (
  slug, title, short_description, full_description,
  speaker_name, speaker_designation, speaker_company, speaker_image, speaker_bio,
  poster_url, venue, city, country,
  event_date, start_time, end_time, timezone, duration, format, badge, price,
  learnings, agenda, registration_limit, is_active
) values
(
  'ai-future-of-work',
  'AI & The Future of Work',
  'An open session on how AI is reshaping careers across industries',
  'AI is no longer a future concept — it''s reshaping how we work, hire, collaborate, and grow. This open session brings together industry practitioners to cut through the noise and give you a grounded, practical view of where AI is taking your career and industry.',
  'Sarah Mitchell',
  'ML Research Lead',
  'Fortune 500',
  '/events/experts/teams-img-3.png',
  'Sarah leads machine learning initiatives at a Fortune 500 company, with 10+ years spanning research, product, and enterprise AI adoption. She writes and speaks about the human side of AI transformation.',
  '/events/events1.png',
  'GrowQR Online Studio', null, 'India',
  '2026-06-18', '6:00 PM', '7:30 PM', 'Asia/Kolkata', '90 min', 'Online', 'Free', null,
  '[
    "How AI is changing hiring, roles, and career trajectories",
    "Which skills will matter most in the next 3 years",
    "How to position yourself in an AI-first market",
    "Real examples from operators using AI inside their teams today"
  ]'::jsonb,
  '[
    {"time":"6:00 PM","title":"Welcome & Introductions","desc":"Setting context for the session"},
    {"time":"6:10 PM","title":"The AI Shift — What''s Actually Changing","desc":"A grounded look at what AI is and isn''t disrupting"},
    {"time":"6:40 PM","title":"Career Positioning in an AI World","desc":"Practical frameworks for professionals and leaders"},
    {"time":"7:10 PM","title":"Tools & Workflows That Matter","desc":"AI tools professionals are actually using today"},
    {"time":"7:20 PM","title":"Live Q&A","desc":"Open floor — ask anything"},
    {"time":"7:35 PM","title":"Wrap-up & Next Steps","desc":"Resources and community links"}
  ]'::jsonb,
  null, true
),
(
  'leadership-masterclass',
  'Leadership Masterclass',
  'High-signal frameworks from founders and senior operators',
  'Leadership is learned through exposure to people who''ve actually built and led things at scale. This masterclass is a concentrated session with senior operators sharing the real decisions, trade-offs, and mental models behind effective leadership — no theory, no fluff.',
  'David Chen',
  'Chief People Officer',
  'Series B Startup',
  '/events/experts/teams-img-2.png',
  'David has built and led people functions at three high-growth startups, from seed to Series B. He''s interviewed over 2,000 candidates, structured 15+ teams, and writes about leadership, culture, and org design.',
  '/events/events1.png',
  'GrowQR Online Studio', null, 'India',
  '2026-06-28', '5:00 PM', '7:00 PM', 'Asia/Kolkata', '120 min', 'Online', 'Free', null,
  '[
    "Decision-making frameworks used by operators at scale",
    "How to build high-trust, high-performance teams",
    "Navigating ambiguity and leading through uncertainty",
    "Common leadership failure modes and how to avoid them"
  ]'::jsonb,
  '[
    {"time":"5:00 PM","title":"Opening Context","desc":"What makes leadership different at scale"},
    {"time":"5:15 PM","title":"Mental Models for Leaders","desc":"The 4 frameworks that matter most"},
    {"time":"5:50 PM","title":"Team Design & Culture","desc":"Building high-trust teams from scratch"},
    {"time":"6:25 PM","title":"Difficult Decisions Live","desc":"Walking through real leadership dilemmas"},
    {"time":"6:45 PM","title":"Real Scenarios Workshop","desc":"Group case study with live feedback"},
    {"time":"6:55 PM","title":"Q&A & Close","desc":"Direct questions with the speaker"}
  ]'::jsonb,
  80, true
),
(
  'product-strategy-deep-dive',
  'Product Strategy Deep Dive',
  'Real decisions and trade-offs from product leaders at scale',
  'Strategy is the difference between building a great product and building the right product. This deep dive covers how experienced PMs think about market positioning, prioritisation under pressure, and aligning product decisions to business outcomes.',
  'Priya Sharma',
  'VP Product',
  'Ex-Flipkart, Meesho',
  '/events/experts/teams-img-1.png',
  'Priya has led product strategy at Flipkart and Meesho, building features used by tens of millions. She now advises early-stage startups on product-market fit and growth strategy.',
  '/events/events1.png',
  'GrowQR Online Studio', null, 'India',
  '2026-07-10', '7:00 PM', '9:00 PM', 'Asia/Kolkata', '120 min', 'Online', 'Free', null,
  '[
    "How to frame strategy when everything feels urgent",
    "Prioritisation frameworks that actually work at scale",
    "Aligning product decisions with business and revenue outcomes",
    "When to hold your ground and when to pivot"
  ]'::jsonb,
  '[
    {"time":"7:00 PM","title":"Product Strategy Fundamentals","desc":"Beyond roadmaps — what strategy really means"},
    {"time":"7:25 PM","title":"Prioritisation Under Pressure","desc":"How to decide what not to build"},
    {"time":"8:00 PM","title":"Case Study Deep Dive","desc":"A real product decision — dissected live"},
    {"time":"8:30 PM","title":"Strategy & Business Alignment","desc":"Connecting product decisions to revenue"},
    {"time":"8:45 PM","title":"Common PM Mistakes","desc":"Patterns that derail good product thinking"},
    {"time":"8:55 PM","title":"Q&A","desc":"Open questions with Priya"}
  ]'::jsonb,
  50, true
)
on conflict (slug) do nothing;
