/**
 * Per-agent media for the homepage Squad section + agent modal.
 */

/** The 7 job-seeker agents featured on the homepage (navbar order). */
export const FEATURED_AGENT_IDS = ["04", "03", "07", "02", "05", "01", "06"];

/** Roles are stored with a leading "The " — strip it for clean labels. */
export const shortRole = (role: string) => role.replace(/^The\s+/i, "");

/**
 * Agents that have a dedicated full landing page. Clicking these in the
 * homepage rail or the agents directory routes to the page instead of opening
 * the slide-up sheet. Agents not listed here keep using the sheet.
 */
export const AGENT_PAGE: Record<string, string> = {
  "RQ-Vera": "/ai-interviewer",
  "RQ-Mira": "/ai-resume-expert",
  "RQ-Nova": "/ai-brand-builder",
  "RQ-Sage": "/ai-skill-trainer",
  "RQ-Kai": "/ai-roleplay-coach",
  "RQ-Scout": "/ai-opportunity-finder",
  "RQ-Lyra": "/ai-learning-curator",
  "RQ-Rita": "/enterprise/ai-recruiter",
  "RQ-Theo": "/enterprise/attrition-predictor",
  "RQ-Rohan": "/enterprise/workforce-analyst",
  "RQ-Finn": "/enterprise/onboarding-co-pilot",
  "RQ-Eva": "/enterprise/capability-builder",
  "RQ-Maya": "/enterprise/outsourcing-manager",
};

/**
 * Individual-type agents (`type: "individual"` in `lib/data.ts`) that ALSO
 * have a dedicated enterprise/B2B landing page — same character, framed for
 * a business buyer instead of a job seeker (e.g. Nova's seeker page is
 * `/ai-brand-builder`; her enterprise page is `/enterprise/brand-builder`).
 *
 * This is the single source of truth for "which agents count as enterprise
 * too": the home Squad rail's Business toggle and every B2B solution page's
 * squad rail both read it. Add an entry here (and the route under
 * `/enterprise/...`) and that agent shows up — and links to the right
 * page — everywhere automatically. No per-page hardcoding required.
 */
export const AGENT_PAGE_ENTERPRISE: Record<string, string> = {
  "RQ-Nova": "/enterprise/brand-builder",
  "RQ-Scout": "/enterprise/opportunity-finder",
  "RQ-Vera": "/enterprise/interviewer",
};

/**
 * Shared Business-roster rule used by every agent showcase. Inactive agents
 * stay hidden, even if they still have an enterprise route configured.
 */
export const isActiveBusinessAgent = (agent: {
  active: boolean;
  type: string;
  name: string;
}) =>
  agent.active &&
  (agent.type === "enterprise" || Boolean(AGENT_PAGE_ENTERPRISE[agent.name]));

/** Agent name → video path (clean lowercase slugs in /public/agents-video). */
export const AGENT_VIDEO: Record<string, string> = {
  "RQ-Kai":   "/agents-video/kai.mp4",
  "RQ-Vera":  "/agents-video/vera.mp4",
  "RQ-Lyra":  "/agents-video/lyra.mp4",
  "RQ-Mira":  "/agents-video/mira.mp4",
  "RQ-Nova":  "/agents-video/nova.mp4",
  "RQ-Scout": "/agents-video/scout.mp4",
  "RQ-Sage":  "/agents-video/sage.mp4",
};

/** Agent name → "What you'll get": 4 concrete outcomes for the modal. */
export const AGENT_POINTS: Record<string, string[]> = {
  "RQ-Mira":  ["ATS-ready resume", "Resume score & fixes", "Role-specific optimization", "Tailored cover letters"],
  "RQ-Vera":  ["Live mock interview", "Readiness assessment", "Actionable feedback", "Question-by-question scoring"],
  "RQ-Kai":   ["Realistic practice scenarios", "Confidence under pressure", "Personalized coaching", "Real-time feedback"],
  "RQ-Nova":  ["Profile improvement plan", "Personal brand insights", "Visibility recommendations", "Optimized profile copy"],
  "RQ-Scout": ["Opportunities matched to you", "Better role alignment", "Application recommendations", "Auto-apply on your behalf"],
  "RQ-Sage":  ["Skill gap analysis", "Personalized training plan", "Targeted next steps", "Progress tracking"],
  "RQ-Lyra":  ["Curated learning path", "Skill-focused resources", "Hand-picked courses", "Faster, focused progress"],
};

/**
 * Agent name → in-app deep link the modal CTA points to. Lands the user on
 * that agent's screen (app handles login redirect when signed out).
 * These app routes are expected to change — keep them centralised here.
 */
const APP = "https://app.growqr.ai";
export const AGENT_URL: Record<string, string> = {
  "RQ-Mira":  `${APP}/suite/resume`,
  "RQ-Scout": `${APP}/suite/job-matching`,
  "RQ-Nova":  `${APP}/suite/social-media`,
  "RQ-Vera":  `${APP}/suite/interview`,
  "RQ-Sage":  `${APP}/suite/assessment`,
  "RQ-Lyra":  `${APP}/suite/course`,
  "RQ-Kai":   `${APP}/suite/roleplay`,
};

