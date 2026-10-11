import { slugify } from "./discovery";

/**
 * Topic (category) landing pages. A topic page is only worth indexing when it says something a list of links cannot: a written
 * introduction, a "start here" article and matching courses. So the rule is explicit:
 *   indexable = has a curated introduction here AND at least MIN_POSTS_TO_INDEX posts.
 * Anything else still works for readers (and is linked) but is noindex, so thin archives never compete with the real articles.
 */
export const MIN_POSTS_TO_INDEX = 3;

export interface Topic {
  slug: string;
  /** Display name, used when no post supplies one. */
  name: string;
  /** Meta description, 120 to 155 characters. */
  description: string;
  /** A short written introduction shown above the posts (plain paragraphs). */
  intro: string[];
  /** Slug of the article to read first, if one exists. */
  pillar?: string;
  /** Courses and tools that match the topic. */
  learn: Array<{ href: string; label: string; why: string }>;
}

export const TOPICS: Topic[] = [
  {
    slug: "digital-literacy",
    name: "Digital Literacy",
    description: "Guides and quizzes on everyday digital skills: files, documents, spreadsheets, email, online safety and AI. Practise free in your browser.",
    intro: [
      "Digital literacy is the ability to find, judge, create and share information with digital tools, and to do it safely. It is wider than knowing which button to press, and it is the skill school and work now assume you already have.",
      "The articles here test and teach the practical side: formatting a document, writing a formula, spotting a scam message, using AI without handing it your private details. Most come with a quiz so you can check yourself before you practise.",
    ],
    pillar: "digital-literacy-quiz-with-answers",
    learn: [
      { href: "/courses/digital-literacy-master", label: "Digital Literacy Master Course", why: "8 modules and 27 hands-on activities" },
      { href: "/courses/basic-computer-internet-literacy", label: "Basic Computer & Internet Literacy", why: "Files, folders, browsers and the cloud" },
      { href: "/courses/cyber-hygiene-families", label: "Cyber Hygiene & Digital Safety", why: "Passwords, phishing and OTP scams" },
    ],
  },
  {
    slug: "ielts",
    name: "IELTS",
    description: "IELTS preparation guides and practice for Reading, Writing, Listening and Speaking, with timed tests marked instantly. Start practising free.",
    intro: [
      "IELTS rewards a method as much as English ability: knowing how each task is marked, where time goes and which mistakes cost the most bands.",
      "These articles explain the format and the strategy for each skill, and link to timed practice tests you can take as often as you like.",
    ],
    pillar: "ielts-reading-tips",
    learn: [
      { href: "/practice-tests/ielts-reading", label: "IELTS Reading practice tests", why: "30 timed tests, marked instantly" },
      { href: "/practice-tests/ielts-listening", label: "IELTS Listening practice tests", why: "Four sections, played once" },
    ],
  },
  {
    slug: "gre",
    name: "GRE",
    description: "GRE Quant guides and strategy with timed practice tests covering every topic. Learn the method, then test yourself free.",
    intro: [
      "GRE Quant tests reasoning under time pressure more than advanced mathematics. The topics are school-level; the difficulty is in the wording and the clock.",
      "These articles cover the topics and the way the questions are built, and connect to full practice tests.",
    ],
    pillar: "gre-quant-preparation",
    learn: [{ href: "/practice-tests/gre-quant", label: "GRE Quant practice tests", why: "30 mocks covering all 26 topics" }],
  },
  {
    slug: "data-science",
    name: "Data Science",
    description: "Data science with Python explained for beginners: study plans, the mistakes that stall learners, and quizzes to test yourself. Build a first project.",
    intro: [
      "Data science is the work of answering questions with data and building models that hold up on new data. Python is the usual tool, and the order you learn things in matters more than which course you pick.",
      "These articles give you a realistic path, name the mistakes beginners repeat, and link to the course and exercises where you can build a project of your own.",
    ],
    pillar: "learn-data-science-with-python",
    learn: [
      { href: "/courses/data-science-python", label: "Data Science using Python", why: "11 modules ending in a capstone project" },
      { href: "/courses/python-foundations", label: "Programming Foundations with Python", why: "Start here if you are new to code" },
      { href: "/courses/statistics-for-analysts", label: "Statistics for Analysts & Data Science", why: "The maths behind the models" },
    ],
  },
  {
    slug: "data-analytics",
    name: "Data Analytics",
    description: "Data analytics for beginners: what analysts do, the tools to learn in order, first projects and quizzes. Start with spreadsheets and SQL.",
    intro: [
      "Analytics is the habit of turning a vague question into a clear answer that someone can act on. It starts with spreadsheets and SQL and grows into Python and dashboards.",
      "The articles here explain the skills in the order to learn them, with small projects you can finish and checks you can take as you go.",
    ],
    pillar: "data-analytics-for-beginners",
    learn: [
      { href: "/courses/data-analytics-python", label: "Data Analytics using Python", why: "10 modules from pandas to reporting" },
      { href: "/courses/sql-for-data-business", label: "SQL for Data & Business", why: "Query and summarise real data" },
      { href: "/courses/business-analytics-power-bi", label: "Business Analytics with Power BI", why: "Dashboards managers can use" },
    ],
  },
  {
    slug: "web-development",
    name: "Web Development",
    description: "HTML and CSS for beginners, with code you can copy, layout fixes and quizzes. Build responsive pages and learn what to study next.",
    intro: [
      "Every website starts with HTML for structure and CSS for style. Get those two right and everything else, from JavaScript to frameworks, is easier to learn.",
      "These guides build real pages step by step, show the layout problems everyone meets, and point to the course with a live editor.",
    ],
    pillar: "html-and-css-for-beginners",
    learn: [
      { href: "/courses/html-css-academy", label: "HTML & CSS Academy", why: "32 lessons with a live code playground" },
      { href: "/courses/front-end-development", label: "Front-End Development", why: "Add JavaScript to your pages" },
      { href: "/courses/git-github", label: "Git & GitHub for Developers", why: "Save and publish your work" },
    ],
  },
];

export const topicBySlug = (slug: string): Topic | undefined => TOPICS.find((t) => t.slug === slug);

/** The topic for a category name: the curated one if there is one, otherwise a plain stand-in (never indexable). */
export function topicFor(slug: string, categoryName?: string): { topic: Topic; curated: boolean } | null {
  const curated = topicBySlug(slug);
  if (curated) return { topic: curated, curated: true };
  if (!categoryName || slugify(categoryName) !== slug) return null;
  return {
    curated: false,
    topic: { slug, name: categoryName, description: `Articles on ${categoryName} from the GrowQR blog, with related courses and practice.`, intro: [], learn: [{ href: "/courses", label: "Browse all courses", why: "Self-paced courses with certificates" }] },
  };
}

export const isIndexableTopic = (curated: boolean, postCount: number): boolean => curated && postCount >= MIN_POSTS_TO_INDEX;
