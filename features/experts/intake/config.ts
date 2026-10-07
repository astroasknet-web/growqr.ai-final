/* ══════════════════════════════════════════════════════════════════════════
   Expert Intake — shared config
   Single source of truth for the intake form's field shape, hard character
   limits, count ranges, and dropdown options. Imported by BOTH the client
   form (features/experts/components/sections/ExpertIntakeForm.tsx) and the
   server route handler (app/api/expert-intake/route.ts) so limits can never
   drift between the two.
   ══════════════════════════════════════════════════════════════════════════ */

import { personas } from "@/lib/personas";

/* ── Hard character limits (per single value) ──────────────────────────────── */
export const LIMITS = {
  name: 40,
  displayName: 40,
  role: 60,
  tag: 40,
  location: 40,
  headline: 70,
  bio: 120,
  intro: 280,
  about: 500,
  expertiseItem: 35,
  skillItem: 40,
  industryItem: 40,
  languageItem: 20,
  workCompany: 60,
  workPosition: 60,
  workDuration: 30,
  eduDegree: 80,
  eduSchool: 60,
  eduYear: 4,
  certificationItem: 100,
  awardItem: 100,
  whatTitle: 24,
  whatDescription: 40,
  statValue: 8,
  statLabel: 16,
  reviewName: 40,
  reviewRole: 60,
  reviewText: 350,
  faqQ: 100,
  faqA: 400,
  linkedinUrl: 300,
  trustedByItem: 40,
  trustedByLabel: 30,
} as const;

/* ── Count ranges for repeatable sections ──────────────────────────────────── */
export const COUNTS = {
  expertise: { min: 4, max: 8 },
  skills: { min: 3, max: 12 },
  industries: { min: 1, max: 8 },
  languages: { min: 1, max: 6 },
  workExperience: { min: 1, max: 6 },
  education: { min: 1, max: 5 },
  certifications: { min: 0, max: 10 },
  awards: { min: 0, max: 10 },
  whatYouGet: { min: 3, max: 6 },
  stats: { min: 2, max: 4 },
  reviews: { min: 2, max: 6 },
  faq: { min: 0, max: 8 },
  trustedBy: { min: 0, max: 10 },
} as const;

/* ── Dropdown options (derived from the canonical sources of truth) ─────────── */
export const PERSONA_OPTIONS = personas.map((p) => ({ value: p.id, label: p.label }));

export const COUNTRY_OPTIONS = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
] as const;

/* ── Form shape ────────────────────────────────────────────────────────────── */
export interface IntakeReview {
  name: string;
  role: string;
  rating: number;
  text: string;
  image: string;
}
export interface IntakeWork {
  company: string;
  position: string;
  duration: string;
}
export interface IntakeEducation {
  degree: string;
  school: string;
  year: string;
}
export interface IntakeWhatYouGet {
  title: string;
  description: string;
}
export interface IntakeStat {
  value: string;
  label: string;
}
export interface IntakeFaq {
  q: string;
  a: string;
}

export interface IntakeForm {
  // Step 1 — Basics & contact
  name: string;
  displayName: string;
  email: string;
  role: string;
  tag: string;
  country: string;
  location: string;
  persona: string;
  yearsExperience: string;
  headline: string;
  bio: string;
  intro: string;
  // Step 2 — About & skills
  about: string;
  expertise: string[];
  skills: string[];
  industries: string[];
  languages: string[];
  // Step 3 — Experience & education
  workExperience: IntakeWork[];
  education: IntakeEducation[];
  certifications: string[];
  awards: string[];
  // Step 4 — What you'll get & stats
  whatYouGet: IntakeWhatYouGet[];
  stats: IntakeStat[];
  // Step 5 — Testimonials
  reviews: IntakeReview[];
  // Step 6 — FAQ, links & media
  faq: IntakeFaq[];
  linkedinUrl: string;
  trustedBy: string[];
  trustedByLabel: string;
  image: string;
}

