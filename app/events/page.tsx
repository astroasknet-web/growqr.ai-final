import type { Metadata } from "next";
import EventsPage from "@/components/pages/EventsPage";
import { listActiveEvents } from "@/features/events/services/events.service";
import { seedEventsAsRows } from "@/features/events/data/seed-rows";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "GrowQR Events: Live Expert Sessions & Workshops",
  description:
    "Join live workshops, talks, and hands-on sessions led by verified experts. Learn what matters, meet ambitious people, and leave with a plan you can act on.",
  alternates: { canonical: canonicalUrl("/events") },
  openGraph: {
    title: "GrowQR Events: Live Expert Sessions & Workshops",
    description:
      "Discover and register for expert-led events under the GrowQR ecosystem.",
    url: canonicalUrl("/events"),
    images: [OG_IMAGE],
  },
};

export default async function EventsRoute() {
  const dbEvents = await listActiveEvents();
  const events = dbEvents.length > 0 ? dbEvents : seedEventsAsRows();
  return <EventsPage events={events} />;
}
