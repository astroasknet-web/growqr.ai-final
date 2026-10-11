import type { LocalPost } from "./local";

/**
 * The house standard for an educational blog post, as code. Run it on every post before publishing (`npm run blog:audit`).
 * The rules come from our SEO and writing standard (BLOG-STANDARD.md): search basics that are verifiable from the text itself,
 * plus the human-writing rules that keep a post from reading as generated. It cannot judge whether the advice is good,
 * so a person still reads the post; it does make sure nothing mechanical is missed.
 */
export interface AuditCheck { id: string; group: "SEO" | "Structure" | "Links" | "Writing" | "Quiz"; label: string; pass: boolean; detail: string }
export interface AuditResult { score: number; passed: number; total: number; ok: boolean; checks: AuditCheck[]; stats: Record<string, number> }

const stripTags = (html: string): string => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, "x").replace(/\s+/g, " ").trim();
const words = (s: string): number => (s.trim() === "" ? 0 : s.trim().split(/\s+/).length);
const sentences = (s: string): number => (s.match(/[^.!?]+[.!?]+/g) ?? [s]).filter((x) => x.trim().length > 2).length;
const attr = (tag: string, name: string): string | null => new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1] ?? null;

export const BANNED = [
  "in today's rapidly evolving", "in today’s rapidly evolving", "dive into", "delve", "it's worth noting", "it’s worth noting", "it is worth noting", "it's important to note", "it is important to note",
  "furthermore", "moreover", "in conclusion", "in summary", "let's explore", "let's dive", "without further ado", "start your journey", "don't miss out", "game-changer", "unlock your potential", "navigate the landscape",
];

