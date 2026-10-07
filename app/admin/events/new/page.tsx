import EventForm from "@/features/events/components/admin/EventForm";

export const metadata = {
  title: "New event | GrowQR Admin",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-8">
      <EventForm />
    </main>
  );
}
