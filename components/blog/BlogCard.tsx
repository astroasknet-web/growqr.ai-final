import Link from "next/link";
import type { BlogPostSummary } from "@/lib/blog/blogforge";

function formatDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * One post in a list. Cover images carry explicit dimensions (16:9 box, so no layout shift) and load lazily, except the first card on a
 * page, which can be the LCP image and is marked high priority instead. The thumbnail has empty alt on purpose: the title link beside it
 * already says what the post is, and repeating it would make screen readers read every title twice.
 */
export default function BlogCard({ post, priority = false }: { post: BlogPostSummary; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
      {post.cover_image ? (
        // Plain <img>: cover images come from the engine's own domain, which is not in next.config's image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image}
          alt=""
          width={1200}
          height={675}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="aspect-[16/9] w-full bg-gradient-to-br from-orange/15 to-cream-2" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.category && (
          <span className="w-fit rounded-full bg-orange/10 px-3 py-1 text-[12px] font-semibold text-orange-deep">{post.category}</span>
        )}
        <h2 className="line-clamp-3 text-[18px] font-bold leading-snug text-ink">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="line-clamp-3 text-[14.5px] leading-relaxed text-ink-3">{post.excerpt}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-[12.5px] text-ink-3">
          {post.author && <span>{post.author}</span>}
          {post.reading_minutes ? <span>&middot; {post.reading_minutes} min read</span> : null}
          {post.published_at && <span>&middot; <time dateTime={post.published_at.replace(" ", "T") + (post.published_at.includes("T") ? "" : "Z")}>{formatDate(post.published_at)}</time></span>}
        </p>
      </div>
    </article>
  );
}
