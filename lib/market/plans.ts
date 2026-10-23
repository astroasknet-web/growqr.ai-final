/**
 * Student packages. One place for the names, prices and what each includes, so the pricing page, emails and (later) checkout read the
 * same numbers. Prices are in rupees. For Pro and Silver the yearly price is about eight months' worth (about a third off).
 * Gold is sold as an annual plan only (one payment a year).
 * `soon` is an optional flag that shows a "Soon" tag next to a feature that is not live yet. No feature uses it at the moment.
 */
export interface PlanFeature { text: string; soon?: boolean }
export interface Plan {
  key: "free" | "pro" | "silver" | "gold";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  /** Sold only as one payment a year. */
  annualOnly?: boolean;
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
      { text: "Explore all the courses on the platform" },
      { text: "Vedic Mathematics, module 1" },
      { text: "Resume Studio: 3 templates, 1 resume" },
      { text: "Writing Clinic: 2 essay checks a month. Build your writing for IELTS, SAT, GRE, GMAT and other exams" },
    ],
  },
  {
    key: "pro", name: "Pro", tagline: "Everything you need to prepare and apply.", monthly: 399, yearly: 3199, accent: "#4f46e5", cta: "Get Pro", inherits: "Everything in Free, plus",
    features: [
      { text: "Complete Vedic Mathematics course, worth ₹999" },
      { text: "Resume Studio: 10 templates, 3 resumes, no waiting between saves" },
      { text: "Resume scan and score check" },
      { text: "1 AI resume score check a month" },
      { text: "Writing Clinic: 15 essay checks a month" },
      { text: "1 course recommended from your resume scan results" },
    ],
  },
  {
    key: "silver", name: "Silver", tagline: "For students aiming for jobs and internships.", monthly: 699, yearly: 5599, badge: "Most popular", accent: "#64748b", cta: "Get Silver", inherits: "Everything in Pro, plus",
    features: [
      { text: "Resume Studio: 25 templates, 10 resumes" },
      { text: "5 AI resume score checks a month, with ATS feedback" },
      { text: "10 IELTS Reading and Writing tests" },
      { text: "Verified, shareable Skill Passport with QR credential" },
      { text: "2 AI interview practice sessions with feedback" },
      { text: "Writing Clinic: 25 essay checks a month" },
      { text: "One career counselling and doubt-solving session with experts every month" },
      { text: "2 courses recommended from your resume scan results" },
      { text: "Maths calculation speed studio, for competitive exams" },
    ],
  },
  {
    key: "gold", name: "Gold", tagline: "Hands-on help for study abroad and careers.", monthly: 999, yearly: 999, annualOnly: true, badge: "Best value", accent: "#d97706", cta: "Get Gold", inherits: "Everything in Silver, plus",
    features: [
      { text: "All 45 Resume Studio templates, unlimited resumes" },
      { text: "QR Score Booster: start all your recommended courses (3 to 4) with a plan to raise your score" },
      { text: "30 IELTS Reading and Writing tests" },
      { text: "Writing Clinic: unlimited essay checks" },
      { text: "Live English speaking classes, for IELTS, TOEFL and professional growth" },
      { text: "Study abroad registration portal, with a university shortlist matched to your documents" },
      { text: "One 1:1 overseas education counselling session a year" },
      { text: "One expert review of your resume a year" },
      { text: "2 mock visa interviews a year" },
      { text: "Priority email support" },
    ],
  },
];

type Row = { label: string; v: [string, string, string, string]; soon?: boolean };
/** Side-by-side values for the comparison table (same order as PLANS: Free, Pro, Silver, Gold). */
export const COMPARE: Array<{ group: string; rows: Row[] }> = [
  { group: "Learn", rows: [
    { label: "Courses", v: ["Explore all", "Explore all", "Explore all", "Explore all"] },
    { label: "Vedic Mathematics", v: ["Module 1", "Complete course", "Complete course", "Complete course"] },
    { label: "Courses recommended from your resume scan", v: ["–", "1", "2", "All (3 to 4)"] },
    { label: "IELTS Reading and Writing tests", v: ["–", "–", "10", "30"] },
    { label: "Maths calculation speed studio", v: ["–", "–", "Yes", "Yes"] },
  ] },
  { group: "Resume Studio", rows: [
    { label: "Templates", v: ["3", "10", "25", "All 45"] },
    { label: "Saved resumes", v: ["1", "3", "10", "Unlimited"] },
    { label: "Resume scan and score check", v: ["–", "Yes", "Yes", "Yes"] },
    { label: "AI resume score checks a month", v: ["–", "1", "5", "5"] },
    { label: "ATS feedback", v: ["–", "–", "Yes", "Yes"] },
  ] },
  { group: "Writing Clinic", rows: [
    { label: "Essay checks a month", v: ["2", "15", "25", "Unlimited"] },
    { label: "Exams: IELTS, GRE, GMAT, SAT, college essays", v: ["All", "All", "All", "All"] },
  ] },
  { group: "Career and skills", rows: [
    { label: "Skill Passport", v: ["Basic", "Basic", "Verified (QR)", "Verified (QR)"] },
    { label: "AI interview practice", v: ["–", "–", "2", "2"] },
    { label: "Career counselling and doubt-solving session", v: ["–", "–", "Monthly", "Monthly"] },
    { label: "QR Score Booster plan", v: ["–", "–", "–", "Yes"] },
  ] },
  { group: "Study abroad and expert help", rows: [
    { label: "Study abroad portal with university shortlist", v: ["–", "–", "–", "Yes"] },
    { label: "1:1 overseas counselling session", v: ["–", "–", "–", "1 a year"] },
    { label: "Expert resume review", v: ["–", "–", "–", "1 a year"] },
    { label: "Mock visa interviews", v: ["–", "–", "–", "2 a year"] },
    { label: "Live English speaking classes", v: ["–", "–", "–", "Yes"] },
    { label: "Support", v: ["Community", "Standard", "Standard", "Priority email"] },
  ] },
];

export const savingPercent = (p: Plan): number => (p.monthly && !p.annualOnly ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100) : 0);

export const FAQ: Array<{ q: string; a: string }> = [
  { q: "Is the Free plan really free?", a: "Yes. There is no card, no trial and no time limit. You can move up to a paid plan whenever you want." },
  { q: "Why is Gold only sold yearly?", a: "Gold includes sessions with our experts, such as overseas counselling, a resume review and mock visa interviews. We offer it as one annual payment so those sessions can be planned and kept at this price." },
  { q: "Can I switch or cancel?", a: "You can change plan any time. Yearly plans can be cancelled within 7 days for a refund, as set out in our refund policy." },
  { q: "Do I get a discount for paying yearly?", a: "On Pro and Silver, yes. Paying for a year costs eight months, about one third off." },
  { q: "Are these the final prices?", a: "These are early-access prices to help students get started. Anyone who joins now keeps this price while their plan stays active." },
  { q: "How do I pay?", a: "By UPI, card or net banking through Razorpay. Online checkout is being switched on; sign up now and we will email you when your plan can be activated." },
];
