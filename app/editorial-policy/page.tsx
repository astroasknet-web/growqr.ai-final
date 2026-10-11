import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { canonicalUrl, OG_IMAGE, SITE_URL } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";

const TITLE = "Editorial Policy: How GrowQR Writes and Corrects Articles";
const DESCRIPTION = "How GrowQR blog articles are written, checked, updated and corrected, including how AI tools are used and how to report a mistake.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/editorial-policy") },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: canonicalUrl("/editorial-policy"), type: "website", images: [OG_IMAGE] },
};

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": `${SITE_URL}/editorial-policy#page`, url: `${SITE_URL}/editorial-policy`, name: TITLE, description: DESCRIPTION, inLanguage: "en", isPartOf: { "@type": "WebSite", name: "GrowQR", url: SITE_URL } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` }, { "@type": "ListItem", position: 3, name: "Editorial policy" }] },
  ],
};

export default function EditorialPolicyRoute() {
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }} />
      <article className="mx-auto w-full max-w-3xl px-4 pb-10 pt-32 sm:px-6 sm:pb-14 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/blog" className="underline">Blog</Link> / <span aria-current="page">Editorial policy</span></nav>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[42px]">Editorial policy</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
          The GrowQR blog exists to teach. Each article should leave a reader able to do something they could not do before, or to check what they already know. This page explains how we keep that honest.
        </p>
        <div className="mt-8 space-y-8 text-[16.5px] leading-relaxed text-ink-2">
          <section><h2 className="text-[22px] font-bold text-ink">Who writes the articles</h2><p className="mt-2">Articles are written and edited by the author named on each one. Authors have a public <Link href="/blog/author/sachin-sharma" className="font-semibold text-ink underline">profile page</Link>. We do not publish under invented names or an anonymous &ldquo;editorial team&rdquo;.</p></section>
          <section><h2 className="text-[22px] font-bold text-ink">How an article is made</h2><p className="mt-2">We start from a question a learner actually has, tied to a course or practice test we offer. The article has to answer it directly, show a worked example or a quiz where that helps, and say plainly where something is a judgement rather than a rule.</p></section>
          <section><h2 className="text-[22px] font-bold text-ink">Checking facts and sources</h2><p className="mt-2">Quiz answers are worked through and each has a written explanation. Where an article states a fact about an exam, a rule or a tool, it should come from the official source, and we link to that source. We do not invent statistics, testimonials or reviews.</p></section>
          <section><h2 className="text-[22px] font-bold text-ink">Use of AI tools</h2><p className="mt-2">Drafting and editing may use AI tools. An AI draft is never published as it stands: the author reads it, checks the facts and the answers, and rewrites it so it is accurate and useful. We do not mass-produce articles to chase search rankings.</p></section>
          <section><h2 className="text-[22px] font-bold text-ink">Updates and corrections</h2><p className="mt-2">When an article changes in a meaningful way, its &ldquo;updated&rdquo; date changes with it. We do not change the date for small edits. If you find a mistake, <Link href="/contact" className="font-semibold text-ink underline">tell us through the contact page</Link>, naming the article and what is wrong. We fix confirmed errors promptly and say so in the article when the correction matters.</p></section>
          <section><h2 className="text-[22px] font-bold text-ink">Independence and links</h2><p className="mt-2">Articles link to our own courses and tools where they genuinely help the reader, and we say when we do. Nobody pays for a mention in an article.</p></section>
        </div>
        <p className="mt-10 text-[14.5px] text-ink-3">Read our <Link href="/privacy-policy" className="font-semibold text-ink underline">privacy policy</Link> or return to the <Link href="/blog" className="font-semibold text-ink underline">blog</Link>.</p>
      </article>
    </PageShell>
  );
}
