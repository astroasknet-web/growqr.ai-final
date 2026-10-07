import type { Metadata } from "next";
import Link from "next/link";
import { UserRound, Eye, Shield, Mail } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Company | GrowQR",
  description: "About GrowQR, our vision for workforce intelligence, our privacy stance, and how to get in touch.",
  alternates: { canonical: canonicalUrl("/company") },
  openGraph: {
    title: "Company | GrowQR",
    description: "About GrowQR, our vision for workforce intelligence, our privacy stance, and how to get in touch.",
    url: canonicalUrl("/company"),
    images: [OG_IMAGE],
  },
};

const sections = [
  {
    href: "/about",
    label: "About Us",
    summary: "Who we are, why we built GrowQR, and the team behind the squad.",
    icon: UserRound,
  },
  {
    href: "/vision",
    label: "Vision",
    summary:
      "Where we think workforce intelligence is going, and the future we're building.",
    icon: Eye,
  },
  {
    href: "/privacy-policy",
    label: "Privacy Policy",
    summary:
      "How we handle your data. What we collect, why, and your rights as a user.",
    icon: Shield,
  },
  {
    href: "/contact",
    label: "Contact Us",
    summary:
      "Get in touch — for demos, press, partnerships, or general questions.",
    icon: Mail,
  },
];

/**
 * Company hub — landing page that links out to the four existing
 * Company pages. The nav was collapsed from a dropdown to a single
 * link pointing here; this page restores the four entries as
 * navigable cards rather than a hidden menu.
 */
export default function CompanyPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-[70vh] bg-cream pt-32 md:pt-40 pb-20 md:pb-28 px-6 md:px-14">
        <div className="mx-auto max-w-[1040px]">
          <div className="mb-10 md:mb-14 max-w-[640px]">
            <Reveal direction="left" offset={60}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-deep mb-4">
                Company
              </p>
              <h1 className="text-[36px] md:text-[52px] font-medium tracking-[-0.03em] md:tracking-[-0.04em] leading-[1.0] text-ink">
                Everything about GrowQR,
                <br />
                in one <span className="text-orange">place</span>.
              </h1>
              <p className="mt-5 text-[16px] md:text-[18px] text-ink-3 leading-[1.55]">
                Pick a section below, or reach out directly.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group relative flex items-start gap-4 bg-white rounded-[14px] border border-black/[0.08] p-6 md:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange/40 hover:shadow-[0_14px_34px_-10px_rgba(255,106,47,0.2)]"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-[10px] bg-orange/10 text-orange-deep flex-shrink-0">
                    <Icon className="w-5 h-5" aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] md:text-[20px] font-bold text-[#333333] leading-[1.25]">
                      {s.label}
                    </h2>
                    <p className="mt-2 text-[14px] md:text-[15px] text-ink-3 leading-[1.5]">
                      {s.summary}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-transform group-hover:translate-x-0.5">
                      Open
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
