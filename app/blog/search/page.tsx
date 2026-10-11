import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { categoriesOf, searchPosts } from "@/lib/blog/discovery";
import { EXPLORE } from "@/lib/blog/explore";
import { canonicalUrl } from "@/lib/seo";

/**
 * Internal search results are never indexed: they are infinite near-duplicate URLs with no value of their own. The canonical points at the
 * blog home as a second signal, and the page is not in the sitemap. The query is rendered as escaped text only.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search the blog | GrowQR", robots: { index: false, follow: true }, alternates: { canonical: canonicalUrl("/blog") } };
}

export default async function BlogSearchRoute({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 100);
  const all = await listBlogPosts({ limit: 1000 });
  const results = q ? searchPosts(all, q) : [];
  const cats = categoriesOf(all);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-32 sm:px-6 sm:pb-14 md:pt-40 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / <span aria-current="page">Search</span></nav>
        <h1 className="text-[30px] font-bold leading-tight text-ink sm:text-[38px]">Search the blog</h1>
        <div className="mt-6 max-w-xl"><BlogSearchForm defaultValue={q} id="blog-q-results" /></div>

        {q ? (
          <p role="status" className="mt-8 text-[15px] text-ink-2">
            {results.length ? `${results.length} ${results.length === 1 ? "result" : "results"} for` : "No results for"} <b>&ldquo;{q}&rdquo;</b>
          </p>
        ) : <p className="mt-8 text-[15px] text-ink-3">Type a topic, such as &ldquo;excel&rdquo; or &ldquo;passwords&rdquo;.</p>}

        {results.length ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{results.map((p) => <BlogCard key={p.slug} post={p} />)}</div>
        ) : q ? (
          <div className="mt-6 max-w-2xl">
            <p className="text-[16px] leading-relaxed text-ink-2">Try fewer or simpler words, or pick a topic below.</p>
            {cats.length ? <ul className="mt-4 flex flex-wrap gap-2">{cats.map((c) => <li key={c.slug}><Link href={`/blog?category=${c.slug}`} className="inline-flex min-h-[44px] items-center rounded-full border border-black/[0.15] bg-white px-4 text-[14px] font-semibold text-ink hover:bg-cream-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">{c.name}</Link></li>)}</ul> : null}
            {all.length ? <><h2 className="mt-8 text-[18px] font-bold text-ink">Latest articles</h2><ul className="mt-3 space-y-2">{all.slice(0, 5).map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`} className="font-semibold text-ink underline underline-offset-2 hover:text-orange-deep">{p.title}</Link></li>)}</ul></> : null}
            <h2 className="mt-8 text-[18px] font-bold text-ink">Or learn on GrowQR</h2>
            <ul className="mt-3 flex flex-wrap gap-2">{EXPLORE.slice(0, 4).map((e) => <li key={e.href}><Link href={e.href} className="inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] bg-white px-4 text-[14px] font-semibold text-ink hover:bg-cream-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">{e.label}</Link></li>)}</ul>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
