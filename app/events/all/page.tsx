import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import AllEventsPage from "@/features/events/components/sections/AllEventsPage";
import Footer from "@/components/layout/Footer";
import { listActiveEvents } from "@/features/events/services/events.service";
import { seedEventsAsRows } from "@/features/events/data/seed-rows";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Events | GrowQR",
  description:
    "Browse all upcoming and past events on GrowQR: expert sessions, workshops, and industry talks.",
  alternates: { canonical: canonicalUrl("/events/all") },
  openGraph: {
    title: "All Events | GrowQR",
    description:
      "Browse all upcoming and past events on GrowQR: expert sessions, workshops, and industry talks.",
    url: canonicalUrl("/events/all"),
    images: [OG_IMAGE],
  },
};

export default async function AllEventsRoute() {
  const dbEvents = await listActiveEvents();
  const events = dbEvents.length > 0 ? dbEvents : seedEventsAsRows();
  return (
    <>
      <Navbar hideUseCases />
      <main className="min-h-screen bg-white">
        <AllEventsPage events={events} />
      </main>
      <Footer />
    </>
  );
}
