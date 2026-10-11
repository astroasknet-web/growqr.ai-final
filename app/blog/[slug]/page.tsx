import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BlogAnalytics from "@/components/blog/BlogAnalytics";
import { getBlogPost, listBlogPosts, listBlogSlugs } from "@/lib/blog/blogforge";
import { authorFor } from "@/lib/blog/authors";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { relatedPosts, withHeadingIds } from "@/lib/blog/discovery";
import { EXPLORE } from "@/lib/blog/explore";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { cleanHtml } from "@/lib/market/lessons";
import { postJsonLd, postUrl, relatedLearning } from "@/lib/blog/seo";
import { isLocal } from "@/lib/blog/local";
import ShareBar from "@/components/blog/ShareBar";
import StandardPost from "@/components/blog/StandardPost";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  // Empty in demo mode (unconfigured); pages render on-demand once configured.
  const slugs = await listBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  const m = post.meta;
  const url = postUrl(post.slug); // always GrowQR's own URL, whatever base URL the engine is configured with
  const ogImg = m.og_image ?? post.cover_image ?? undefined;
  if (isLocal(post)) {
    const c = post.extras.cover;
    return {
      title: { absolute: post.extras.seoTitle },
      description: m.description ?? undefined,
      keywords: post.extras.keywords,
      authors: [{ name: post.author ?? "GrowQR" }],
      alternates: { canonical: url },
      openGraph: { title: post.extras.seoTitle, description: m.description ?? undefined, url, type: "article", publishedTime: post.published_at, modifiedTime: post.updated_at ?? undefined, authors: [post.author ?? "GrowQR"], section: post.category ?? undefined, images: [{ url: c.src.startsWith("/") ? `${SITE_URL}${c.src}` : c.src, width: c.width, height: c.height, alt: c.alt }] },
      twitter: { card: "summary_large_image", title: post.extras.seoTitle, description: m.description ?? undefined, images: [{ url: c.src.startsWith("/") ? `${SITE_URL}${c.src}` : c.src, alt: c.alt }] },
    };
  }
  return {
    title: m.title ?? `${post.title} | GrowQR`,
    description: m.description ?? post.excerpt ?? undefined,
    alternates: { canonical: url },
    robots: m.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: m.title ?? post.title,
      description: m.description ?? post.excerpt ?? undefined,
      url,
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      images: ogImg ? [{ url: ogImg }] : [OG_IMAGE],
    },
  };
}

