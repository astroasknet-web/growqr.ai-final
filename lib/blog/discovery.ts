import type { BlogPostSummary } from "./blogforge";

/**
 * Pure helpers for blog discovery: categories, pagination, search and related reading. They work on the post summaries the blog already
 * loads, so they behave the same for repository posts and engine posts, and they are easy to test.
 */
export const PAGE_SIZE = 12;

export const slugify = (s: string): string => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export interface CategoryCount { name: string; slug: string; count: number }

export function categoriesOf(posts: BlogPostSummary[]): CategoryCount[] {
  const map = new Map<string, CategoryCount>();
  for (const p of posts) {
    if (!p.category) continue;
    const slug = slugify(p.category);
    const cur = map.get(slug);
    if (cur) cur.count += 1; else map.set(slug, { name: p.category, slug, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { items: T[]; page: number; pages: number; total: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length };
}

/** A page number from a query string: only a plain positive integer counts, anything else is "not a page" (null). */
export function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return /^[1-9]\d{0,3}$/.test(v) ? Number(v) : null;
}

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "for", "with", "on", "is", "are", "how", "what", "why", "your", "you", "free"]);
export const tokens = (s: string): string[] => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));

/** Search by title, category and excerpt. Title hits count most; a post must match every word the reader typed. Capped to a sane length. */
export function searchPosts(posts: BlogPostSummary[], query: string): BlogPostSummary[] {
  const q = tokens(query.slice(0, 100));
  if (!q.length) return [];
  const scored: Array<{ p: BlogPostSummary; s: number }> = [];
  for (const p of posts) {
    const t = tokens(p.title), c = tokens(p.category ?? ""), e = tokens(p.excerpt ?? "");
    let s = 0, all = true;
    for (const w of q) {
      const hit = (arr: string[]) => arr.some((x) => x === w || x.startsWith(w));
      const v = (hit(t) ? 3 : 0) + (hit(c) ? 2 : 0) + (hit(e) ? 1 : 0);
      if (!v) { all = false; break; }
      s += v;
    }
    if (all) scored.push({ p, s });
  }
  return scored.sort((a, b) => b.s - a.s || b.p.published_at.localeCompare(a.p.published_at)).map((x) => x.p);
}

/** Related reading: same category first, then overlap of title words, newest as the tiebreak. Never includes the post itself. */
export function relatedPosts(current: Pick<BlogPostSummary, "slug" | "title" | "category">, all: BlogPostSummary[], n = 3): BlogPostSummary[] {
  const mine = new Set(tokens(current.title));
  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({ p, s: (p.category && p.category === current.category ? 5 : 0) + tokens(p.title).filter((t) => mine.has(t)).length }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.p.published_at.localeCompare(a.p.published_at))
    .slice(0, n)
    .map((x) => x.p);
}

const textOf = (h: string): string => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&[a-z#0-9]+;/gi, "").replace(/\s+/g, " ").trim();

/** Gives every h2/h3 in engine HTML a unique id (keeping any it already has) and returns the h2 list for a table of contents. */
export function withHeadingIds(html: string): { html: string; toc: Array<{ id: string; text: string }> } {
  const used = new Set<string>();
  for (const m of html.matchAll(/<h[23]\b[^>]*\sid="([^"]+)"/gi)) used.add(m[1]);
  const toc: Array<{ id: string; text: string }> = [];
  const out = html.replace(/<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag: string, attrs: string, inner: string) => {
    const text = textOf(inner);
    const has = /\sid="([^"]+)"/i.exec(attrs);
    let id = has?.[1];
    if (!id) {
      const base = slugify(text) || "section";
      id = base; let i = 2;
      while (used.has(id)) id = `${base}-${i++}`;
      used.add(id);
    }
    if (tag.toLowerCase() === "h2" && text) toc.push({ id, text });
    return has ? full : `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, toc };
}
