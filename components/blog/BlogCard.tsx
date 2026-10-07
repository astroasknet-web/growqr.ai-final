import Link from "next/link";
import type { BlogPostSummary } from "@/lib/blog/blogforge";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {post.cover_image ? (
        // Plain <img>: cover images come from the engine's own domain, which is
        // not in next.config's image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image}
          alt={post.title}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-orange/15 to-cream-2" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.category && (
          <span className="w-fit rounded-full bg-orange/10 px-3 py-1 text-[12px] font-semibold text-orange">
            {post.category}
          </span>
        )}
        <h2 className="line-clamp-2 text-[18px] font-bold leading-snug text-ink transition-colors group-hover:text-orange">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-4">{post.excerpt}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-[12px] text-ink-4">
          {post.author && <span>{post.author}</span>}
          {post.reading_minutes ? <span>· {post.reading_minutes} min read</span> : null}
          {post.published_at && <span>· {formatDate(post.published_at)}</span>}
        </div>
      </div>
    </Link>
  );
}
