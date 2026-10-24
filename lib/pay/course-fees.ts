/**
 * Fees set by the owner, in rupees, charged once per course. The key is the category name in lib/market/data/courses.json.
 * Seeding only creates missing products, so a price changed in the console is never overwritten by these numbers.
 */
export const COURSE_FEE_RUPEES: Record<string, number> = {
  "Blockchain & Web3": 799,
  "AI & Machine Learning": 699,
  "Data, Analytics & BI": 599,
  "Business, Management & Product": 499,
  "Digital & Office Productivity": 399,
  "Software Development": 499,
  "Cloud, DevOps & Infrastructure": 599,
  "Digital Marketing & Growth": 499,
  "Cybersecurity": 499,
  "Design & Creative": 599,
  "Finance, Accounting & Investing": 399,
  "Communication & Career Skills": 499,
  "Entrepreneurship & Freelancing": 399,
  "Test Prep & Study Skills": 399,
  "Content & Personal Branding": 499,
  "Foreign Languages": 699,
  "Health & Wellness": 499,
  "Digital Safety & Life Skills": 299,
  "University Programmes (BBA, BCA, MCA, MBA)": 299,
};

/**
 * Other fees set by the owner. They are saved as products but kept OFF sale: what each one unlocks (and which free pages, if any,
 * move behind it) is still to be decided, so nothing can be bought yet.
 */
export const EXAM_PRODUCTS: Array<{ sku: string; title: string; description: string; rupees: number }> = [
  { sku: "imo-all-classes", title: "IMO Maths Olympiad, all classes", description: "Olympiad practice for every class.", rupees: 499 },
  { sku: "exam-jee", title: "JEE preparation", description: "JEE preparation.", rupees: 699 },
  { sku: "exam-neet", title: "NEET preparation", description: "NEET preparation.", rupees: 699 },
  { sku: "ielts-prep", title: "IELTS preparation", description: "IELTS preparation.", rupees: 799 },
  { sku: "writing-studio", title: "Writing Clinic (Writing studio)", description: "Essay checks and writing practice.", rupees: 499 },
];

/**
 * Studios sold as one course each. They are not in the course catalogue, but they are bought, entitled and refunded exactly like a catalogue course
 * (sku `course-<slug>`, kind `course`, see lib/pay/course-access.ts). The fee is the owner's to change in the console; seeding never overwrites it.
 * `onSale: false` saves the product and its price but keeps it off sale, as with EXAM_PRODUCTS.
 */
export const STUDIO_COURSES: Array<{ slug: string; title: string; description: string; rupees: number; onSale: boolean }> = [
  {
    slug: "mathematics-speed-enhancement",
    title: "Mathematics Speed Enhancement Studio",
    description: "One continuous course in 15 levels (A to O) that builds speed and accuracy in mental calculation, with a placement check, timed practice and spaced review. Level A, Module 1 is free.",
    rupees: 599,
    onSale: true,
  },
];
