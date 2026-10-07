// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The 8 personas (ICPs) we market to. Tab order in Workflows follows this
 *  order, and the Problem section renders the same 8 as cards.
 *
 *  Keys are PLURAL (`professionals`, `coaches`, …) to match the public URLs
 *  under /solutions/{id}. This file is the canonical persona ID source
 *  for internal lookups (recipes, persona cards, problem statements,
 *  Record<Audience, T> maps). Display copy lives in `lib/personas.ts`.
 *
 *  Order is: professionals first (Students → Professionals → Coaches →
 *  Freelancers), then organisations (Startups → Recruiters →
 *  Enterprises → Institutes). */
export type Audience =
  | "students"
  | "professionals"
  | "coaches"
  | "freelancers"
  | "startups"
  | "recruiters"
  | "enterprises"
  | "institutes"
  | "consultants";

export type Agent = {
  id: string;
  name: string;
  role: string;              // e.g. "The Hiring Champ"
  /** Who this agent primarily serves. Drives the Individual/Enterprise
   *  toggle on the home Squad rail — Individual mode shows the 9 character
   *  agents, Enterprise mode shows the 6 functional capability agents. */
  type: "individual" | "enterprise";
  color: string;
  initials: string;
  desc: string;
  active: boolean;
  image?: string;            // headshot portrait
  scene?: string;            // full-bleed scene art for Workflows cards
  gridSpan?: 1 | 2;
};

export type RecipeAgent = {
  n: string;                 // agent display name (Scout, Mira, ...)
  role: string;              // short role label (no "The" prefix)
  action: string;            // what this agent does for this specific goal
  color: string;             // brand colour — must match the agent in `agents`
};

/** One workflow (goal) that a given persona can run. Flat array keyed by
 *  `audienceKey` so it's trivial to filter per persona in the UI. */
export type Recipe = {
  audienceKey: Audience;
  label: string;             // tab label
  sub: string;               // one-line descriptor
  description?: string;      // optional longer body for the left column
  agents: RecipeAgent[];
};

export type PersonaCard = {
  key: Audience;
  number: string;            // display number ("01"…"06")
  headline: string;
  outcome: string;
  agents: string[];          // list of agent names shown as chips
  subPage: string;           // route to the use-case sub-page
};

export type ProblemStatement = {
  key: Audience;
  persona: string;           // display name ("The Seeker")
  archetype: string;         // example persona names ("James / Emma")
  pain: string;              // italic quote-styled pain line
  context: string;           // 2-line context paragraph
};

// ─────────────────────────────────────────────────────────────────────────────
// Persona metadata
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical tab order for the Workflows section and Use Cases grid.
 *  Individuals first, then organisations. */
export const audiences: Audience[] = [
  "students",
  "professionals",
  "coaches",
  "freelancers",
  "startups",
  "recruiters",
  "enterprises",
  "institutes",
];

export const audienceLabels: Record<Audience, string> = {
  students: "Students",
  professionals: "Professionals",
  coaches: "Coaches",
  freelancers: "Freelancers",
  startups: "Startups",
  recruiters: "Recruiters",
  enterprises: "Enterprises",
  institutes: "Institutes",
  consultants: "Consultants",
};

// ─────────────────────────────────────────────────────────────────────────────
// Agents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical agent roster — 15 total. 9 character agents (`type: "individual"`)
 * serve individual-side use cases; 6 enterprise agents (`type: "enterprise"`)
 * are named functional capabilities for organisation-side workflows.
 *
 * The Squad rail on the home page reads this list and filters by `type`,
 * driven by the Individual/Enterprise toggle in the hero.
 */
