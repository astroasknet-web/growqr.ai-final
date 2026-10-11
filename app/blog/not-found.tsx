import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { categoriesOf } from "@/lib/blog/discovery";

/** A missing blog page keeps the reader in the blog: search, topics and the latest articles, with no technical detail shown. */
export default async function BlogNotFound() {
  const all = await listBlogPosts({ limit: 1000 });
  const cats = categoriesOf(all);
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-14 pt-32 sm:px-6 sm:pb-20 md:pt-40">
        <p className="text-[13px] font-bold uppercase tracking-wide text-ink-3">404</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight text-ink sm:text-[40px]">We couldn&rsquo;t find that article</h1>
        <p className="mt-3 text-[17px] text-ink-2">It may have moved or been renamed. Search the blog, or pick up from one of these.</p>
        <div className="mt-6 max-w-xl"><BlogSearchForm id="nf-q" /></div>
        {cats.length ? <ul className="mt-6 flex flex-wrap gap-2">{cats.map((c) => <li key={c.slug}><Link href={`/blog/topic/${c.slug}`} className="inline-flex min-h-[44px] items-center rounded-full border border-black/[0.15] bg-white px-4 text-[14px] font-semibold text-ink hover:bg-cream-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">{c.name}</Link></li>)}</ul> : null}
        {all.length ? <><h2 className="mt-10 text-[20px] font-bold text-ink">Latest articles</h2><ul className="mt-3 space-y-2">{all.slice(0, 5).map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`} className="font-semibold text-ink underline underline-offset-2 hover:text-orange-deep">{p.title}</Link></li>)}</ul></> : null}
        <p className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[15px]"><Link href="/blog" className="font-semibold text-ink underline">Blog home</Link><Link href="/courses" className="font-semibold text-ink underline">Courses</Link><Link href="/" className="font-semibold text-ink underline">Home</Link></p>
      </div>
    </PageShell>
  );
}
