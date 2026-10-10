import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BlogAnalytics from "@/components/blog/BlogAnalytics";
import { getBlogPost, listBlogSlugs } from "@/lib/blog/blogforge";
import { OG_IMAGE } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { cleanHtml } from "@/lib/market/lessons";
import { postJsonLd, postUrl, relatedLearning } from "@/lib/blog/seo";

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

  const jsonLd = serializeJsonLd(postJsonLd(post));
  const learn = relatedLearning(post);

  return (
    <PageShell>
      <BlogAnalytics />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16 md:px-8">
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
            {post.author && <span>{post.author}</span>}
            {post.reading_minutes ? <span>· {post.reading_minutes} min read</span> : null}
            {post.published_at && <span>· {formatDate(post.published_at)}</span>}
            {post.updated_at && formatDate(post.updated_at) !== formatDate(post.published_at) ? <span>· Updated {formatDate(post.updated_at)}</span> : null}
          </div>
        </header>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            className="mb-8 w-full rounded-2xl border border-black/[0.06] object-cover"
          />
        )}

        {/* The engine sanitizes before serving; cleanHtml is a second, independent pass in case the engine is ever misconfigured. */}
        <div className="bf-article" dangerouslySetInnerHTML={{ __html: cleanHtml(post.content) }} />

        <aside aria-labelledby="learn-h" className="mt-12 rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm">
          <h2 id="learn-h" className="text-[18px] font-bold text-ink">Keep learning on GrowQR</h2>
          <ul className="mt-3 space-y-2">
            {learn.map((l) => (
              <li key={l.href}><Link href={l.href} className="font-semibold text-ink underline underline-offset-2 hover:text-orange">{l.label}</Link><span className="text-ink-3"> · {l.why}</span></li>
            ))}
          </ul>
        </aside>
      </article>

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