export const agents: Agent[] = [
  // ── Individual-side (9 character agents) ─────────────────────────────────
  { id: "01", name: "RQ-Scout", role: "The Opportunity Finder", type: "individual", color: "#16A34A", initials: "SC", desc: "Scouts, hunts, screens, and applies to matched jobs while you sleep.", active: true, image: "/agents/3.png", gridSpan: 2 },
  { id: "02", name: "RQ-Mira", role: "The Resume Expert", type: "individual", color: "#7F77DD", initials: "MI", desc: "Writes resumes and cover letters that get past ATS and into human hands.", active: true, image: "/agents/2.png", gridSpan: 1 },
  { id: "03", name: "RQ-Vera", role: "The Interviewer", type: "individual", color: "#D4537E", initials: "VE", desc: "Puts you through real interviews before the real one. Constructive feedback included.", active: true, image: "/agents/1.png", gridSpan: 1 },
  { id: "04", name: "RQ-Kai", role: "The Roleplay Coach", type: "individual", color: "#378ADD", initials: "KA", desc: "Practises the hard conversations with you, so you're never caught off guard.", active: true, image: "/agents/7.png", gridSpan: 1 },
  { id: "05", name: "RQ-Nova", role: "The Brand Builder", type: "individual", color: "#525252", initials: "NO", desc: "Makes you impossible to ignore online: posts, profiles, and positioning sorted.", active: true, image: "/agents/5.png", gridSpan: 1 },
  { id: "06", name: "RQ-Sage", role: "The Skill Trainer", type: "individual", color: "#BA7517", initials: "SA", desc: "Finds exactly what's holding you back, then builds a plan to close it.", active: true, image: "/agents/4.png", gridSpan: 1 },
  { id: "07", name: "RQ-Lyra", role: "The Learning Curator", type: "individual", color: "#D85A30", initials: "LY", desc: "Picks only what's worth your time: courses and paths that move you forward.", active: true, image: "/agents/6.png", gridSpan: 1 },
  { id: "08", name: "RQ-Atlas", role: "The Pathway Guide", type: "individual", color: "#0D9488", initials: "AT", desc: "Maps career options, pivots, and what-fits-next at every stage of your journey.", active: true, image: "/agents/12.png", gridSpan: 1 },
  { id: "09", name: "RQ-Drape", role: "The Presence Coach", type: "individual", color: "#92400E", initials: "DR", desc: "Sharpen every layer of your presence for the moments that count.", active: true, image: "/agents/9.png", gridSpan: 1 },

  // ── Enterprise-side (6 functional capability agents, named as characters) ─
  { id: "10", name: "RQ-Rita", role: "The AI Recruiter", type: "enterprise", color: "#1E40AF", initials: "RI", desc: "Screens hundreds, shortlists the few, so your recruiters focus on people, not profiles.", active: true, image: "/agents/rita.png", gridSpan: 1 },
  { id: "11", name: "RQ-Theo", role: "The Attrition Predictor", type: "enterprise", color: "#991B1B", initials: "TH", desc: "Reads team signals and flags disengagement before it becomes a resignation letter on your desk.", active: true, image: "/agents/11.png", gridSpan: 1 },
  { id: "12", name: "RQ-Rohan", role: "The Workforce Analyst", type: "enterprise", color: "#6B21A8", initials: "RO", desc: "Maps skills, gaps, and performance patterns across your entire workforce in real time.", active: true, image: "/agents/rohan.png", gridSpan: 1 },
  { id: "13", name: "RQ-Finn", role: "The Onboarding Co-pilot", type: "enterprise", color: "#059669", initials: "FI", desc: "Cuts time-to-productivity by guiding every new hire through a structured, personalised onboarding journey.", active: true, image: "/agents/finn.png", gridSpan: 1 },
  { id: "14", name: "RQ-Eva", role: "The Capability Builder", type: "enterprise", color: "#B45309", initials: "EV", desc: "Identifies skill gaps at team level and delivers targeted learning paths that move measurable needles.", active: true, image: "/agents/eva.png", gridSpan: 1 },
  { id: "15", name: "RQ-Maya", role: "The Outsourcing Manager", type: "enterprise", color: "#334155", initials: "MY", desc: "Builds and manages your freelance bench, so the right talent is ready before you need it.", active: true, image: "/agents/maya.png", gridSpan: 1 },
];

