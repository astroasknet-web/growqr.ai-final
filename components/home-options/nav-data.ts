/** Navigation content merged from growqr.ai (Solutions, Agents) and qrscore.mathstudy.in (Internships, Courses, Study Abroad, Skill Passport, employers). */
import { CLASSROOM_URL } from "@/lib/links";
import { COUNTRIES, INTERNSHIPS, RESUME_SCORE_URL, SCORE_URL, AGENT } from "./data";

export type IconKey =
  | "qr" | "passport" | "bot" | "studio" | "briefcase" | "gig" | "tracker" | "rocket" | "book" | "path" | "ebook"
  | "globe" | "shield" | "student" | "pro" | "coach" | "free" | "startup" | "recruit" | "enterprise" | "institute"
  | "experts" | "events" | "community" | "blog" | "about" | "contact" | "vision" | "post" | "spark";

export type NavLink = { label: string; desc?: string; href: string; icon: IconKey; external?: boolean; badge?: string };

export const ANNOUNCE = { text: "New: verified-stipend internships, with the first month held in escrow.", cta: "Browse internships", href: SCORE_URL };

export const PLATFORM: NavLink[] = [
  { label: "QR Score", desc: "A free resume score out of 100 in seconds", href: "/resume-score", icon: "qr", badge: "Free" },
  { label: "Skill Passport", desc: "Scored, proctored proof any employer can scan", href: "/passport", icon: "passport", },
  { label: "AI Agents", desc: "Specialised agents with human experts in the loop", href: "/agents", icon: "bot" },
  { label: "Resume Studio", desc: "Rebuild your resume from a template, with live scoring", href: "/studio", icon: "studio", },
];

export const CAREERS_OPPS: NavLink[] = [
  { label: "Internships", desc: "Verified employers, no application fees", href: "/internships", icon: "briefcase", badge: "Verified" },
  { label: "Micro-gigs", desc: "10 to 40 hour projects that pay", href: "/internships", icon: "gig", },
  { label: "Application tracker", desc: "See every stage and employer response", href: "/applications", icon: "tracker", },
  { label: "GrowQR Internship", desc: "Join the GrowQR team as an intern", href: "/growqr-internship", icon: "rocket" },
];
export const CAREERS_LEARN: NavLink[] = [
  { label: "Courses", desc: "121 courses across 19 fields", href: "/courses", icon: "book", },
  { label: "Practice tests", desc: "IELTS and GRE, marked instantly", href: "/practice-tests", icon: "tracker", },
  { label: "Exam prep", desc: "JEE, NEET, UPSC, SSC, CAT, SAT, GRE, IELTS", href: "/exam-prep", icon: "path" },
  { label: "Online Classes", desc: "Live classes with verified teachers", href: CLASSROOM_URL, icon: "path", external: true },
  { label: "E-books", desc: "Study guides on MathStudy.in", href: "https://mathstudy.in/", icon: "ebook", external: true },
];
export const ABROAD = COUNTRIES.map((c) => ({ label: c.name, count: c.count, href: `/study-abroad/${c.name.toLowerCase()}` }));

export const PERSONA_COPY: Record<string, { icon: IconKey; desc: string }> = {
  students: { icon: "student", desc: "Show what fits, before graduation" },
  professionals: { icon: "pro", desc: "A role that fits who you are" },
  coaches: { icon: "coach", desc: "Grow your practice with agents" },
  freelancers: { icon: "free", desc: "Win better clients and gigs" },
  startups: { icon: "startup", desc: "Build the founding team faster" },
  recruiters: { icon: "recruit", desc: "Shortlist on proof, not adjectives" },
  enterprises: { icon: "enterprise", desc: "Workforce intelligence at scale" },
  institutes: { icon: "institute", desc: "Place more students, prove outcomes" },
};

export const PLANS = [
  { name: "Starter", price: "Free", note: "1 active role" },
  { name: "Bounty", price: "₹0 upfront", note: "₹10,000 per hire after 15 days" },
  { name: "Growth", price: "₹4,999/mo", note: "5 active roles" },
];
export const EMPLOYER_LINKS: NavLink[] = [
  { label: "Post a role", desc: "Reach screened, scored candidates", href: "/employer/post", icon: "post", },
  { label: "AI Recruiter", desc: "RQ-Rita screens and shortlists for you", href: "/solutions/recruiters", icon: "recruit" },
  { label: "Enterprise", desc: "Autonomous HR and workforce intelligence", href: "/enterprise", icon: "enterprise" },
  { label: "For colleges", desc: "Placement and outcome proof for institutes", href: "/solutions/institutes", icon: "institute" },
];

export const RESOURCES: NavLink[] = [
  { label: "Experts", desc: "Book a human expert session", href: "/experts", icon: "experts" },
  { label: "Events", desc: "Workshops and live sessions", href: "/events", icon: "events" },
  { label: "Community", desc: "Learn alongside other ambitious people", href: "/community", icon: "community" },
  { label: "Blog", desc: "Guides on careers, skills and hiring", href: "/blog", icon: "blog" },
  { label: "Vision", desc: "Where GrowQR is headed", href: "/vision", icon: "vision" },
  { label: "Contact", desc: "Talk to the team", href: "/contact", icon: "contact" },
];

export const AGENT_LIST = (Object.keys(AGENT) as (keyof typeof AGENT)[]).map((k) => ({ key: k, ...AGENT[k] }));

/** Flat index for the command palette. */
export type Hit = { label: string; sub: string; href: string; external?: boolean; group: string; icon: IconKey };
export const INDEX: Hit[] = [
  ...PLATFORM.map((l) => ({ label: l.label, sub: l.desc ?? "", href: l.href, external: l.external, group: "Platform", icon: l.icon })),
  ...CAREERS_OPPS.map((l) => ({ label: l.label, sub: l.desc ?? "", href: l.href, external: l.external, group: "Careers", icon: l.icon })),
  ...CAREERS_LEARN.map((l) => ({ label: l.label, sub: l.desc ?? "", href: l.href, external: l.external, group: "Learn", icon: l.icon })),
  ...INTERNSHIPS.map((i) => ({ label: i.title, sub: `${i.company} · ${i.place} · ₹${i.stipend.toLocaleString("en-IN")}/mo`, href: "/internships", group: "Internships", icon: "briefcase" as IconKey })),
  ...COUNTRIES.map((c) => ({ label: `Study in ${c.name}`, sub: `${c.count} universities`, href: `/study-abroad/${c.name.toLowerCase()}`, group: "Study abroad", icon: "globe" as IconKey })),
  ...AGENT_LIST.map((a) => ({ label: a.name, sub: a.role, href: "/agents", group: "Agents", icon: "bot" as IconKey })),
  ...EMPLOYER_LINKS.map((l) => ({ label: l.label, sub: l.desc ?? "", href: l.href, external: l.external, group: "Employers", icon: l.icon })),
  ...RESOURCES.map((l) => ({ label: l.label, sub: l.desc ?? "", href: l.href, group: "Resources", icon: l.icon })),
];
