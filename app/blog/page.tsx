import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import BlogCard from "@/components/blog/BlogCard";
import BlogAnalytics from "@/components/blog/BlogAnalytics";
import { listBlogPosts } from "@/lib/blog/blogforge";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Blog | GrowQR";
const DESCRIPTION =
  "Guides, insights and updates on skills, hiring and the RQ-Score from the GrowQR team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/blog") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl("/blog"),
    images: [OG_IMAGE],
    type: "website",
  },
};

export default async function BlogIndexRoute() {
  const posts = await listBlogPosts({ limit: 48 });
  return (
    <PageShell>
      <BlogAnalytics />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20 md:px-8">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-orange/10 px-4 py-1.5 text-[13px] font-semibold text-orange">
            GrowQR Blog
          </span>
          <h1 className="text-[32px] font-bold leading-tight text-ink sm:text-[40px]">
            Insights on skills, hiring &amp; readiness
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-4">
            Guides and updates from the GrowQR team.
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-black/[0.08] bg-white p-10 text-center shadow-sm">
            <h2 className="text-[20px] font-bold text-ink">Coming soon</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-4">
              Our blog is on its way — guides and insights on skills, hiring and the RQ-Score.
              Check back shortly.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}
