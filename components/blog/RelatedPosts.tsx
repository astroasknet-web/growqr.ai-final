import Link from "next/link";
import type { BlogPostSummary } from "@/lib/blog/blogforge";

/** "Keep reading": up to three posts chosen by topic overlap (see relatedPosts). Plain crawlable links with descriptive anchors. */
export default function RelatedPosts({ posts }: { posts: BlogPostSummary[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="related-posts-h" className="mt-12">
      <h2 id="related-posts-h" className="text-[22px] font-bold text-ink">Keep reading</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug} className="rounded-xl border border-black/[0.09] bg-white p-4">
            {p.category ? <p className="text-[12px] font-semibold text-orange-deep">{p.category}</p> : null}
            <Link href={`/blog/${p.slug}`} className="mt-1 block text-[16px] font-semibold leading-snug text-ink underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">{p.title}</Link>
            {p.reading_minutes ? <p className="mt-1 text-[13px] text-ink-3">{p.reading_minutes} min read</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
