import type { BlogPost, BlogPostSummary } from "./blogforge";
import digitalLiteracyQuiz from "./posts/digital-literacy-quiz-with-answers";

/**
 * Posts that live in the repository (typed, reviewed and versioned with the code) next to the ones served by the blog engine.
 * A "standard post" has a focus keyword, an SEO title and description, a cover image with alt text, optional interactive quiz,
 * FAQs and sources. `lib/blog/standard.ts` audits every post against the house standard (see BLOG-STANDARD.md).
 */
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string }
export interface Quiz { title: string; intro: string; questions: QuizQuestion[] }
export interface Faq { q: string; a: string }
export interface Source { label: string; href: string; note: string }
export interface Cta { title: string; text: string; href: string; label: string }
export interface LocalPost {
  slug: string;
  /** The page H1. */
  title: string;
  /** The <title> tag: 50 to 60 characters, focus keyword first. */
  seoTitle: string;
  /** Meta description: 120 to 155 characters, focus keyword, ends with a mild call to action. */
  description: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  category: string;
  author: string;
  published: string; // "YYYY-MM-DD HH:MM:SS" UTC
  updated: string;
  excerpt: string;
  cover: { src: string; alt: string; width: number; height: number };
  /** Body HTML (no H1). Put `<!--quiz-->` where the interactive quiz goes. */
  content: string;
  quiz?: Quiz;
  faq: Faq[];
  cta: Cta;
  sources: Source[];
}

export interface LocalExtras { keywords: string; quiz?: Quiz; faq: Faq[]; cta: Cta; sources: Source[]; seoTitle: string; focusKeyword: string; cover: LocalPost["cover"] }
export type LocalBlogPost = BlogPost & { extras: LocalExtras };

export const LOCAL_POSTS: LocalPost[] = [digitalLiteracyQuiz];

const text = (html: string): string => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
export const readingMinutes = (p: LocalPost): number => {
  const words = text(p.content).split(" ").length + p.faq.reduce((n, f) => n + f.a.split(/\s+/).length, 0) + (p.quiz ? p.quiz.questions.length * 12 : 0);
  return Math.max(1, Math.round(words / 200));
};

const meta = (p: LocalPost) => ({ title: p.seoTitle, description: p.description, canonical: null, og_image: p.cover.src, noindex: false });
const summary = (p: LocalPost, i: number): BlogPostSummary => ({
  id: -(i + 1), title: p.title, slug: p.slug, excerpt: p.excerpt, cover_image: p.cover.src, category: p.category, author: p.author,
  reading_minutes: readingMinutes(p), url: `/blog/${p.slug}`, published_at: p.published, updated_at: p.updated, meta: meta(p),
});

export function localSummaries(opts: { category?: string } = {}): BlogPostSummary[] {
  return LOCAL_POSTS.map(summary).filter((p) => !opts.category || p.category?.toLowerCase() === opts.category.toLowerCase());
}

export function localPost(slug: string): LocalBlogPost | null {
  const i = LOCAL_POSTS.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  const p = LOCAL_POSTS[i];
  return { ...summary(p, i), content: p.content, json_ld: "", meta: meta(p), extras: { keywords: [p.focusKeyword, ...p.secondaryKeywords].join(", "), quiz: p.quiz, faq: p.faq, cta: p.cta, sources: p.sources, seoTitle: p.seoTitle, focusKeyword: p.focusKeyword, cover: p.cover } };
}

export const isLocal = (post: BlogPost): post is LocalBlogPost => "extras" in post;
