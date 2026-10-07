import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/portal/session";
import { MarketShell } from "@/components/market/shell";
import { FreeScoreForm } from "@/components/portal/free-score-form";

const TITLE = "Free Resume Score Checker: Get Your RQ Score | GrowQR";
const DESC = "Upload your resume and get a free RQ Score out of 100 in seconds, plus what to fix first. No sign-up needed to see your score.";
export const metadata: Metadata = {
  title: TITLE, description: DESC, robots: { index: true, follow: true }, alternates: { canonical: "/resume-score" },
  openGraph: { title: TITLE, description: DESC, url: "/resume-score", type: "website", images: ["/og-image.png"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/og-image.png"] },
};
export const dynamic = "force-dynamic";

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebApplication", name: "GrowQR Free Resume Score Checker", url: "/resume-score", applicationCategory: "BusinessApplication", operatingSystem: "Web",
      description: "Upload a resume and get a free score out of 100 with plain-language advice on what to improve.", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }, { "@type": "ListItem", position: 2, name: "Free resume score", item: "/resume-score" }] },
  ],
};

export default async function ResumeScorePage() {
  const me = (await getSession())?.user ?? null;
  if (me?.role === "student") redirect("/passport"); // signed-in students score inside their Skill Passport
  return (
    <MarketShell user={me} active="">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <main id="main" className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="text-[28px] sm:text-[36px] font-bold text-ink tracking-tight">Free resume score in 20 seconds</h1>
        <p className="text-[16px] text-ink-3 mt-2 mb-3">Upload your resume and see your RQ Score out of 100, plus the three things to fix first. No sign-up needed to see your score.</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-2 mb-8"><li>&#10003; PDF, Word or pasted text</li><li>&#10003; Instant, nothing to install</li><li>&#10003; Free, always</li></ul>
        <FreeScoreForm />
        <section aria-labelledby="rsc-h"><h2 id="rsc-h" className="text-[20px] font-bold text-ink mb-3">What happens next</h2>
          <ol className="space-y-3 list-decimal pl-5 text-[15px] text-ink-2">
            <li><b className="text-ink">You get a score.</b> A number out of 100 and a grade, based on how clearly and convincingly your resume presents your education, experience, skills and impact.</li>
            <li><b className="text-ink">You see what to fix first.</b> Three clear focus areas, in plain language.</li>
            <li><b className="text-ink">You improve it.</b> Create a free account to rebuild it in Resume Studio, match it to paid internships and share a verified passport.</li>
          </ol></section>
      </main>
    </MarketShell>
  );
}
