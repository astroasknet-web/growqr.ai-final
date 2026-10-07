import type { LucideIcon } from "lucide-react";
import { Code2, Palette, Megaphone, Users, TrendingUp } from "lucide-react";
import type { PreferredRole } from "@/lib/internship-options";

/**
 * The internship intro film. Portrait either way, so the landing page frames
 * it as a tall player beside the copy rather than a 16:9 band.
 *
 * Two sources, switched with `mode`:
 *  - "canva": an iframe embed. Nothing is hosted here and nothing is
 *    committed, but Canva serves its own player chrome, so the poster and
 *    play button below do not apply, and the design has to be shared as
 *    "Anyone with the link can view" or viewers get a permission screen.
 *  - "file":  the transcoded copy in public/internship. Full control of the
 *    poster and play button, at the cost of ~38MB in the repo. Click-to-play
 *    with `preload="metadata"`, so only the poster loads until someone asks
 *    for the film.
 */
export const INTERNSHIP_VIDEO = {
  mode: "canva" as "canva" | "file",

  // Canva embed. `/watch?embed` is the player URL behind Canva's own embed
  // snippet; the bare share link renders the editor chrome instead.
  embedUrl: "https://www.canva.com/design/DAHTZKxgze4/vWl2Y-1DK9MQjdJ9-0k0gA/watch?embed",
  /**
   * Canva letterboxes the design inside whatever box it is given, so the frame
   * has to match the design's own ratio or the difference shows up as black
   * bands. 9:16 left a band top and bottom. This is the footage's own ratio
   * (1080x1638, i.e. 60/91) and it has to be re-checked whenever the film is
   * re-cut: the previous 760/1152 was only 0.06% wider, which was still enough
   * to leak a hairline of the black backdrop down the right edge.
   */
  embedAspect: "1080 / 1638",

  // Self-hosted copy.
  src: "/internship/intro.mp4",
  poster: "/internship/intro-poster.webp",
  width: 760,
  height: 1152,

  /** Shown on the play affordance so the length is known before the click. */
  duration: "4:48",
} as const;

/**
 * Terms every job description repeats, said once so the cards stay short.
 * Values are kept to a single line each: one wrapping to two lines throws the
 * whole strip out of alignment.
 */
export const PROGRAM_FACTS: { label: string; value: string }[] = [
  { label: "Location", value: "Remote, Noida office" },
  { label: "Duration", value: "3 to 6 months, full-time" },
  { label: "Stipend", value: "As per internship policy" },
  { label: "On completion", value: "Certificate and LOR" },
  { label: "Top performers", value: "Full-time offer" },
];

/**
 * The function a role sits in, used by the filter badges above the grid.
 * Deliberately coarser than the roles themselves: Social Media and Sales both
 * sit under Marketing, so the filter groups rather than mirrors the cards.
 */
export const ROLE_CATEGORIES = ["Engineering", "Design", "Marketing", "Community"] as const;

export type RoleCategory = (typeof ROLE_CATEGORIES)[number];

export type InternshipRole = {
  /**
   * Stored verbatim in internship_applications.preferred_role and validated
   * by /api/send-internship against PREFERRED_ROLES, so this must stay
   * character-for-character identical to the entry in lib/internship-options.
   */
  value: PreferredRole;
  /** URL-safe id used in /growqr-internship/apply?role=... */
  slug: string;
  title: string;
  category: RoleCategory;
  icon: LucideIcon;
  /** One line on the card. Everything else lives in the panel. */
  summary: string;
  /** Three at most: the card gets crowded past that. */
  chips: string[];
  reportingTo: string;
  overview: string;
  responsibilities: string[];
  lookingFor: string[];
  gain: string[];
  /** Optional sub-tracks, shown as a footnote in the panel. */
  tracks?: string[];
};

/** Shared by every role, kept out of the per-role lists so they read short. */
const COMMON_GAIN = [
  "Certificate of internship and a Letter of Recommendation based on performance",
  "Potential pathway to a full-time offer based on performance and business need",
];

