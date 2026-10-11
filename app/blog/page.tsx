import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import BlogCard from "@/components/blog/BlogCard";
import BlogAnalytics from "@/components/blog/BlogAnalytics";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { categoriesOf, paginate, parsePage, PAGE_SIZE } from "@/lib/blog/discovery";
import { EXPLORE } from "@/lib/blog/explore";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { indexJsonLd } from "@/lib/blog/seo";

export const revalidate = 300;

type Search = Promise<{ page?: string | string[]; category?: string | string[] }>;

const TITLE = "GrowQR Blog: Learning Guides, Quizzes and Study Help";
const DESCRIPTION = "Free learning guides, practice quizzes and study help on digital skills, exams and careers, written for students. Search the GrowQR blog.";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

const pageHref = (n: number): string => (n <= 1 ? "/blog" : `/blog?page=${n}`);

/**
 * Indexation policy for the blog home:
 *  - /blog and /blog?page=N are indexable archive pages, each with its own canonical (page 1 is /blog).
 *  - ?category= filters are a view of the same posts, so they are noindex and canonical to /blog until real category pages exist.
 *  - an empty blog (engine not set up yet) stays out of the index.
 */
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page) ?? 1;
  const filtered = sp.category !== undefined;
  const has = (await listBlogPosts({ limit: 1 })).length > 0;
  const title = page > 1 ? `GrowQR Blog: Guides and Study Help, Page ${page}` : TITLE;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: filtered ? canonicalUrl("/blog") : canonicalUrl(pageHref(page)), types: { "application/rss+xml": canonicalUrl("/blog/rss.xml") } },
    robots: has && !filtered ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description: DESCRIPTION, url: filtered ? canonicalUrl("/blog") : canonicalUrl(pageHref(page)), images: [OG_IMAGE], type: "website" },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION, images: [OG_IMAGE.url] },
  };
}