/**
 * Agent name → the before/after shift the agent delivers. Powers the
 * "Transformation" block in the Agents Directory sheet — kept short so it
 * reads as a single glanceable contrast, not a paragraph.
 */
export const AGENT_TRANSFORM: Record<string, { before: string; after: string }> = {
  "RQ-Mira":  { before: "Generic resume lost in the ATS", after: "A standout resume that lands interviews" },
  "RQ-Vera":  { before: "Freezing up when it matters most", after: "Walking in calm, sharp, and ready" },
  "RQ-Kai":   { before: "Caught off guard in hard talks", after: "Confident in every high-stakes moment" },
  "RQ-Nova":  { before: "Invisible and easy to overlook", after: "A profile people remember" },
  "RQ-Scout": { before: "Endless scrolling, few callbacks", after: "Right-fit roles, applied to for you" },
  "RQ-Sage":  { before: "Unsure what's holding you back", after: "A clear plan closing every gap" },
  "RQ-Lyra":  { before: "Drowning in random courses", after: "One focused path that moves you forward" },
};

/**
 * Agent name → the user journey: the 3 quick steps from "open the agent" to
 * "outcome in hand". Rendered as a numbered timeline in the Agents Directory
 * panel — short, scannable, and easy to extend per agent later.
 */
export const AGENT_JOURNEY: Record<string, { title: string; detail: string }[]> = {
  "RQ-Mira": [
    { title: "Share your background", detail: "Drop in your experience and the role you're targeting." },
    { title: "RQ-Mira drafts your resume", detail: "An ATS-tuned resume and cover letter, written for that role." },
    { title: "Refine & download", detail: "Tweak the wording, see your score climb, export and apply." },
  ],
  "RQ-Vera": [
    { title: "Pick a role & format", detail: "Choose the job and whether it's behavioural or technical." },
    { title: "Sit a live mock interview", detail: "RQ-Vera asks real questions and reacts to your answers in the moment." },
    { title: "Get scored feedback", detail: "Question-by-question scoring and the exact fixes to work on next." },
  ],
  "RQ-Kai": [
    { title: "Choose a scenario", detail: "Negotiation, tough feedback, a high-stakes pitch: you decide." },
    { title: "Roleplay it live", detail: "Practise the real conversation with RQ-Kai playing the other side." },
    { title: "Get coached", detail: "Real-time notes on tone, clarity, and what to do differently." },
  ],
  "RQ-Nova": [
    { title: "Connect your profile", detail: "Point RQ-Nova at your LinkedIn and tell it where you want to go." },
    { title: "RQ-Nova audits your presence", detail: "Spots the gaps holding your visibility and positioning back." },
    { title: "Apply the plan", detail: "Optimised copy and a posting plan that makes you hard to ignore." },
  ],
  "RQ-Scout": [
    { title: "Tell RQ-Scout what fits", detail: "Set the roles, locations, and bar you actually care about." },
    { title: "RQ-Scout matches & screens", detail: "It hunts, filters, and ranks opportunities aligned to you." },
    { title: "It applies for you", detail: "RQ-Scout submits to the best matches, even while you sleep." },
  ],
  "RQ-Sage": [
    { title: "Take a quick assessment", detail: "A short check to surface where you really stand." },
    { title: "RQ-Sage maps your gaps", detail: "See exactly which skills are holding you back, ranked." },
    { title: "Follow a targeted plan", detail: "A focused training path with progress tracked as you go." },
  ],
  "RQ-Lyra": [
    { title: "Set your goal", detail: "Tell RQ-Lyra the skill or outcome you're chasing." },
    { title: "RQ-Lyra curates the path", detail: "Only the courses and resources worth your time, in order." },
    { title: "Progress with focus", detail: "Move forward faster without the noise of endless options." },
  ],
};

/** Agent name → outcome-focused CTA label. */
export const AGENT_CTA: Record<string, string> = {
  "RQ-Mira":  "Build My Resume",
  "RQ-Vera":  "Start Mock Interview",
  "RQ-Kai":   "Start Roleplay",
  "RQ-Nova":  "Improve My Profile",
  "RQ-Scout": "Find Opportunities",
  "RQ-Sage":  "Build My Skill Plan",
  "RQ-Lyra":  "Get My Learning Path",
  "RQ-Rita":  "Start Hiring Smarter",
  "RQ-Theo":  "Predict Attrition Risk",
  "RQ-Rohan": "Explore Insights",
  "RQ-Finn":  "Start Onboarding",
  "RQ-Eva":   "Build Capabilities",
  "RQ-Maya":  "Build Your Bench",
  "RQ-Atlas": "Map My Pathway",
  "RQ-Drape": "Sharpen My Presence",
};
