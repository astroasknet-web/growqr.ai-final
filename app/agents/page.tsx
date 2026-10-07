import type { Metadata } from "next";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import AgentsDirectory from "@/components/agents/directory/AgentsDirectory";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Agents | GrowQR",
  description:
    "Meet GrowQR's AI career squad - seven specialised agents that build your resume, run mock interviews, find opportunities, and more.",
  alternates: { canonical: canonicalUrl("/agents") },
  openGraph: {
    title: "AI Agents | GrowQR",
    description:
      "Meet GrowQR's AI career squad - seven specialised agents that build your resume, run mock interviews, find opportunities, and more.",
    url: canonicalUrl("/agents"),
    images: [OG_IMAGE],
  },
};

export default function AgentsRoute() {
  return (
    <PageShell>
      {/* AgentsDirectory reads useSearchParams() (?mode=enterprise toggle) —
          Next.js requires a Suspense boundary around that or the whole page
          opts out of static rendering. */}
      <Suspense fallback={null}>
        <AgentsDirectory />
      </Suspense>
    </PageShell>
  );
}
