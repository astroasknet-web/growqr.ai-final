import { SITE_URL } from "@/lib/seo";

/**
 * Share links for a blog post, built only from the post's own title, description and canonical URL.
 * Plain documented endpoints, no SDKs and no tracking parameters: the URL a reader shares is the canonical article URL, so sharing never
 * creates a second indexable address. Each endpoint gets its own encoding; platforms that cannot take a field simply do not get it.
 */
export type ShareId = "whatsapp" | "facebook" | "x" | "linkedin" | "telegram" | "pinterest" | "reddit" | "email";
export interface ShareInput { title: string; url: string; description?: string; image?: string | null; hashtag?: string }
export interface ShareLink { id: ShareId; label: string; href: string; event: string }

const enc = encodeURIComponent;

/** The canonical URL must be https on our own host, with no query or fragment. Throws so a bad value is caught in tests, never shared. */
export function assertCanonical(url: string): string {
  const u = new URL(url);
  const host = new URL(SITE_URL).host;
  if (u.protocol !== "https:" || u.host !== host || u.search || u.hash) throw new Error(`Not a canonical article URL: ${url}`);
  return u.toString();
}

const clean = (s: string): string => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
const hashtagOf = (h?: string): string => (h ? h.replace(/[^A-Za-z0-9_]/g, "") : "");

export function shareLinks(input: ShareInput): ShareLink[] {
  const url = assertCanonical(input.url);
  const title = clean(input.title);
  const desc = input.description ? clean(input.description) : "";
  const tag = hashtagOf(input.hashtag);
  const image = input.image && /^https:\/\//i.test(input.image) ? input.image : null;
  const links: ShareLink[] = [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}`, event: "share_whatsapp" },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, event: "share_facebook" },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}${tag ? `&hashtags=${enc(tag)}` : ""}`, event: "share_x" },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, event: "share_linkedin" },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`, event: "share_telegram" },
  ];
  if (image) links.push({ id: "pinterest", label: "Pinterest", href: `https://www.pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(desc || title)}`, event: "share_pinterest" });
  links.push(
    { id: "reddit", label: "Reddit", href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`, event: "share_reddit" },
    { id: "email", label: "Email", href: `mailto:?subject=${enc(title)}&body=${enc(`${desc ? desc + "\n\n" : ""}${url}`)}`, event: "share_email" },
  );
  return links;
}
