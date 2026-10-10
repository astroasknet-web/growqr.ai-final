import { listBlogPosts } from "@/lib/blog/blogforge";
import { postUrl } from "@/lib/blog/seo";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 900;

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (s: string | null | undefined): string => {
  const d = s ? new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z") : new Date(NaN);
  return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
};

/** RSS feed of the latest posts, for readers and aggregators. Empty (but valid) when the blog engine is not configured. */
export async function GET(): Promise<Response> {
  const posts = (await listBlogPosts({ limit: 50 })).filter((p) => !p.meta?.noindex);
  const items = posts
    .map((p) => `<item><title>${esc(p.title)}</title><link>${esc(postUrl(p.slug))}</link><guid isPermaLink="true">${esc(postUrl(p.slug))}</guid>${rfc822(p.published_at) ? `<pubDate>${rfc822(p.published_at)}</pubDate>` : ""}${p.excerpt ? `<description>${esc(p.excerpt)}</description>` : ""}${p.category ? `<category>${esc(p.category)}</category>` : ""}</item>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>GrowQR Blog</title><link>${SITE_URL}/blog</link><description>Guides and updates on skills, hiring and the RQ-Score.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900" } });
}