export default async function BlogIndexRoute({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const pageNo = parsePage(sp.page);
  if (pageNo === null) notFound();

  const all = await listBlogPosts({ limit: 1000 });
  const cats = categoriesOf(all);
  const catSlug = typeof sp.category === "string" ? sp.category : undefined;
  const activeCat = catSlug ? cats.find((c) => c.slug === catSlug) : undefined;
  const pool = activeCat ? all.filter((p) => p.category === activeCat.name) : all;

  const showFeatured = !activeCat && pageNo === 1 && pool.length > 3;
  const rest = showFeatured ? pool.slice(1) : pool;
  const pg = paginate(rest, pageNo, PAGE_SIZE);
  if (pageNo > pg.pages) notFound();
  const featured = showFeatured ? pool[0] : null;

  return (
    <PageShell>
      <BlogAnalytics />
      {all.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(indexJsonLd(pg.items)) }} /> : null}
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <span aria-current="page">Blog</span></nav>

        <header className="max-w-3xl">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]">Learning guides, quizzes and study help</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
            Practical articles on digital skills, exam preparation and careers. Most come with a quiz or a worked example, and link to the free course where you can practise the skill.
          </p>
        </header>
        <div className="mt-7 max-w-xl"><BlogSearchForm /></div>

        {all.length === 0 ? (
          <div className="mt-12 max-w-md rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm">
            <h2 className="text-[20px] font-bold text-ink">Coming soon</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3">Our first articles are on the way. In the meantime, browse the <Link href="/courses" className="font-semibold underline">free courses</Link>.</p>
          </div>
        ) : (
          <>
            {cats.length > 1 ? (
              <nav aria-label="Blog topics" className="mt-8">
                <ul className="flex flex-wrap gap-2">
                  <li><Link href="/blog" aria-current={!activeCat ? "true" : undefined} className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-[14px] font-semibold ${!activeCat ? "border-ink bg-ink text-white" : "border-black/[0.15] bg-white text-ink hover:bg-cream-2"} ${focus}`}>All topics</Link></li>
                  {cats.map((c) => (
                    <li key={c.slug}><Link href={`/blog?category=${c.slug}`} aria-current={activeCat?.slug === c.slug ? "true" : undefined} className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-[14px] font-semibold ${activeCat?.slug === c.slug ? "border-ink bg-ink text-white" : "border-black/[0.15] bg-white text-ink hover:bg-cream-2"} ${focus}`}>{c.name} <span className="ml-1.5 text-[12px] opacity-70">{c.count}</span></Link></li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {featured ? (
              <section aria-labelledby="featured-h" className="mt-10">
                <h2 id="featured-h" className="mb-4 text-[13px] font-bold uppercase tracking-wide text-ink-3">Featured</h2>
                <div className="relative grid overflow-hidden rounded-3xl border border-black/[0.09] bg-white shadow-sm md:grid-cols-2">
                  {featured.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.cover_image} alt="" width={1200} height={630} fetchPriority="high" decoding="async" className="aspect-[1200/630] h-full w-full object-cover" />
                  ) : <div aria-hidden="true" className="aspect-[1200/630] bg-gradient-to-br from-orange/15 to-cream-2" />}
                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                    {featured.category ? <span className="w-fit rounded-full bg-orange/10 px-3 py-1 text-[12px] font-semibold text-orange-deep">{featured.category}</span> : null}
                    <h3 className="text-[24px] font-bold leading-snug text-ink sm:text-[28px]">
                      <Link href={`/blog/${featured.slug}`} className={`after:absolute after:inset-0 after:content-[''] hover:text-orange-deep ${focus}`}>{featured.title}</Link>
                    </h3>
                    {featured.excerpt ? <p className="text-[16px] leading-relaxed text-ink-2">{featured.excerpt}</p> : null}
                    <p className="text-[13px] text-ink-3">{featured.author}{featured.reading_minutes ? ` · ${featured.reading_minutes} min read` : ""}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="latest-h" className="mt-10">
              <h2 id="latest-h" className="mb-4 text-[22px] font-bold text-ink">{activeCat ? activeCat.name : pageNo > 1 ? `All articles, page ${pg.page}` : "Latest articles"}</h2>
              {activeCat ? <p className="mb-4 text-[14px] text-ink-3" role="status">{pool.length} {pool.length === 1 ? "article" : "articles"} in {activeCat.name}. <Link href="/blog" className="font-semibold underline">Clear filter</Link></p> : null}
              {pg.items.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pg.items.map((post, i) => <BlogCard key={post.slug} post={post} priority={!featured && pageNo === 1 && i === 0} />)}
                </div>
              ) : <p className="text-[15px] text-ink-3">No articles in this topic yet.</p>}
            </section>

            {pg.pages > 1 && !activeCat ? (
              <nav aria-label="Blog pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                {pg.page > 1 ? <Link href={pageHref(pg.page - 1)} rel="prev" className={`inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] bg-white px-4 text-[14px] font-semibold ${focus}`}>Previous</Link> : null}
                {Array.from({ length: pg.pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={pageHref(n)} aria-label={`Page ${n}`} aria-current={n === pg.page ? "page" : undefined} className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 text-[14px] font-semibold ${n === pg.page ? "border-ink bg-ink text-white" : "border-black/[0.15] bg-white text-ink hover:bg-cream-2"} ${focus}`}>{n}</Link>
                ))}
                {pg.page < pg.pages ? <Link href={pageHref(pg.page + 1)} rel="next" className={`inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] bg-white px-4 text-[14px] font-semibold ${focus}`}>Next</Link> : null}
              </nav>
            ) : null}
          </>
        )}

        <section aria-labelledby="explore-h" className="mt-16 rounded-3xl bg-cream-2 p-6 sm:p-8">
          <h2 id="explore-h" className="text-[22px] font-bold text-ink">Learn on GrowQR</h2>
          <p className="mt-1 text-[15px] text-ink-3">Turn what you read into practice.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORE.map((e) => (
              <li key={e.href}><Link href={e.href} className={`block rounded-xl border border-black/[0.09] bg-white p-4 hover:border-orange-deep ${focus}`}><span className="block text-[16px] font-semibold text-ink">{e.label}</span><span className="block text-[13.5px] text-ink-3">{e.note}</span></Link></li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
