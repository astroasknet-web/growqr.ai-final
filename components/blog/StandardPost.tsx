import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BlogQuiz from "@/components/blog/BlogQuiz";
import ShareBar from "@/components/blog/ShareBar";
import { postUrl } from "@/lib/blog/seo";
import { slugify } from "@/lib/blog/discovery";
import { authorFor } from "@/lib/blog/authors";
import { SITE_URL } from "@/lib/seo";
import { ReadingProgress } from "@/components/blog/PostRail";
import type { LocalBlogPost } from "@/lib/blog/local";
import type { BlogPostSummary } from "@/lib/blog/blogforge";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { cleanHtml } from "@/lib/market/lessons";
import { serializeJsonLd } from "@/lib/json-ld";
import { postJsonLd } from "@/lib/blog/seo";

/**
 * The house layout for an educational post: byline and breadcrumb, a cover image that is also the social card, an "In this article"
 * list, the body with the interactive quiz where the post puts it, FAQs, a call to action and the sources. See BLOG-STANDARD.md.
 */
const fmt = (iso: string): string => {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
const EXPLORE = [
  { href: "/courses", label: "All courses", note: "Browse every course and learning path." },
  { href: "/practice-tests", label: "Practice tests", note: "Timed tests with instant scoring." },
  { href: "/resume-score", label: "Free resume score", note: "See how your resume reads to a recruiter." },
  { href: "/internships", label: "Internships", note: "Verified opportunities for students." },
  { href: "/ai-interviewer", label: "AI interview practice", note: "Rehearse answers and get feedback." },
  { href: "/community", label: "Community", note: "Ask questions and learn with peers." },
];
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

export default function StandardPost({ post, more = [] }: { post: LocalBlogPost; more?: BlogPostSummary[] }) {
  const x = post.extras;
  const [before, after] = post.content.split("<!--quiz-->");
  const h2s = [...post.content.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") }));
  const toc = [...h2s, { id: "faq", text: "Frequently asked questions" }, { id: "related", text: "Related courses" }];
  const updated = post.updated_at && fmt(post.updated_at) !== fmt(post.published_at) ? fmt(post.updated_at) : null;

  return (
    <PageShell>
      <ReadingProgress targetId="post-article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(postJsonLd(post, x)) }} />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-32 sm:px-6 sm:pb-12 md:pt-40 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:px-10 xl:gap-16">
      <article id="post-article" className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / {post.category ? <Link href={`/blog/topic/${slugify(post.category)}`} className="underline">{post.category}</Link> : null}</nav>
        <header>
          {post.category ? <Link href={`/blog/topic/${slugify(post.category)}`} className="mb-4 inline-block rounded-full bg-orange/10 px-3 py-1 text-[12px] font-semibold text-orange-deep hover:bg-orange/20">{post.category}</Link> : null}
          <h1 className="text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[40px]">{post.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 text-[14px] text-ink-3">
            <span>By {authorFor(post.author) ? <Link href={`/blog/author/${authorFor(post.author)!.slug}`} rel="author" className="font-bold text-ink-2 underline underline-offset-2">{post.author}</Link> : <b className="text-ink-2">{post.author}</b>}</span><span aria-hidden="true">&middot;</span>
            <time dateTime={post.published_at.replace(" ", "T") + "Z"}>{fmt(post.published_at)}</time>
            {updated ? <><span aria-hidden="true">&middot;</span><span>Updated {updated}</span></> : null}
            <span aria-hidden="true">&middot;</span><span>{post.reading_minutes} min read</span>
            {x.reviewedBy ? <><span aria-hidden="true">&middot;</span><span>Reviewed by {x.reviewedBy.name}</span></> : null}
          </p>
        </header>

        <ShareBar placement="top" title={post.title} url={postUrl(post.slug)} description={post.excerpt ?? undefined} image={x.cover.src.startsWith("/") ? `${SITE_URL}${x.cover.src}` : x.cover.src} hashtag={post.category ?? undefined} articleId={post.slug} category={post.category ?? undefined} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={x.cover.src} alt={x.cover.alt} width={x.cover.width} height={x.cover.height} fetchPriority="high" decoding="async" className="mt-6 h-auto w-full rounded-2xl border border-black/[0.08]" />

        <nav aria-labelledby="toc-h" className="mt-8 rounded-2xl lg:hidden border border-black/[0.09] bg-cream-2 p-5">
          <p id="toc-h" className="text-[15px] font-bold uppercase tracking-wide text-ink-3">In this article</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-ink-2">
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className={`underline-offset-2 hover:underline ${focus}`}>{t.text}</a></li>)}
          </ol>
        </nav>

        <div className="bf-article mt-8" dangerouslySetInnerHTML={{ __html: cleanHtml(before) }} />
        {x.quiz ? <BlogQuiz quiz={x.quiz} /> : null}
        {after ? <div className="bf-article" dangerouslySetInnerHTML={{ __html: cleanHtml(after) }} /> : null}

        <div className="mt-12"><ShareBar placement="end" title={post.title} url={postUrl(post.slug)} description={post.excerpt ?? undefined} image={x.cover.src.startsWith("/") ? `${SITE_URL}${x.cover.src}` : x.cover.src} hashtag={post.category ?? undefined} articleId={post.slug} category={post.category ?? undefined} /></div>

        <section id="faq" aria-labelledby="faq-h" className="mt-12" style={{ scrollMarginTop: 110 }}>
          <h2 id="faq-h" className="text-[26px] font-bold text-ink">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-black/[0.08] rounded-2xl border border-black/[0.09] bg-white">
            {x.faq.map((f) => (
              <details key={f.q} className="p-4 sm:p-5"><summary className={`cursor-pointer text-[16px] font-semibold text-ink ${focus}`}>{f.q}</summary><p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{f.a}</p></details>
            ))}
          </div>
        </section>

        <aside aria-labelledby="cta-h" className="mt-12 rounded-3xl bg-gradient-to-br from-orange-light to-[#fff3ea] p-6 text-center sm:p-8">
          <p id="cta-h" className="text-[24px] font-bold leading-snug text-ink">{x.cta.title}</p>
          <p className="mx-auto mt-2 max-w-xl text-[15.5px] text-ink-2">{x.cta.text}</p>
          <Link href={x.cta.href} className={`mt-5 inline-flex min-h-[52px] items-center rounded-xl bg-orange-deep px-7 text-[16px] font-semibold text-white hover:bg-ink ${focus}`}>{x.cta.label}</Link>
        </aside>

        <section id="related" aria-labelledby="src-h" className="mt-12" style={{ scrollMarginTop: 110 }}>
          <h2 id="src-h" className="text-[22px] font-bold text-ink">Related courses</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {x.related.map((s) => <li key={s.href} className="rounded-xl border border-black/[0.09] bg-white p-4"><Link href={s.href} className={`text-[16px] font-semibold text-ink underline underline-offset-2 hover:text-orange-deep ${focus}`}>{s.label}</Link><p className="mt-1 text-[14px] leading-snug text-ink-3">{s.note}</p></li>)}
          </ul>
        </section>
        <RelatedPosts posts={more} />
        <p className="mt-8 text-[14px] text-ink-3">How we write and correct articles: <Link href="/editorial-policy" className="font-semibold text-ink underline">editorial policy</Link>.</p>
        <p className="mt-4"><Link href="/blog" className={`text-[14px] font-semibold text-ink underline ${focus}`}>&larr; Back to the blog</Link></p>
      </article>

      <aside aria-label="Explore this article" className="mt-12 space-y-5 lg:sticky lg:top-28 lg:mt-0 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
        <nav aria-labelledby="stoc-h" className="hidden rounded-2xl border border-black/[0.09] bg-white p-5 lg:block">
          <p id="stoc-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">On this page</p>
          <ol className="mt-3 space-y-1.5 border-l border-black/[0.1] text-[14.5px]">
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className={`-ml-px block border-l-2 border-transparent py-0.5 pl-3 text-ink-2 hover:border-orange-deep hover:text-ink ${focus}`}>{t.text}</a></li>)}
          </ol>
        </nav>

        <div className="rounded-2xl bg-gradient-to-br from-orange-light to-[#fff3ea] p-5">
          <p className="text-[12px] font-bold uppercase tracking-wide text-orange-deep">Free course</p>
          <p className="mt-1 text-[18px] font-bold leading-snug text-ink">{x.cta.title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{x.cta.text}</p>
          <Link href={x.cta.href} className={`mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-orange-deep px-5 text-[15px] font-semibold text-white hover:bg-ink ${focus}`}>{x.cta.label}</Link>
        </div>

        <nav aria-labelledby="explore-h" className="rounded-2xl border border-black/[0.09] bg-white p-5">
          <p id="explore-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">Explore the portal</p>
          <ul className="mt-3 divide-y divide-black/[0.07]">
            {EXPLORE.map((e) => <li key={e.href}><Link href={e.href} className={`block rounded-md py-2.5 hover:bg-cream-2 ${focus}`}><span className="block text-[15px] font-semibold text-ink">{e.label}</span><span className="block text-[13px] leading-snug text-ink-3">{e.note}</span></Link></li>)}
          </ul>
        </nav>

        <nav aria-labelledby="more-h" className="rounded-2xl border border-black/[0.09] bg-white p-5">
          <p id="more-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">Courses for this topic</p>
          <ul className="mt-3 space-y-2">
            {x.related.slice(0, 5).map((c) => <li key={c.href}><Link href={c.href} className={`text-[14.5px] font-semibold text-ink underline-offset-2 hover:text-orange-deep hover:underline ${focus}`}>{c.label}</Link></li>)}
          </ul>
        </nav>
      </aside>
    </div>

      <style>{`
        .bf-article { color: #1f2430; font-size: 17.5px; line-height: 1.8; }
        .bf-article > * + * { margin-top: 1.15rem; }
        .bf-article h2 { font-size: 26px; font-weight: 700; line-height: 1.25; margin-top: 2.6rem; color: #14213d; scroll-margin-top: 110px; }
        .bf-article h3 { font-size: 20px; font-weight: 700; line-height: 1.35; margin-top: 1.8rem; color: #14213d; scroll-margin-top: 110px; }
        .bf-article p { color: #3f4654; }
        .bf-article a { color: #9c3a11; text-decoration: underline; text-underline-offset: 2px; }
        .bf-article a:hover { color: #14213d; }
        .bf-article ul, .bf-article ol { padding-left: 1.4rem; color: #3f4654; }
        .bf-article ul { list-style: disc; }
        .bf-article ol { list-style: decimal; }
        .bf-article li + li { margin-top: 0.5rem; }
        .bf-article code { background: rgba(0,0,0,0.06); padding: 0.12em 0.4em; border-radius: 6px; font-size: 0.9em; }
        .bf-article .table-wrap { overflow-x: auto; border: 1px solid #e5e1d8; border-radius: 14px; }
        .bf-article table { border-collapse: collapse; width: 100%; min-width: 520px; font-size: 15px; line-height: 1.5; }
        .bf-article th { background: #f5f3ee; text-align: left; font-weight: 700; color: #14213d; }
        .bf-article th, .bf-article td { padding: 0.65rem 0.85rem; border-bottom: 1px solid #ebe7de; vertical-align: top; }
        .bf-article tr:last-child td { border-bottom: 0; }
        .bf-article pre { background: #0f1420; color: #e5e7eb; padding: 1rem 1.1rem; border-radius: 12px; overflow-x: auto; font-size: 14px; line-height: 1.6; }
        .bf-article pre code { background: none; padding: 0; color: inherit; }
      `}</style>
    </PageShell>
  );
}
