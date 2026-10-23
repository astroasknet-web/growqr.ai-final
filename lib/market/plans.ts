/**
 * Student packages. One place for the names, prices and what each includes, so the pricing page, emails and (later) checkout read the
 * same numbers. Prices are in rupees. The yearly price is eight months' worth (about a third off).
 * A feature marked `soon` is on the roadmap and shown with a "Soon" tag; it is not promised as live.
 */
export interface PlanFeature { text: string; soon?: boolean }
export interface Plan {
  key: "free" | "pro" | "silver" | "gold";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  badge?: string;
  accent: string;
  cta: string;
  inherits?: string;
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    key: "free", name: "Free", tagline: "Start learning today. No card needed.", monthly: 0, yearly: 0, accent: "#16a34a", cta: "Start free",
    features: [
      { text: "Free-tier courses with lessons you can start right away" },
      { text: "Exam prep chapters: JEE, NEET, AP, school Class 1 to 12, Olympiad, IELTS, Vedic Maths" },
      { text: "1 mock test per exam" },
      { text: "Resume Studio: 3 templates, 1 resume" },
      { text: "3 internship applications a month" },
      { text: "Writing Clinic: 3 essay checks a month (IELTS, GRE, GMAT, SAT, college essays)" },
    ],
  },
  {
    key: "pro", name: "Pro", tagline: "Everything you need to prepare and apply.", monthly: 399, yearly: 3199, accent: "#4f46e5", cta: "Get Pro", inherits: "Everything in Free, plus",
    features: [
      { text: "40 courses, with completion certificates" },
      { text: "Resume Studio: 10 templates, 3 resumes, no waiting between saves" },
      { text: "5 mock tests per exam, with score and topic analysis" },
      { text: "2 AI resume score checks a month" },
      { text: "10 internship applications a month" },
      { text: "Writing Clinic: 15 essay checks a month, with saved history" },
      { text: "Progress tracker and study streaks, no ads" },
    ],
  },
  {
    key: "silver", name: "Silver", tagline: "For students aiming for jobs and internships.", monthly: 599, yearly: 4799, badge: "Most popular", accent: "#64748b", cta: "Get Silver", inherits: "Everything in Pro, plus",
    features: [
      { text: "All 120+ courses, with certificates" },
      { text: "Resume Studio: 25 templates, 10 resumes" },
      { text: "15 mock tests per exam" },
      { text: "10 AI resume score checks a month, with ATS feedback" },
      { text: "30 internship applications a month, with priority review", soon: true },
      { text: "Writing Clinic: 25 essay checks a month, with progress charts" },
      { text: "Verified, shareable Skill Passport with QR credential" },
      { text: "AI interview practice with feedback", soon: true },
      { text: "Live doubt-solving sessions, twice a month", soon: true },
    ],
  },
  {
    key: "gold", name: "Gold", tagline: "Hands-on help for study abroad and careers.", monthly: 899, yearly: 7199, badge: "Best value", accent: "#d97706", cta: "Get Gold", inherits: "Everything in Silver, plus",
    features: [
      { text: "All 45 Resume Studio templates, unlimited resumes" },
      { text: "Unlimited mock tests and AI resume score checks" },
      { text: "Unlimited internship applications, with priority review", soon: true },
      { text: "Writing Clinic: unlimited checks, plus AI feedback on your ideas", soon: true },
      { text: "Study abroad: university shortlist, document checklist and application tracker" },
      { text: "One 1:1 counselling session every month", soon: true },
      { text: "Expert review of your resume and statement of purpose", soon: true },
      { text: "Mock visa and admission interviews", soon: true },
      { text: "Priority support on WhatsApp" },
    ],
  },
];

/** Side-by-side numbers for the comparison table (same order as PLANS: Free, Pro, Silver, Gold). */
export const COMPARE: Array<{ group: string; rows: Array<{ label: string; v: [string, string, string, string]; soon?: boolean }> }> = [
  { group: "Learn", rows: [
    { label: "Courses", v: ["Free-tier", "40", "All 120+", "All 120+"] },
    { label: "Course certificates", v: ["–", "Yes", "Yes", "Yes"] },
    { label: "Mock tests per exam", v: ["1", "5", "15", "Unlimited"] },
    { label: "Score and topic analysis", v: ["–", "Yes", "Yes", "Yes"] },
  ] },
  { group: "Resume Studio", rows: [
    { label: "Templates", v: ["3", "10", "25", "All 45"] },
    { label: "Saved resumes", v: ["1", "3", "10", "Unlimited"] },
    { label: "AI resume score checks a month", v: ["–", "2", "10", "Unlimited"] },
    { label: "ATS feedback", v: ["–", "–", "Yes", "Yes"] },
  ] },
  { group: "Writing Clinic", rows: [
    { label: "Essay checks a month", v: ["3", "15", "25", "Unlimited"] },
    { label: "Exams: IELTS, GRE, GMAT, SAT, college essays", v: ["All", "All", "All", "All"] },
    { label: "Saved history and progress charts", v: ["–", "History", "Charts", "Charts"] },
    { label: "AI feedback on ideas", v: ["–", "–", "–", "Yes"], soon: true },
  ] },
  { group: "Jobs and internships", rows: [
    { label: "Applications a month", v: ["3", "10", "30", "Unlimited"], soon: true },
    { label: "Priority review", v: ["–", "–", "Yes", "Yes"], soon: true },
    { label: "Verified Skill Passport (QR)", v: ["Basic", "Basic", "Verified", "Verified"] },
    { label: "AI interview practice", v: ["–", "–", "Yes", "Yes"], soon: true },
  ] },
  { group: "Study abroad and support", rows: [
    { label: "University shortlist and tracker", v: ["–", "–", "–", "Yes"] },
    { label: "1:1 counselling", v: ["–", "–", "–", "Monthly"], soon: true },
    { label: "Expert resume and SOP review", v: ["–", "–", "–", "Yes"], soon: true },
    { label: "Live doubt sessions", v: ["–", "–", "2 a month", "2 a month"], soon: true },
    { label: "Support", v: ["Community", "Email", "Priority email", "WhatsApp"] },
  ] },
];

export const savingPercent = (p: Plan): number => (p.monthly ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100) : 0);

export const FAQ: Array<{ q: string; a: string }> = [
  { q: "Is the Free plan really free?", a: "Yes. There is no card, no trial and no time limit. You can move up to a paid plan whenever you want." },
  { q: "Can I switch or cancel?", a: "You can change plan any time. Yearly plans can be cancelled within 7 days for a refund, as set out in our refund policy." },
  { q: "Do I get a discount for paying yearly?", a: "Yes. Paying for a year costs eight months, about one third off." },
  { q: "Are these the final prices?", a: "These are early-access prices to help students get started. Anyone who joins now keeps this price while their plan stays active." },
  { q: "How do I pay?", a: "By UPI, card or net banking through Razorpay. Online checkout is being switched on; sign up now and we will email you when your plan can be activated." },
];