// Quick colour lookup for recipe rows — agent names must match the canonical
// list above. Used below to avoid repeating hex codes on every row.
const C = {
  Scout: "#16A34A",
  Mira: "#7F77DD",
  Vera: "#D4537E",
  Kai: "#378ADD",
  Nova: "#525252",
  Sage: "#BA7517",
  Lyra: "#D85A30",
  Atlas: "#0D9488",
  Drape: "#92400E",
  Rita: "#1E40AF",
  Theo: "#991B1B",
  Rohan: "#6B21A8",
  Finn: "#059669",
  Eva: "#B45309",
  Maya: "#334155",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Workflows — 32 recipes (4 goals per persona).
//   · Individual personas (students / individuals / coaches / freelancers)
//     pull from the 9 character agents only.
//   · Organisational personas (startups / recruiters / enterprises /
//     institutes) weave in the 6 named enterprise agents (Rita / Theo /
//     Rohan / Finn / Eva / Maya) where they add real value on top of the
//     character squad.
//   · Copy reflects the reviewer-tagged edits from the copy review doc.
// ─────────────────────────────────────────────────────────────────────────────

export const recipes: Recipe[] = [
  // ── STUDENTS · 4 goals ────────────────────────────────────────────────────
  {
    audienceKey: "students", label: "Explore Career Paths", sub: "Find What Actually Fits",
    description:
      "Map your strengths to real careers, close the gaps that matter, and land an internship that builds on both.",
    agents: [
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Maps career options by your strengths and interests", color: C.Atlas },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Profiles your strengths and soft skills", color: C.Sage },
      { n: "RQ-Lyra", role: "Learning Curator", action: "Curates path-specific content", color: C.Lyra },
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Sources path-aligned internships", color: C.Scout },
    ],
  },
  {
    audienceKey: "students", label: "Find My First Internship", sub: "Your First Step into the Real World",
    description: "Your first professional experience, sourced and prepared end-to-end.",
    agents: [
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Sources internships by interest + level", color: C.Scout },
      { n: "RQ-Mira", role: "Resume Expert", action: "Crafts your first professional resume", color: C.Mira },
      { n: "RQ-Vera", role: "Interviewer", action: "Runs first-internship mock interviews", color: C.Vera },
    ],
  },
  {
    audienceKey: "students", label: "Learn Future-Relevant Skills", sub: "Upskill With Purpose",
    description: "Not random courses. The exact skills the market is moving towards.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Maps gaps to a trainable skill plan", color: C.Sage },
      { n: "RQ-Lyra", role: "Learning Curator", action: "Curates courses for each skill goal", color: C.Lyra },
    ],
  },
  {
    audienceKey: "students", label: "Match My Strengths to Careers", sub: "Your Profile Is Your Compass",
    description: "Map your strengths to real careers — no guesswork, no generic advice.",
    agents: [
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Pairs profile with career options", color: C.Atlas },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Profiles your strengths and soft skills", color: C.Sage },
    ],
  },

  // ── INDIVIDUALS · 4 goals ─────────────────────────────────────────────────
  {
    audienceKey: "professionals", label: "Be Ready for a Job", sub: "Application-Ready",
    description:
      "A squad that screens, applies, prepares, and upskills — so your next job is a matter of when, not if.",
    agents: [
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Auto-applies to matched roles", color: C.Scout },
      { n: "RQ-Mira", role: "Resume Expert", action: "Builds ATS-optimised resume", color: C.Mira },
      { n: "RQ-Vera", role: "Interviewer", action: "Runs mock interview sessions", color: C.Vera },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Bridges skill gaps before you apply", color: C.Sage },
    ],
  },
  {
    audienceKey: "professionals", label: "Prepare for an Interview", sub: "Confidence Before the Big Day",
    description: "Realistic practice plus feedback until you walk in ready.",
    agents: [
      { n: "RQ-Vera", role: "Interviewer", action: "Realistic mock interview sessions", color: C.Vera },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Scenario-based roleplay practice", color: C.Kai },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Eliminates knowledge gaps—fast", color: C.Sage },
    ],
  },
  {
    audienceKey: "professionals", label: "Build Your Online Presence", sub: "Own Your Professional Presence",
    description: "Show up consistently where recruiters look, with a voice that's distinctly yours.",
    agents: [
      { n: "RQ-Nova", role: "Brand Builder", action: "Builds thought leadership", color: C.Nova },
      { n: "RQ-Mira", role: "Resume Expert", action: "Rewrites your professional narrative", color: C.Mira },
    ],
  },
  {
    audienceKey: "professionals", label: "Learn New Skills", sub: "Stay Ahead of the Market",
    description: "A plan for what's next, curated to your goals and your time.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Personalised skill training plan", color: C.Sage },
      { n: "RQ-Lyra", role: "Learning Curator", action: "Curates best courses for your goals", color: C.Lyra },
    ],
  },

  // ── COACHES · 4 goals ─────────────────────────────────────────────────────
  {
    audienceKey: "coaches", label: "Fill Your Calendar", sub: "High-Value Clients. Consistently.",
    description:
      "Build the voice that brings clients in, the pipeline that keeps them qualified, and the profile that closes them.",
    agents: [
      { n: "RQ-Nova", role: "Brand Builder", action: "Builds authority content on LinkedIn", color: C.Nova },
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Maps lead follow-ups and booking cadence", color: C.Atlas },
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Screens and matches clients to your offer", color: C.Scout },
      { n: "RQ-Mira", role: "Resume Expert", action: "Optimises your coach profile for discovery", color: C.Mira },
    ],
  },
  {
    audienceKey: "coaches", label: "Build Your Online Presence", sub: "Show Up Every Day. Stand Out Every Time",
    description: "The right content, at the right cadence, building the right reputation.",
    agents: [
      { n: "RQ-Nova", role: "Brand Builder", action: "Publishes thought leadership on schedule", color: C.Nova },
      { n: "RQ-Mira", role: "Resume Expert", action: "Refines your coach positioning", color: C.Mira },
    ],
  },
  {
    audienceKey: "coaches", label: "Close More Clients", sub: "Turn Discovery Calls into Engagements",
    description: "Presence plus cadence that converts discovery calls into deals.",
    agents: [
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Runs a tight discovery-to-close cadence", color: C.Atlas },
      { n: "RQ-Drape", role: "Presence Coach", action: "Coaches your on-camera presence for calls", color: C.Drape },
    ],
  },
  {
    audienceKey: "coaches", label: "Grow Your Expertise", sub: "Stay Sharper than your Clients",
    description: "Benchmark your depth against the market and fill the right gaps.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Benchmarks your skill depth against the market", color: C.Sage },
      { n: "RQ-Lyra", role: "Learning Curator", action: "Curates follow-on offerings for each client", color: C.Lyra },
    ],
  },

  // ── FREELANCERS · 4 goals ─────────────────────────────────────────────────
  {
    audienceKey: "freelancers", label: "Find Better Gigs", sub: "Higher Quality, Better Pay",
    description: "Surface premium gigs, pitch with presence, and follow through until deals close.",
    agents: [
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Sources high-fit freelance gigs", color: C.Scout },
      { n: "RQ-Nova", role: "Brand Builder", action: "Builds online presence to attract clients", color: C.Nova },
      { n: "RQ-Drape", role: "Presence Coach", action: "Coaches your pitch for high-value gigs", color: C.Drape },
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Drives proposals through follow-ups", color: C.Atlas },
    ],
  },
  {
    audienceKey: "freelancers", label: "Negotiate Fair Rates", sub: "Get Paid What You're Worth",
    description: "Earn What You've Earned. Rate benchmarking plus presence coaching to hold the number you deserve.",
    agents: [
      { n: "RQ-Drape", role: "Presence Coach", action: "Coaches your negotiation presence and voice", color: C.Drape },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Backs your rates with proven skill", color: C.Sage },
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Benchmarks rates against the live market", color: C.Scout },
    ],
  },
  {
    audienceKey: "freelancers", label: "Build Your Network", sub: "Warm Intros, Not Cold DMs",
    description: "Publish, connect, and keep warm contacts actually warm.",
    agents: [
      { n: "RQ-Nova", role: "Brand Builder", action: "Publishes thought leadership on schedule", color: C.Nova },
      { n: "RQ-Scout", role: "Opportunity Finder", action: "Surfaces high-signal connections", color: C.Scout },
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Keeps warm contacts warm", color: C.Atlas },
    ],
  },
  {
    audienceKey: "freelancers", label: "Build Your Online Presence", sub: "Be the Obvious Choice",
    description: "A presence that does the selling before the first call.",
    agents: [
      { n: "RQ-Nova", role: "Brand Builder", action: "Publishes consistent profile content", color: C.Nova },
      { n: "RQ-Mira", role: "Resume Expert", action: "Elevates your freelance profile", color: C.Mira },
    ],
  },

  // ── STARTUPS · 4 goals (Rita + Finn enterprise agents) ────────────────────
  {
    audienceKey: "startups", label: "Build Your First Team", sub: "Hire Without Agency Fees",
    description:
      "Source, screen, assess, and onboard your first hires with a squad that moves at founder speed.",
    agents: [
      { n: "RQ-Rita", role: "AI Recruiter", action: "Sources first 5 hires — by fit, at speed", color: C.Rita },
      { n: "RQ-Vera", role: "Interviewer", action: "First-round interviews at scale", color: C.Vera },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Scenario tests for working-style fit", color: C.Kai },
      { n: "RQ-Finn", role: "Onboarding Co-pilot", action: "Gets new hires to productivity on day one", color: C.Finn },
    ],
  },
  {
    audienceKey: "startups", label: "Verify Skill Claims", sub: "Trust, but Measure",
    description: "Validate what candidates claim before it becomes a founder headache.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Runs verified skill assessments", color: C.Sage },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Benchmarks skills against role demands", color: C.Rohan },
    ],
  },
  {
    audienceKey: "startups", label: "Run Culture Assessments", sub: "The Right Person for the Right Team.",
    description: "Assess alignment in values, work style, and team dynamics — before you sign.",
    agents: [
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Tests culture fit through real scenarios", color: C.Kai },
      { n: "RQ-Vera", role: "Interviewer", action: "Vision and working-style interviews", color: C.Vera },
    ],
  },
  {
    audienceKey: "startups", label: "Make the Right First Hire", sub: "Your First 10 Decide the Next 10 Years",
    description: "Build aligned founding teams with vetted fit and verified skills.",
    agents: [
      { n: "RQ-Rita", role: "AI Recruiter", action: "Builds aligned founding teams", color: C.Rita },
      { n: "RQ-Vera", role: "Interviewer", action: "Vets for vision and working-style fit", color: C.Vera },
    ],
  },

  // ── RECRUITERS · 4 goals (Rita + Rohan enterprise agents) ─────────────────
  {
    audienceKey: "recruiters", label: "Find the Right Hire, Fast", sub: "JD in. Shortlist out",
    description:
      "A brief becomes a shortlist in 48 hours — sourced, interviewed, skill-benchmarked, and packaged for your client.",
    agents: [
      { n: "RQ-Rita", role: "AI Recruiter", action: "Screens and ranks applicants by RQ fit", color: C.Rita },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Benchmarks skills vs the client's stack", color: C.Rohan },
      { n: "RQ-Mira", role: "Resume Expert", action: "Normalises resumes for apples-to-apples review", color: C.Mira },
      { n: "RQ-Vera", role: "Interviewer", action: "Runs first-round AI interviews", color: C.Vera },
    ],
  },
  {
    audienceKey: "recruiters", label: "Screen at Scale", sub: "Scores What you've Already Collected",
    description: "Bulk RQ scoring across your CV backlog — no manual sifting.",
    agents: [
      { n: "RQ-Rita", role: "AI Recruiter", action: "Runs RQ scoring across every CV on file", color: C.Rita },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Batches workforce analytics across the backlog", color: C.Rohan },
    ],
  },
  {
    audienceKey: "recruiters", label: "Pre-Interview Candidates", sub: "Screen Once. Screen Right.",
    description: "Every candidate through the same rigorous first round: no bias, no inconsistency.",
    agents: [
      { n: "RQ-Vera", role: "Interviewer", action: "AI-led first-round interviews", color: C.Vera },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Soft-skill scenario tests", color: C.Kai },
    ],
  },
  {
    audienceKey: "recruiters", label: "Verify Skill Claims", sub: "Trust, but Measure",
    description: "Verify what the CV says matches what the candidate does.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Runs verified skill assessments", color: C.Sage },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Cross-references verified data against claims", color: C.Rohan },
    ],
  },

  // ── ENTERPRISES · 4 goals (Theo + Rohan + Eva enterprise agents) ──────────
  {
    audienceKey: "enterprises", label: "Keep Your Best People", sub: "Retain Before You Lose",
    description: "Early signals. Timely interventions. Zero regrettable exits.",
    agents: [
      { n: "RQ-Theo", role: "Attrition Predictor", action: "Reads team health signals for flight risk", color: C.Theo },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Identifies growth-starved staff", color: C.Sage },
      { n: "RQ-Eva", role: "Capability Builder", action: "Delivers internal mobility learning paths", color: C.Eva },
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Maps each employee's next role", color: C.Atlas },
    ],
  },
  {
    audienceKey: "enterprises", label: "Predict Attrition", sub: "Real-Time Talent Intelligence",
    description: "Surface risk patterns before the exit interviews land on your desk.",
    agents: [
      { n: "RQ-Theo", role: "Attrition Predictor", action: "Scores flight risk per team and individual", color: C.Theo },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Pinpoints skill gaps per individual", color: C.Rohan },
    ],
  },
  {
    audienceKey: "enterprises", label: "Grow Your People", sub: "Close Gaps Before They Hurt",
    description: "Targeted learning paths per role and person — not a generic catalogue.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Builds team-wide learning plans", color: C.Sage },
      { n: "RQ-Eva", role: "Capability Builder", action: "Delivers targeted L&D at scale", color: C.Eva },
      { n: "RQ-Lyra", role: "Learning Curator", action: "Curates courses per role", color: C.Lyra },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Runs scenario training sessions", color: C.Kai },
    ],
  },
  {
    audienceKey: "enterprises", label: "Open Internal Mobility", sub: "Fill Roles from Within",
    description: "Map internal options and close the skill delta to the next role.",
    agents: [
      { n: "RQ-Atlas", role: "Pathway Guide", action: "Maps next-role options per employee", color: C.Atlas },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Cross-references skill fit for open roles", color: C.Rohan },
      { n: "RQ-Eva", role: "Capability Builder", action: "Closes the skill delta to the target role", color: C.Eva },
    ],
  },

  // ── INSTITUTES · 4 goals (Rohan + Eva enterprise agents) ──────────────────
  {
    audienceKey: "institutes", label: "Get Every Student Placement-Ready", sub: "Cohort-Wide RQ Tracking",
    description:
      "Close skill gaps, run cohort-scale mock interviews, and graduate students ready for the first interview that matters.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Maps skill gaps across every student", color: C.Sage },
      { n: "RQ-Vera", role: "Interviewer", action: "Runs practice interviews at cohort scale", color: C.Vera },
      { n: "RQ-Mira", role: "Resume Expert", action: "Polishes every resume to placement standard", color: C.Mira },
      { n: "RQ-Rohan", role: "Workforce Analyst", action: "Certifies cohort skills for employers", color: C.Rohan },
    ],
  },
  {
    audienceKey: "institutes", label: "Run Assessments at Scale", sub: "Bulk Capability Measurement",
    description: "Deploy verified assessments to entire cohorts in one go.",
    agents: [
      { n: "RQ-Sage", role: "Skill Trainer", action: "Deploys corporate-posted assessments", color: C.Sage },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Scenario-based evaluation for soft skills", color: C.Kai },
    ],
  },
  {
    audienceKey: "institutes", label: "Run Mock Interviews", sub: "Practice Before It Counts",
    description: "Every student, same rigour, ready before placement week.",
    agents: [
      { n: "RQ-Vera", role: "Interviewer", action: "Cohort-scale interview practice", color: C.Vera },
      { n: "RQ-Kai", role: "Roleplay Coach", action: "Soft-skill roleplay scenarios", color: C.Kai },
    ],
  },
  {
    audienceKey: "institutes", label: "Curate Learning Paths", sub: "Turn Syllabus into Career Signal",
    description: "Match curriculum to what employers actually hire for.",
    agents: [
      { n: "RQ-Lyra", role: "Learning Curator", action: "Matches courses to employer demand", color: C.Lyra },
      { n: "RQ-Eva", role: "Capability Builder", action: "Delivers structured learning programs", color: C.Eva },
      { n: "RQ-Sage", role: "Skill Trainer", action: "Measures progress per student", color: C.Sage },
    ],
  },
];

