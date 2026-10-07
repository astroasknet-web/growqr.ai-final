export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import EventForm from "@/features/events/components/admin/EventForm";
import { getEventAdmin } from "@/features/events/services/adminEvents.service";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit event | GrowQR Admin",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventAdmin(id);
  if (!event) notFound();

  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-8">
      <EventForm eventId={event.id} initialData={event} />
    </main>
  );
}