export const INTERNSHIP_ROLES: InternshipRole[] = [
  {
    value: "Technology",
    slug: "technology",
    title: "Technology",
    category: "Engineering",
    icon: Code2,
    summary: "Build and ship features on a live agentic AI platform, guided by senior engineers.",
    chips: ["Python or JavaScript", "Git", "AI/ML curious"],
    reportingTo: "Project Lead, Tech",
    overview:
      "Work with the engineering and product teams on the design, development and delivery of features on GrowQR's agentic AI platform. You get hands-on exposure to real product cycles, cross-functional coordination and applied AI development in a fast-moving startup.",
    responsibilities: [
      "Plan, track and execute assigned modules and features within the product roadmap",
      "Support development, testing and debugging across the platform under senior engineer guidance",
      "Coordinate with design, QA and product to keep milestones on time and on quality",
      "Document technical specifications, workflows and change logs for ongoing projects",
      "Take part in sprint planning, stand-ups and reviews, and bring ideas for improving the process",
      "Research tools, frameworks and AI techniques relevant to current product initiatives",
    ],
    lookingFor: [
      "Pursuing or recently completed a degree in Computer Science, IT or a related field",
      "Working knowledge of at least one programming language (Python, JavaScript or similar)",
      "Basic understanding of the software development lifecycle and version control (Git)",
      "Strong problem-solving ability and eagerness to learn new tools and technologies",
      "Good communication skills and comfort in a collaborative, deadline-driven team",
      "Exposure to AI/ML concepts or project coordination is a plus, not a requirement",
    ],
    gain: [
      "Direct mentorship from GrowQR's founding and engineering team",
      "Real ownership of product modules inside a live agentic AI platform",
      ...COMMON_GAIN,
    ],
    tracks: ["Agentic AI", "Full Stack", "DevOps", "Frontend", "Backend"],
  },
  {
    value: "UI/UX",
    slug: "ui-ux",
    title: "UI/UX and Graphic Design",
    category: "Design",
    icon: Palette,
    summary: "Design product screens and brand assets that thousands of students actually use.",
    chips: ["Figma", "Visual design", "Portfolio"],
    reportingTo: "Design, Product",
    overview:
      "Shape how people experience GrowQR, from product interfaces to marketing and brand assets. You work across product design and visual communication, turning ideas into clean, usable, on-brand design.",
    responsibilities: [
      "Design wireframes, mockups and high-fidelity UI screens for web and product features",
      "Create graphics, social creatives, decks and marketing collateral within brand guidelines",
      "Work with product and engineering to translate requirements into intuitive user flows",
      "Maintain and evolve GrowQR's design system, style guides and asset libraries",
      "Run basic usability checks and fold the feedback into the next iteration",
      "Support design for internal decks, event materials and campus outreach assets",
    ],
    lookingFor: [
      "Pursuing or recently completed a degree or diploma in Design, Visual Communication or a related field",
      "Proficiency in Figma, Adobe XD, Photoshop or Illustrator",
      "Strong sense of layout, typography, colour and visual hierarchy",
      "Basic understanding of UI/UX principles and user-centred design thinking",
      "A portfolio of personal projects, coursework or freelance work showing range",
      "Able to juggle multiple design requests with attention to detail and deadlines",
    ],
    gain: [
      "Portfolio-ready product design and branding work from a live AI startup",
      "Mentorship from design and product leadership at GrowQR",
      ...COMMON_GAIN,
    ],
  },
  {
    value: "Social Media",
    slug: "social-media",
    title: "Social Media",
    category: "Marketing",
    icon: Megaphone,
    summary: "Own the day-to-day voice of GrowQR across LinkedIn, Instagram and beyond.",
    chips: ["Content calendars", "Copywriting", "Canva or CapCut"],
    reportingTo: "Social Media, Branding",
    overview:
      "Build brand visibility among students, professionals and the HR-tech community through consistent, engaging, on-brand content, and own the daily rhythm of GrowQR's social presence.",
    responsibilities: [
      "Plan, create and schedule content calendars across LinkedIn, Instagram and other platforms",
      "Draft captions, posts and short-form content in GrowQR's brand voice",
      "Track engagement, follower growth and campaign performance, and report what you learn",
      "Work with the design team on creatives, reels and campaign visuals",
      "Watch trends, competitor activity and conversations in the HR-tech and AI space",
      "Promote GrowQR initiatives such as the Campus Ambassador Program and product launches",
    ],
    lookingFor: [
      "Pursuing or recently completed a degree in Marketing, Mass Communication or a related field",
      "Strong written communication with a good sense of tone and audience",
      "Working familiarity with the major social platforms and basic scheduling tools",
      "Interest in branding, digital marketing and the startup or AI ecosystem",
      "Basic content creation or editing skills (Canva, CapCut or similar) is an added advantage",
      "Organised and proactive, comfortable working to a content calendar",
    ],
    gain: [
      "Hands-on ownership of a growing brand's social media presence",
      "Exposure to marketing strategy and campaign planning in a fast-paced startup",
      ...COMMON_GAIN,
    ],
  },
  {
    value: "Community",
    slug: "community",
    title: "Community",
    category: "Community",
    icon: Users,
    summary: "Keep the student and ambassador community active, answered and growing.",
    chips: ["Community ops", "Communication", "Trackers"],
    reportingTo: "Campus and Community Programs",
    overview:
      "Nurture and grow GrowQR's student and professional community, including the Campus Ambassador Program, by driving engagement, onboarding and communication across community channels.",
    responsibilities: [
      "Support onboarding and daily engagement of campus ambassadors and community members",
      "Run community channels (WhatsApp, Discord, email) and answer member queries promptly",
      "Coordinate tasks, challenges and campaigns, and track completion and engagement",
      "Process applicant backlogs and route members through the right selection journey",
      "Help plan and run engagement activities, contests and recognition initiatives",
      "Compile community health reports on activity, drop-offs and engagement trends",
    ],
    lookingFor: [
      "Pursuing or recently completed a degree in any discipline",
      "Excellent interpersonal and written communication skills",
      "Comfortable with spreadsheets and trackers, and coordinating across stakeholders",
      "Empathetic, responsive and organised in how you handle member communication",
      "Prior campus ambassador, club coordinator or volunteer lead experience is an advantage",
      "A self-starter who can run community operations with light supervision",
    ],
    gain: [
      "Direct ownership of community growth initiatives reaching thousands of students",
      "Exposure to community strategy, ambassador program design and stakeholder coordination",
      ...COMMON_GAIN,
    ],
  },
  {
    value: "Sales & Marketing",
    slug: "sales-marketing",
    title: "Sales and Marketing",
    category: "Marketing",
    icon: TrendingUp,
    summary: "Build the pipeline: research prospects, run outreach and support live demos.",
    chips: ["Outbound", "CRM hygiene", "B2B SaaS"],
    reportingTo: "Sales and Marketing",
    overview:
      "Support GrowQR's outreach to prospective clients and partners, helping build the pipeline, sharpen the messaging and drive awareness of the platform among HR and business leaders.",
    responsibilities: [
      "Research and build lists of prospective clients, partners and decision-makers",
      "Support outbound over email, LinkedIn and calls, and help qualify inbound leads",
      "Help prepare sales decks, proposals, one-pagers and client-facing collateral",
      "Coordinate demo scheduling and follow-ups, and keep the CRM and lead trackers clean",
      "Support marketing campaigns, webinars and events that generate leads",
      "Track outreach performance and compile weekly pipeline and conversion reports",
    ],
    lookingFor: [
      "Pursuing or recently completed a degree in Business, Marketing or a related field",
      "Strong verbal and written communication with a persuasive, client-facing approach",
      "Comfortable with cold outreach, follow-ups and CRM or spreadsheet-based tracking",
      "Interest in B2B sales, SaaS, or the HR-tech and AI ecosystem",
      "Organised and target-driven, able to manage multiple leads and deadlines",
      "Prior sales, marketing or business development experience is a plus",
    ],
    gain: [
      "Hands-on exposure to B2B sales cycles and go-to-market strategy at an AI startup",
      "Mentorship from GrowQR's sales and marketing leadership",
      ...COMMON_GAIN,
    ],
  },
];

export const APPLY_PATH = "/growqr-internship/apply";

/** Deep link that lands on the form with this role already selected. */
export function applyHref(role: InternshipRole): string {
  return `${APPLY_PATH}?role=${role.slug}`;
}

/**
 * Resolves the `?role=` slug the cards link with back to the stored role
 * label. Unknown slugs return undefined so the form simply opens unselected
 * rather than carrying a value the submit API would reject.
 */
export function roleFromSlug(slug: string | undefined): PreferredRole | undefined {
  if (!slug) return undefined;
  return INTERNSHIP_ROLES.find((r) => r.slug === slug)?.value;
}