export const emptyIntakeForm: IntakeForm = {
  name: "",
  displayName: "",
  email: "",
  role: "",
  tag: "",
  country: "IN",
  location: "",
  persona: "",
  yearsExperience: "",
  headline: "",
  bio: "",
  intro: "",
  about: "",
  expertise: ["", "", "", ""],
  skills: ["", "", ""],
  industries: [""],
  languages: ["English"],
  workExperience: [{ company: "", position: "", duration: "" }],
  education: [{ degree: "", school: "", year: "" }],
  certifications: [],
  awards: [],
  whatYouGet: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ],
  stats: [{ value: "", label: "" }, { value: "", label: "" }],
  reviews: [
    { name: "", role: "", rating: 5, text: "", image: "" },
    { name: "", role: "", rating: 5, text: "", image: "" },
  ],
  faq: [],
  linkedinUrl: "",
  trustedBy: [],
  trustedByLabel: "",
  image: "",
};

/* ── Server-side validation ────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

const cap = (s: unknown) => (typeof s === "string" ? s.trim() : "");

/**
 * Validates a submitted intake payload server-side. Re-checks required fields,
 * every hard character limit, and count ranges. Returns a list of human-readable
 * error strings (empty = valid).
 */
export function validateIntake(data: Partial<IntakeForm>): string[] {
  const errors: string[] = [];
  const over = (label: string, value: string, limit: number) => {
    if (value.length > limit) errors.push(`${label} must be ${limit} characters or fewer.`);
  };
  const reqStr = (label: string, value: string, limit: number) => {
    if (!value) errors.push(`${label} is required.`);
    else over(label, value, limit);
  };

  // Step 1
  reqStr("Name", cap(data.name), LIMITS.name);
  if (cap(data.displayName)) over("Display name", cap(data.displayName), LIMITS.displayName);
  if (!cap(data.email)) errors.push("Email is required.");
  else if (!EMAIL_RE.test(cap(data.email))) errors.push("Email is not valid.");
  reqStr("Role", cap(data.role), LIMITS.role);
  reqStr("Tag", cap(data.tag), LIMITS.tag);
  if (!["IN", "US"].includes(cap(data.country))) errors.push("Country is invalid.");
  if (cap(data.location)) over("Location", cap(data.location), LIMITS.location);
  if (cap(data.persona) && !PERSONA_OPTIONS.some((p) => p.value === data.persona))
    errors.push("Persona is invalid.");
  if (!cap(data.yearsExperience) || Number.isNaN(Number(data.yearsExperience)))
    errors.push("Years of experience is required and must be a number.");
  reqStr("Headline", cap(data.headline), LIMITS.headline);
  reqStr("Bio", cap(data.bio), LIMITS.bio);
  reqStr("Intro", cap(data.intro), LIMITS.intro);

  // Step 2
  reqStr("About", cap(data.about), LIMITS.about);
  validateStringList(errors, "Expertise", data.expertise, COUNTS.expertise, LIMITS.expertiseItem);
  validateStringList(errors, "Skills", data.skills, COUNTS.skills, LIMITS.skillItem);
  validateStringList(errors, "Industries", data.industries, COUNTS.industries, LIMITS.industryItem);
  validateStringList(errors, "Languages", data.languages, COUNTS.languages, LIMITS.languageItem);

  // Step 3
  const work = (data.workExperience ?? []).filter((w) => cap(w.company) || cap(w.position));
  if (work.length < COUNTS.workExperience.min) errors.push("Add at least one work experience.");
  if (work.length > COUNTS.workExperience.max)
    errors.push(`Work experience: max ${COUNTS.workExperience.max} entries.`);
  work.forEach((w, i) => {
    reqStr(`Work #${i + 1} company`, cap(w.company), LIMITS.workCompany);
    reqStr(`Work #${i + 1} position`, cap(w.position), LIMITS.workPosition);
    reqStr(`Work #${i + 1} duration`, cap(w.duration), LIMITS.workDuration);
  });

  const edu = (data.education ?? []).filter((e) => cap(e.degree) || cap(e.school));
  if (edu.length < COUNTS.education.min) errors.push("Add at least one education entry.");
  edu.forEach((e, i) => {
    reqStr(`Education #${i + 1} degree`, cap(e.degree), LIMITS.eduDegree);
    reqStr(`Education #${i + 1} school`, cap(e.school), LIMITS.eduSchool);
    over(`Education #${i + 1} year`, cap(e.year), LIMITS.eduYear);
  });

  validateStringList(errors, "Certifications", data.certifications, COUNTS.certifications, LIMITS.certificationItem);
  validateStringList(errors, "Awards", data.awards, COUNTS.awards, LIMITS.awardItem);

  // Step 4
  const wyg = (data.whatYouGet ?? []).filter((w) => cap(w.title) || cap(w.description));
  if (wyg.length < COUNTS.whatYouGet.min)
    errors.push(`Add at least ${COUNTS.whatYouGet.min} "What you'll get" cards.`);
  if (wyg.length > COUNTS.whatYouGet.max)
    errors.push(`"What you'll get": max ${COUNTS.whatYouGet.max} cards.`);
  wyg.forEach((w, i) => {
    reqStr(`"What you'll get" #${i + 1} title`, cap(w.title), LIMITS.whatTitle);
    reqStr(`"What you'll get" #${i + 1} description`, cap(w.description), LIMITS.whatDescription);
  });

  const stats = (data.stats ?? []).filter((s) => cap(s.value) || cap(s.label));
  if (stats.length < COUNTS.stats.min) errors.push(`Add at least ${COUNTS.stats.min} highlight stats.`);
  if (stats.length > COUNTS.stats.max) errors.push(`Stats: max ${COUNTS.stats.max} entries.`);
  stats.forEach((s, i) => {
    reqStr(`Stat #${i + 1} value`, cap(s.value), LIMITS.statValue);
    reqStr(`Stat #${i + 1} label`, cap(s.label), LIMITS.statLabel);
  });

  // Step 5
  const reviews = (data.reviews ?? []).filter((r) => cap(r.name) || cap(r.text));
  if (reviews.length < COUNTS.reviews.min) errors.push(`Add at least ${COUNTS.reviews.min} testimonials.`);
  reviews.forEach((r, i) => {
    reqStr(`Testimonial #${i + 1} name`, cap(r.name), LIMITS.reviewName);
    reqStr(`Testimonial #${i + 1} role`, cap(r.role), LIMITS.reviewRole);
    reqStr(`Testimonial #${i + 1} text`, cap(r.text), LIMITS.reviewText);
    if (!(r.rating >= 1 && r.rating <= 5)) errors.push(`Testimonial #${i + 1} rating must be 1–5.`);
  });

  // Step 6
  const faq = (data.faq ?? []).filter((f) => cap(f.q) || cap(f.a));
  faq.forEach((f, i) => {
    reqStr(`FAQ #${i + 1} question`, cap(f.q), LIMITS.faqQ);
    reqStr(`FAQ #${i + 1} answer`, cap(f.a), LIMITS.faqA);
  });

  if (!cap(data.linkedinUrl)) errors.push("LinkedIn URL is required.");
  else if (!URL_RE.test(cap(data.linkedinUrl))) errors.push("LinkedIn URL must start with https://");
  over("LinkedIn URL", cap(data.linkedinUrl), LIMITS.linkedinUrl);

  validateStringList(errors, "Trusted by", data.trustedBy, COUNTS.trustedBy, LIMITS.trustedByItem);
  if (cap(data.trustedByLabel)) over("Trusted-by label", cap(data.trustedByLabel), LIMITS.trustedByLabel);

  if (!cap(data.image)) errors.push("A portrait photo is required.");

  return errors;
}

function validateStringList(
  errors: string[],
  label: string,
  list: string[] | undefined,
  count: { min: number; max: number },
  limit: number,
) {
  const items = (list ?? []).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
  if (items.length < count.min) errors.push(`${label}: add at least ${count.min}.`);
  if (items.length > count.max) errors.push(`${label}: max ${count.max} allowed.`);
  items.forEach((v) => {
    if (v.length > limit) errors.push(`${label} item must be ${limit} characters or fewer.`);
  });
}
