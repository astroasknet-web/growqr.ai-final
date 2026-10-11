import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import BlogCard from "@/components/blog/BlogCard";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { AUTHORS, authorSlug } from "@/lib/blog/authors";
import { canonicalUrl, OG_IMAGE, SITE_URL } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return AUTHORS.map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = AUTHORS.find((x) => x.slug === slug);
  if (!a) return {};
  const title = `${a.name}, Author | GrowQR Blog`;
  const description = `${a.name} writes and edits the GrowQR blog: practical guides and quizzes on digital skills and exam preparation. Read their articles.`;
  const url = canonicalUrl(`/blog/author/${a.slug}`);
  return { title, description, alternates: { canonical: url }, robots: { index: true, follow: true }, openGraph: { title, description, url, type: "profile", images: [OG_IMAGE] }, twitter: { card: "summary", title, description } };
}

export default async function AuthorRoute({ params }: Props) {
  const { slug } = await params;
  const a = AUTHORS.find((x) => x.slug === slug);
  if (!a) notFound();
  const posts = (await listBlogPosts({ limit: 1000 })).filter((p) => p.author && authorSlug(p.author) === a.slug);
  const url = `${SITE_URL}/blog/author/${a.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ProfilePage", "@id": `${url}#page`, url, mainEntity: { "@id": `${url}#person` } },
      { "@type": "Person", "@id": `${url}#person`, name: a.name, url, description: a.bio[0], worksFor: { "@type": "Organization", name: "GrowQR", url: SITE_URL }, ...(a.sameAs.length ? { sameAs: a.sameAs } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` }, { "@type": "ListItem", position: 3, name: a.name }] },
    ],
  };
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }} />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-32 sm:px-6 sm:pb-14 md:pt-40 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / <span aria-current="page">{a.name}</span></nav>
        <header className="max-w-3xl">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[42px]">{a.name}</h1>
          <p className="mt-2 text-[16px] font-semibold text-orange-deep">{a.role}</p>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-2">{a.bio.map((p, i) => <p key={i}>{p}</p>)}</div>
          {a.credentials.length ? <ul className="mt-5 list-disc space-y-1 pl-5 text-[15.5px] text-ink-2">{a.credentials.map((c) => <li key={c}>{c}</li>)}</ul> : null}
          <p className="mt-5 text-[14.5px] text-ink-3">How we write, check and correct articles: <Link href="/editorial-policy" className="font-semibold text-ink underline">editorial policy</Link>.</p>
        </header>
        <section aria-labelledby="by-h" className="mt-12">
          <h2 id="by-h" className="mb-4 text-[22px] font-bold text-ink">Articles by {a.name}</h2>
          {posts.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <BlogCard key={p.slug} post={p} />)}</div> : <p className="text-[15px] text-ink-3">No articles yet.</p>}
        </section>
      </div>
    </PageShell>
  );
}
