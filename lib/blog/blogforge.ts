import "server-only";

// Headless client for the BlogForge Engine (the independent Node/MySQL blog +
// SEO engine). GrowQR renders the blog in its own Next.js templates by fetching
// posts as JSON from the engine's REST API. See docs/INTEGRATION.md in the
// engine repo (D:\BLOG DASHBOAD WITH SEO ANALYTICS).
//
// Graceful demo mode: when BLOGFORGE_API_URL / BLOGFORGE_API_KEY are unset (e.g.
// a preview deployment before the engine is wired), every call returns empty so
// the blog pages show a "coming soon" state instead of crashing. Setting the two
// env vars lights it up — no code change.

export interface BlogMeta {
  title: string | null;
  description: string | null;
  canonical: string | null;
  og_image: string | null;
  noindex: boolean;
}

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  author: string | null;
  reading_minutes: number | null;
  url: string;
  published_at: string;
  updated_at?: string | null;
  meta?: BlogMeta;
}

export interface BlogPost extends BlogPostSummary {
  content: string; // sanitized HTML, ready to render (engine sanitizes server-side)
  json_ld: string; // a full <script type="application/ld+json"> block
  meta: BlogMeta;
}

/** True when the engine's API is configured. Read paths degrade to empty otherwise. */
export function isBlogConfigured(): boolean {
  return Boolean(process.env.BLOGFORGE_API_URL && process.env.BLOGFORGE_API_KEY);
}

function baseUrl(): string {
  return (process.env.BLOGFORGE_API_URL || "").replace(/\/+$/, "");
}

async function req<T>(path: string): Promise<T | null> {
  if (!isBlogConfigured()) return null;
  try {
    const res = await fetch(baseUrl() + path, {
      headers: { "X-API-Key": process.env.BLOGFORGE_API_KEY as string },
      // Revalidate periodically so new/edited posts appear without a redeploy.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Never let a blog-engine outage take a page down.
    return null;
  }
}

export async function listBlogPosts(
  opts: { category?: string; limit?: number; offset?: number } = {},
): Promise<BlogPostSummary[]> {
  const q = new URLSearchParams();
  if (opts.category) q.set("category", opts.category);
  if (opts.limit != null) q.set("limit", String(opts.limit));
  if (opts.offset != null) q.set("offset", String(opts.offset));
  const data = await req<{ posts: BlogPostSummary[] }>(
    "/api/posts" + (q.toString() ? "?" + q.toString() : ""),
  );
  return data?.posts ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const data = await req<{ post: BlogPost }>("/api/posts/" + encodeURIComponent(slug));
  return data?.post ?? null;
}

export async function listBlogSlugs(): Promise<string[]> {
  const posts = await listBlogPosts({ limit: 1000 });
  return posts.map((p) => p.slug);
}