export default async function BlogPostRoute({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const more = relatedPosts(post, await listBlogPosts({ limit: 1000 }), 3);
  if (isLocal(post)) return <StandardPost post={post} more={more} />;

  const jsonLd = serializeJsonLd(postJsonLd(post));
  const learn = relatedLearning(post);
  const body = withHeadingIds(cleanHtml(post.content));
  const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

  return (
    <PageShell>
      <BlogAnalytics />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-32 sm:px-6 sm:pb-12 md:pt-40 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:px-10 xl:gap-16">
      <article id="post-article" className="min-w-0">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-4 transition-colors hover:text-orange"
        >
          ← Back to blog
        </Link>

        <header className="mb-8">
          {post.category && (
            <span className="mb-4 inline-block rounded-full bg-orange/10 px-3 py-1 text-[12px] font-semibold text-orange">
              {post.category}
            </span>
          )}
          <h1 className="text-[30px] font-bold leading-tight text-ink sm:text-[38px]">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-4">
            {post.author && (authorFor(post.author) ? <Link href={`/blog/author/${authorFor(post.author)!.slug}`} rel="author" className="underline underline-offset-2">{post.author}</Link> : <span>{post.author}</span>)}
            {post.reading_minutes ? <span>· {post.reading_minutes} min read</span> : null}
            {post.published_at && <span>· {formatDate(post.published_at)}</span>}
            {post.updated_at && formatDate(post.updated_at) !== formatDate(post.published_at) ? <span>· Updated {formatDate(post.updated_at)}</span> : null}
          </div>
        </header>

        <ShareBar placement="top" title={post.title} url={postUrl(post.slug)} description={post.excerpt ?? undefined} image={post.cover_image ? (post.cover_image.startsWith("/") ? `${SITE_URL}${post.cover_image}` : post.cover_image) : null} hashtag={post.category ?? undefined} articleId={post.slug} category={post.category ?? undefined} />

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            width={1200}
            height={630}
            fetchPriority="high"
            decoding="async"
            className="mb-8 aspect-[1200/630] w-full rounded-2xl border border-black/[0.06] object-cover"
          />
        )}

        {/* The engine sanitizes before serving; cleanHtml is a second, independent pass in case the engine is ever misconfigured. */}
        <div className="bf-article" dangerouslySetInnerHTML={{ __html: body.html }} />

        <div className="mt-10"><ShareBar placement="end" title={post.title} url={postUrl(post.slug)} description={post.excerpt ?? undefined} image={post.cover_image ? (post.cover_image.startsWith("/") ? `${SITE_URL}${post.cover_image}` : post.cover_image) : null} hashtag={post.category ?? undefined} articleId={post.slug} category={post.category ?? undefined} /></div>

        <aside aria-labelledby="learn-h" className="mt-12 rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm">
          <h2 id="learn-h" className="text-[18px] font-bold text-ink">Keep learning on GrowQR</h2>
          <ul className="mt-3 space-y-2">
            {learn.map((l) => (
              <li key={l.href}><Link href={l.href} className="font-semibold text-ink underline underline-offset-2 hover:text-orange">{l.label}</Link><span className="text-ink-3"> · {l.why}</span></li>
            ))}
          </ul>
        </aside>

        <RelatedPosts posts={more} />
      </article>

      <aside aria-label="Explore GrowQR" className="mt-12 space-y-5 lg:mt-0 lg:self-stretch">
        <div className="space-y-5 lg:sticky lg:top-28">
          {body.toc.length > 1 ? (
            <nav aria-labelledby="toc-h" className="rounded-2xl border border-black/[0.09] bg-white p-5">
              <p id="toc-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">In this article</p>
              <ol className="mt-3 space-y-1.5 border-l border-black/[0.1] text-[14.5px]">
                {body.toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className={`-ml-px block border-l-2 border-transparent py-0.5 pl-3 text-ink-2 hover:border-orange-deep hover:text-ink ${focus}`}>{t.text}</a></li>)}
              </ol>
            </nav>
          ) : null}
          <nav aria-labelledby="explore-h" className="rounded-2xl border border-black/[0.09] bg-white p-5">
            <p id="explore-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">Explore the portal</p>
            <ul className="mt-3 divide-y divide-black/[0.07]">
              {EXPLORE.map((e) => <li key={e.href}><Link href={e.href} className={`block rounded-md py-2.5 hover:bg-cream-2 ${focus}`}><span className="block text-[15px] font-semibold text-ink">{e.label}</span><span className="block text-[13px] leading-snug text-ink-3">{e.note}</span></Link></li>)}
            </ul>
          </nav>
        </div>
      </aside>
      </div>

      <style>{`
        .bf-article { color: var(--bf-ink, #1f2430); font-size: 17px; line-height: 1.75; }
        .bf-article > * + * { margin-top: 1.15rem; }
        .bf-article h2 { font-size: 24px; font-weight: 700; line-height: 1.3; margin-top: 2.2rem; }
        .bf-article h3 { font-size: 20px; font-weight: 700; line-height: 1.35; margin-top: 1.8rem; }
        .bf-article p { color: #4b5563; }
        .bf-article a { color: #ff6a2f; text-decoration: underline; text-underline-offset: 2px; }
        .bf-article ul, .bf-article ol { padding-left: 1.4rem; color: #4b5563; }
        .bf-article ul { list-style: disc; }
        .bf-article ol { list-style: decimal; }
        .bf-article li + li { margin-top: 0.4rem; }
        .bf-article img { border-radius: 12px; max-width: 100%; height: auto; }
        .bf-article blockquote { border-left: 3px solid #ff6a2f; padding-left: 1rem; color: #6b7280; font-style: italic; }
        .bf-article pre { background: #0f1420; color: #e5e7eb; padding: 1rem; border-radius: 12px; overflow-x: auto; font-size: 14px; }
        .bf-article code { background: rgba(0,0,0,0.05); padding: 0.15em 0.4em; border-radius: 6px; font-size: 0.9em; }
        .bf-article pre code { background: none; padding: 0; }
        .bf-article h1 { font-size: 28px; font-weight: 700; }
      `}</style>
    </PageShell>
  );
}