export function auditPost(p: LocalPost, opts: { siteHost?: string } = {}): AuditResult {
  const host = opts.siteHost ?? "growqr.ai";
  const body = stripTags(p.content);
  const faqText = p.faq.map((f) => f.a).join(" ");
  const prose = `${body} ${faqText}`;
  const kw = p.focusKeyword.toLowerCase();
  const total = words(prose);
  const kwCount = (prose.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
  const density = total ? (kwCount / total) * 100 : 0;
  const first100 = body.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
  const h2s = [...p.content.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripTags(m[1]));
  const h3s = [...p.content.matchAll(/<h3\b[^>]*>/gi)].length;
  const paras = [...p.content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => words(stripTags(m[1]))).filter((n) => n > 0);
  const mean = paras.reduce((a, b) => a + b, 0) / (paras.length || 1);
  const sd = Math.sqrt(paras.reduce((a, b) => a + (b - mean) ** 2, 0) / (paras.length || 1));
  const cv = mean ? sd / mean : 0;
  const anchors = [...p.content.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
  const hrefs = anchors.map((a) => ({ href: attr(a, "href") ?? "", a }));
  const internal = hrefs.filter((h) => h.href.startsWith("/") || h.href.includes(host));
  const outbound = hrefs.filter((h) => /^https:\/\//i.test(h.href) && !h.href.includes(host));
  const lower = `${prose} ${p.quiz?.questions.map((q) => q.q + " " + q.explain).join(" ") ?? ""}`.toLowerCase();
  const banned = BANNED.filter((b) => lower.includes(b));
  const emDash = (prose.match(/—/g) ?? []).length;
  const tables = (p.content.match(/<table\b/gi) ?? []).length;
  const h2Count = h2s.length + 2; // the page adds the FAQ and Related courses headings
  const ans = p.quiz ? p.quiz.questions.map((q) => q.answer) : [];
  const share = ans.length ? Math.max(0, ...[0, 1, 2, 3].map((i) => ans.filter((a) => a === i).length / ans.length)) : 0;

  const checks: AuditCheck[] = [];
  const add = (id: string, group: AuditCheck["group"], label: string, pass: boolean, detail: string) => checks.push({ id, group, label, pass, detail });

  add("title-len", "SEO", "SEO title is 50 to 60 characters", p.seoTitle.length >= 50 && p.seoTitle.length <= 60, `${p.seoTitle.length} characters`);
  add("title-kw", "SEO", "SEO title and H1 contain the focus keyword", p.seoTitle.toLowerCase().includes(kw) && p.title.toLowerCase().includes(kw), `"${p.focusKeyword}"`);
  add("title-front", "SEO", "Focus keyword sits at the start of the SEO title", p.seoTitle.toLowerCase().startsWith(kw), p.seoTitle.slice(0, 40));
  add("desc", "SEO", "Meta description is 120 to 155 characters with the keyword", p.description.length >= 120 && p.description.length <= 155 && p.description.toLowerCase().includes(kw), `${p.description.length} characters`);
  add("desc-cta", "SEO", "Meta description ends with a mild call to action", /(check|take|try|start|read|learn|get|see|practise|practice)[^.]*\.$/i.test(p.description), p.description.slice(-40));
  add("intro-kw", "SEO", "Focus keyword appears in the first 100 words", first100.includes(kw), "");
  add("h2-kw", "SEO", "Focus keyword appears in at least 2 H2 headings", h2s.filter((h) => h.toLowerCase().includes(kw)).length >= 2, `${h2s.filter((h) => h.toLowerCase().includes(kw)).length} of ${h2s.length}`);
  add("density", "SEO", "Keyword density is between 0.5% and 1.5%", density >= 0.5 && density <= 1.5, `${density.toFixed(2)}% (${kwCount} uses in ${total} words)`);
  add("alt", "SEO", "Cover image has descriptive alt text with the keyword", p.cover.alt.length >= 30 && p.cover.alt.toLowerCase().includes(kw), p.cover.alt.slice(0, 60));
  add("cover-size", "SEO", "Cover image is 1200 x 630 (works as the social card)", p.cover.width === 1200 && p.cover.height === 630, `${p.cover.width} x ${p.cover.height}`);
  add("slug", "SEO", "Slug is short, lowercase and contains the keyword", /^[a-z0-9-]{10,70}$/.test(p.slug) && p.slug.includes(kw.replace(/\s+/g, "-")), p.slug);

  add("h2-count", "Structure", "4 to 8 H2 sections", h2Count >= 4 && h2Count <= 8, `${h2Count} (including FAQ and Related courses)`);
  add("words", "Structure", "1,200 to 2,500 words of article text (quiz excluded)", total >= 1200 && total <= 2500, `${total} words`);
  add("table", "Structure", "At least one table", tables >= 1, `${tables}`);
  add("h3", "Structure", "H3s are used for sub-points under an H2", h3s >= 1, `${h3s}`);
  add("faq", "Structure", "4 to 6 FAQs", p.faq.length >= 4 && p.faq.length <= 6, `${p.faq.length}`);
  add("faq-len", "Structure", "Each FAQ answer is 2 to 4 sentences and does not restate the question", p.faq.every((f) => sentences(f.a) >= 2 && sentences(f.a) <= 4 && !f.a.toLowerCase().startsWith(f.q.toLowerCase().split(" ").slice(0, 4).join(" "))), p.faq.map((f) => sentences(f.a)).join(", "));
  add("author", "Structure", "Author is Sachin Sharma (no invented staff)", p.author === "Sachin Sharma", p.author);
  add("cta", "Structure", "Has a call to action to the course", p.cta.href.startsWith("/") && p.cta.label.length > 3, p.cta.label);

  const relOk = p.related.length >= 4 && p.related.every((r) => (r.href.startsWith("/courses/") || r.href.startsWith("/practice-tests")) && r.label.length > 3 && r.note.length > 10);
  add("internal", "Links", "At least 3 internal links in the body with descriptive anchors", internal.length >= 3, `${internal.length}`);
  add("related", "Links", "4 or more related courses or practice tests, each an internal link with a note", relOk, `${p.related.length}`);
  add("no-outbound", "Links", "No external links (courses only for now)", outbound.length === 0, outbound.length ? outbound.map((h) => h.href).join(", ") : "none");
  add("anchor-text", "Links", "No \"click here\" or \"read more\" anchors", !/>s*(click here|read more|here)s*</i.test(p.content), "");

  add("banned", "Writing", "No stock AI phrases", banned.length === 0, banned.length ? banned.join(", ") : "none");
  add("em-dash", "Writing", "Em dashes used sparingly (2 or fewer)", emDash <= 2, `${emDash}`);
  add("rhythm", "Writing", "Paragraph lengths vary (not uniform)", cv >= 0.3 && Math.min(...paras) <= 18 && Math.max(...paras) >= 40, `variation ${cv.toFixed(2)}, shortest ${Math.min(...paras)}, longest ${Math.max(...paras)} words`);
  add("first-person-claims", "Writing", "No invented statistics presented as fact", !/\b\d{2,3}%\s+of (students|people|users)/i.test(prose), "");

  const qs = p.quiz?.questions ?? [];
  add("quiz-size", "Quiz", "Quiz has 5 or more questions (a quiz inside an article, not the whole article)", qs.length >= 5, `${qs.length}`);
  add("quiz-valid", "Quiz", "Every question has 4 options, a valid answer and an explanation", qs.every((q) => q.options.length === 4 && q.answer >= 0 && q.answer < 4 && new Set(q.options).size === 4 && q.explain.length >= 25), "");
  add("quiz-unique", "Quiz", "Questions are unique", new Set(qs.map((q) => q.q)).size === qs.length, "");
  add("quiz-spread", "Quiz", "Correct answers are spread across positions (no pattern)", qs.length === 0 || share <= 0.4, `largest share ${(share * 100).toFixed(0)}%`);
  add("quiz-marker", "Quiz", "The quiz marker is in the article body", !p.quiz || p.content.includes("<!--quiz-->"), "");

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100), passed, total: checks.length, ok: passed === checks.length, checks, stats: { words: total, keywordUses: kwCount, h2: h2Count, internalLinks: internal.length, relatedCourses: p.related.length, quizQuestions: qs.length, faqs: p.faq.length } };
}
