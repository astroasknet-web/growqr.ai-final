import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveEventBySlug,
  listActiveEventSlugs,
} from "@/features/events/services/events.service";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { seedEventBySlug, seedEventSlugs } from "@/features/events/data/seed-rows";
import EventDetailPage from "@/features/events/components/sections/EventDetailPage";
import JsonLd from "@/components/seo/JsonLd";
import { canonicalUrl, buildEventSchema, buildBreadcrumbSchema, OG_IMAGE } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

// Resolve a live event, or fall back to a seed event when Supabase isn't
// configured (a preview/demo deployment) so demo event links don't 404.
// In production (configured) this is a plain DB lookup — unchanged behaviour.
async function resolveEvent(slug: string) {
  const live = await getActiveEventBySlug(slug);
  if (live) return live;
  return isSupabaseConfigured() ? null : seedEventBySlug(slug);
}

export async function generateStaticParams() {
  const slugs = await listActiveEventSlugs();
  const resolved = slugs.length > 0 || isSupabaseConfigured() ? slugs : seedEventSlugs();
  return resolved.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event) return {};
  const url = canonicalUrl(`/events/${event.slug}`);
  const ogImage = event.poster_url ?? event.speaker_image ?? undefined;
  return {
    title: `${event.title} | GrowQR Events`,
    description: event.short_description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: `${event.title} | GrowQR Events`,
      description: event.short_description ?? undefined,
      type: "website",
      url,
      // Fall back to the site card rather than shipping no image at all — an
      // event with neither a poster nor a speaker photo would otherwise
      // preview as a bare text link.
      images: ogImage ? [{ url: ogImage }] : [OG_IMAGE],
    },
  };
}

export default async function EventSlugRoute({ params }: Props) {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event) notFound();
  return (
    <>
      <JsonLd data={buildEventSchema(event)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
          { name: event.title, path: `/events/${event.slug}` },
        ])}
      />
      <EventDetailPage event={event} />
    </>
  );
}