/** Helper — all goals for a given persona, preserving source order. */
export const recipesFor = (a: Audience): Recipe[] =>
  recipes.filter((r) => r.audienceKey === a);

// ─────────────────────────────────────────────────────────────────────────────
// Persona cards (Use Cases section on home + sub-pages)
// ─────────────────────────────────────────────────────────────────────────────

export const personaCards: PersonaCard[] = [
  {
    key: "students",
    number: "01",
    headline: "Figure Out the Career That Actually Fits you",
    outcome:
      "Match your strengths to paths, find your first internship, learn the right skills.",
    agents: ["RQ-Atlas", "RQ-Sage", "RQ-Lyra", "RQ-Scout"],
    subPage: "/solutions/students",
  },
  {
    key: "professionals",
    number: "02",
    headline: "Land the Job you're Aiming for",
    outcome: "From QR identity to offer letter — the full seeker workflow.",
    agents: ["RQ-Scout", "RQ-Mira", "RQ-Vera", "RQ-Sage"],
    subPage: "/solutions/professionals",
  },
  {
    key: "coaches",
    number: "03",
    headline: "Fill Your Calendar with Qualified Clients",
    outcome: "Pre-screened seekers, authority content, automated bookings.",
    agents: ["RQ-Nova", "RQ-Atlas", "RQ-Mira", "RQ-Drape"],
    subPage: "/solutions/coaches",
  },
  {
    key: "freelancers",
    number: "04",
    headline: "Win Gigs That Pay What you Deserve",
    outcome:
      "Sourced contracts, polished proposals, rate benchmarking, skill gap closure.",
    agents: ["RQ-Scout", "RQ-Nova", "RQ-Mira", "RQ-Drape"],
    subPage: "/solutions/freelancers",
  },
  {
    key: "startups",
    number: "05",
    headline: "Build the Team and the Brand in Parallel",
    outcome:
      "Early team scoring, fractional advisory, credibility footprint on autopilot.",
    agents: ["RQ-Scout", "RQ-Vera", "RQ-Kai", "RQ-Sage"],
    subPage: "/solutions/startups",
  },
  {
    key: "recruiters",
    number: "06",
    headline: "Submit 3, Not 30. Every One Verified.",
    outcome:
      "Bulk RQ on every upload, prep for borderline candidates, verified reports.",
    agents: ["RQ-Scout", "RQ-Vera", "RQ-Mira", "RQ-Kai"],
    subPage: "/solutions/recruiters",
  },
  {
    key: "enterprises",
    number: "07",
    headline: "See Attrition Coming. Intervene Earlier.",
    outcome: "Team health signals, L&D ROI, RQ trends per employee.",
    agents: ["RQ-Sage", "RQ-Lyra", "RQ-Atlas", "RQ-Vera"],
    subPage: "/solutions/enterprises",
  },
  {
    key: "institutes",
    number: "08",
    headline: "Place Every Placement-Ready Student",
    outcome: "Cohort RQ tracking, auto-match to live roles, white-label portal.",
    agents: ["RQ-Sage", "RQ-Vera", "RQ-Mira", "RQ-Lyra"],
    subPage: "/solutions/institutes",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Problem statements (ProblemStatement section on home)
// ─────────────────────────────────────────────────────────────────────────────

export const problemStatements: ProblemStatement[] = [
  {
    key: "students",
    persona: "Students",
    archetype: "Ethan / Sophia",
    pain: "I Want to know What Career Actually Fits Me.",
    context:
      "Career days and syllabi weren't built for where the market is going. You've got signals about who you are — but nothing tying them to what to do next.",
  },
  {
    key: "professionals",
    persona: "Professionals",
    archetype: "James / Emma",
    pain: "I Apply. I Wait. Nothing Happens.",
    context:
      "You don't know where you actually stand. Your resume, your interview prep, your LinkedIn — all running in different tabs, none of them talking to each other.",
  },
  {
    key: "coaches",
    persona: "Coaches",
    archetype: "Olivia / Daniel",
    pain: "My Calendar is Empty. My Phone Won't Stop Buzzing.",
    context:
      "You're burning hours on discovery calls with people who can't afford you, while your best-fit clients never find your profile.",
  },
  {
    key: "freelancers",
    persona: "Freelancers",
    archetype: "Liam / Chloe",
    pain: "I Want Gigs That Pay What I Deserve.",
    context:
      "You're chasing inbound that under-prices you and sending proposals that don't defend your rate. The work is there — the pricing power isn't.",
  },
  {
    key: "startups",
    persona: "Startups",
    archetype: "Noah / Isla",
    pain: "I Pick My Team on Gut Feeling. I Can't Afford to Be Wrong.",
    context:
      "The first 10 hires decide the next 10 years. You're making them between investor calls, without the systems a real TA team would give you.",
  },
  {
    key: "recruiters",
    persona: "Recruiters",
    archetype: "Lucas / Mia",
    pain: "I Read 200 Resumes to Find 3 Good Ones.",
    context:
      "ATS scoring is keyword matching, not capability matching. Your best candidates look average on paper, and your clients are losing patience.",
  },
  {
    key: "enterprises",
    persona: "Enterprises",
    archetype: "Ava / Ryan",
    pain: "Good People Quit. I Never See It Coming.",
    context:
      "Engagement surveys are lagging indicators. By the time you spot an attrition risk, the counter-offer conversation has already started elsewhere.",
  },
  {
    key: "institutes",
    persona: "Institutes",
    archetype: "Prof. Bennett / Hannah",
    pain: "My Students Have Good Grades but Can't Get Jobs.",
    context:
      "Spreadsheets of grades don't predict placement. You're sending unprepared candidates into interviews and absorbing the reputation hit.",
  },
];
