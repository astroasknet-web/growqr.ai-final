import { SITE_URL } from "@/lib/seo";
import type { BlogPost, BlogPostSummary } from "./blogforge";
import type { LocalExtras } from "./local";

/**
 * SEO helpers for the blog. The engine can be configured with any base URL, so GrowQR builds its own canonical URL and structured data
 * from the post fields instead of trusting the engine's `canonical` / `json_ld`: a wrong engine setting can then never point Google at
 * the wrong host.
 */
const PUBLISHER = { "@type": "Organization", name: "GrowQR", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/growqr-logo.png` } };
export const postUrl = (slug: string): string => `${SITE_URL}/blog/${encodeURIComponent(slug)}`;

const iso = (s: string | null | undefined): string | undefined => {
  if (!s) return undefined;
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
export const toIso = iso;

/** BlogPosting + BreadcrumbList for one post. */
export function postJsonLd(post: BlogPost, extras?: LocalExtras): object {
  const url = postUrl(post.slug);
  const published = iso(post.published_at);
  const modified = iso(post.updated_at) ?? published;
  const rawImage = post.meta?.og_image ?? post.cover_image ?? undefined;
  const image = rawImage && rawImage.startsWith("/") ? `${SITE_URL}${rawImage}` : rawImage;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: post.title.slice(0, 110),
        description: post.meta?.description ?? post.excerpt ?? undefined,
        ...(image ? { image: [image] } : {}),
        ...(published ? { datePublished: published } : {}),
        ...(modified ? { dateModified: modified } : {}),
        author: { "@type": "Person", name: post.author || "GrowQR" },
        publisher: PUBLISHER,
        ...(post.category ? { articleSection: post.category } : {}),
        ...(extras ? { keywords: extras.keywords, isAccessibleForFree: true, educationalUse: "practice", learningResourceType: "Quiz and study guide" } : {}),
        inLanguage: "en",
      },
      ...(extras && extras.faq.length
        ? [{ "@type": "FAQPage", mainEntity: extras.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title },
        ],
      },
    ],
  };
}

/** Blog index: breadcrumb plus an ItemList of the posts shown. */
export function indexJsonLd(posts: BlogPostSummary[]): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Blog", name: "GrowQR Blog", url: `${SITE_URL}/blog`, publisher: PUBLISHER },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` }] },
      { "@type": "ItemList", itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: postUrl(p.slug), name: p.title })) },
    ],
  };
}

export interface LearnLink { href: string; label: string; why: string }

const RULES: Array<{ re: RegExp; links: LearnLink[] }> = [
  { re: /\bielts\b|\bband\b|\bacademic reading\b/i, links: [{ href: "/practice-tests/ielts-reading", label: "IELTS Reading practice tests", why: "30 timed tests, marked instantly" }, { href: "/practice-tests/ielts-listening", label: "IELTS Listening practice tests", why: "Four sections, played once" }] },
  { re: /\bgre\b|\bquant(itative)?\b|\bgraduate record\b/i, links: [{ href: "/practice-tests/gre-quant", label: "GRE Quant practice tests", why: "30 mocks covering all 26 topics" }] },
  { re: /\bdata science|machine learning|\bml\b/i, links: [{ href: "/courses/data-science-python", label: "Data Science using Python", why: "11 modules with quizzes and a capstone" }] },
  { re: /data analy(tics|st)|\bsql\b|\bpandas\b/i, links: [{ href: "/courses/data-analytics-python", label: "Data Analytics using Python", why: "10 modules with quizzes and a capstone" }] },
  { re: /\bhtml\b|\bcss\b|web design|front-?end/i, links: [{ href: "/courses/html-css-academy", label: "HTML & CSS Academy", why: "32 lessons, from first tag to responsive site" }] },
  { re: /digital literacy|computer basics|beginner.*computer|online safety/i, links: [{ href: "/courses/digital-literacy-master", label: "Digital Literacy Master Course", why: "Start from zero, no experience needed" }] },
];

/** Up to three learning links that match a post's title, category and excerpt; falls back to the course and practice-test hubs. */
export function relatedLearning(post: Pick<BlogPostSummary, "title" | "category" | "excerpt">): LearnLink[] {
  const hay = `${post.title} ${post.category ?? ""} ${post.excerpt ?? ""}`;
  const out: LearnLink[] = [];
  for (const r of RULES) if (r.re.test(hay)) for (const l of r.links) if (!out.some((o) => o.href === l.href)) out.push(l);
  if (!out.length) return [{ href: "/courses", label: "Browse all courses", why: "120 self-paced courses with certificates" }, { href: "/practice-tests", label: "Free practice tests", why: "IELTS and GRE, marked instantly" }];
  return out.slice(0, 3);
}
