import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ExpertDetailPage from "@/features/experts/components/sections/ExpertDetailPage";
import { visibleExperts, getExpertBySlug } from "@/features/experts/data/experts-data";
import JsonLd from "@/components/seo/JsonLd";
import { canonicalUrl, buildPersonSchema, buildBreadcrumbSchema } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return visibleExperts.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);
  if (!expert || expert.hidden) return {};
  const url = canonicalUrl(`/experts/${expert.slug}`);
  return {
    title: `${expert.name}, ${expert.role} | GrowQR Experts`,
    description: expert.intro,
    alternates: { canonical: url },
    openGraph: {
      title: `${expert.name}, ${expert.role} | GrowQR Experts`,
      description: expert.headline,
      type: "profile",
      url,
      images: [{ url: expert.image }],
    },
  };
}

export default async function ExpertSlugRoute({ params }: Props) {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);
  // `hidden` experts stay bookable through the API routes (existing bookings,
  // reminders, calendar callbacks all resolve by slug) but must not be
  // reachable as a public page, even by direct URL.
  if (!expert || expert.hidden) notFound();
  return (
    <>
      <JsonLd data={buildPersonSchema(expert)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Experts", path: "/experts" },
          { name: expert.name, path: `/experts/${expert.slug}` },
        ])}
      />
      <ExpertDetailPage expert={expert} />
    </>
  );
}
