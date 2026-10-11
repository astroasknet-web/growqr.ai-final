import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { categoriesOf, slugify } from "@/lib/blog/discovery";
import { isIndexableTopic, topicFor } from "@/lib/blog/topics";
import { canonicalUrl, OG_IMAGE, SITE_URL } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { postUrl } from "@/lib/blog/seo";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

async function load(slug: string) {
  const all = await listBlogPosts({ limit: 1000 });
  const cats = categoriesOf(all);
  const cat = cats.find((c) => c.slug === slug);
  const found = topicFor(slug, cat?.name);
  if (!found) return null;
  const posts = all.filter((p) => p.category && slugify(p.category) === slug);
  return { all, cats, posts, ...found };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) return {};
  const index = isIndexableTopic(d.curated, d.posts.length);
  const title = `${d.topic.name} Guides, Quizzes and Study Help | GrowQR`;
  const url = canonicalUrl(`/blog/topic/${slug}`);
  return {
    title,
    description: d.topic.description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description: d.topic.description, url, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description: d.topic.description, images: [OG_IMAGE.url] },
  };
}

export default async function TopicRoute({ params }: Props) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d || d.posts.length === 0) notFound();
  const { topic, posts, cats } = d;
  const pillar = topic.pillar ? posts.find((p) => p.slug === topic.pillar) : undefined;
  const rest = pillar ? posts.filter((p) => p.slug !== pillar.slug) : posts;
  const url = `${SITE_URL}/blog/topic/${slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${url}#page`, url, name: `${topic.name} on the GrowQR blog`, description: topic.description, inLanguage: "en", isPartOf: { "@type": "Blog", name: "GrowQR Blog", url: `${SITE_URL}/blog` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` }, { "@type": "ListItem", position: 3, name: topic.name }] },
      { "@type": "ItemList", itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: postUrl(p.slug), name: p.title })) },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }} />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-32 sm:px-6 sm:pb-14 md:pt-40 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / <span aria-current="page">{topic.name}</span></nav>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[42px]">{topic.name}: guides, quizzes and study help</h1>
            {topic.intro.length ? <div className="mt-5 max-w-3xl space-y-4 text-[17px] leading-relaxed text-ink-2">{topic.intro.map((p, i) => <p key={i}>{p}</p>)}</div> : null}

            {pillar ? (
              <section aria-labelledby="start-h" className="mt-10">
                <h2 id="start-h" className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">Start here</h2>
                <BlogCard post={pillar} priority />
              </section>
            ) : null}

            <section aria-labelledby="all-h" className="mt-10">
              <h2 id="all-h" className="mb-4 text-[22px] font-bold text-ink">{pillar ? "More on " : "Articles on "}{topic.name}</h2>
              {rest.length ? <div className="grid gap-6 sm:grid-cols-2">{rest.map((p, i) => <BlogCard key={p.slug} post={p} priority={!pillar && i === 0} />)}</div> : <p className="text-[15px] text-ink-3">More articles on this topic are on the way.</p>}
            </section>
          </div>

          <aside aria-label="Related" className="mt-12 space-y-5 lg:mt-0">
            <div className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-black/[0.09] bg-white p-5">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-3">Practise this topic</h2>
                <ul className="mt-3 space-y-3">
                  {topic.learn.map((l) => <li key={l.href}><Link href={l.href} className={`block rounded-md ${focus}`}><span className="block text-[15.5px] font-semibold text-ink underline underline-offset-2 hover:text-orange-deep">{l.label}</span><span className="block text-[13px] text-ink-3">{l.why}</span></Link></li>)}
                </ul>
              </div>
              {cats.length > 1 ? (
                <nav aria-labelledby="other-h" className="rounded-2xl border border-black/[0.09] bg-white p-5">
                  <h2 id="other-h" className="text-[13px] font-bold uppercase tracking-wide text-ink-3">Other topics</h2>
                  <ul className="mt-3 space-y-2">{cats.filter((c) => c.slug !== slug).map((c) => <li key={c.slug}><Link href={`/blog/topic/${c.slug}`} className={`text-[15px] font-semibold text-ink underline-offset-2 hover:text-orange-deep hover:underline ${focus}`}>{c.name}</Link></li>)}</ul>
                </nav>
              ) : null}
              <div className="rounded-2xl bg-cream-2 p-5"><p className="mb-3 text-[14px] font-semibold text-ink">Looking for something else?</p><BlogSearchForm id="topic-q" /></div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
