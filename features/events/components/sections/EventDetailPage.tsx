"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { EventRow } from "../../types/event";
import EventRegisterModal from "../modals/EventRegisterModal";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventPageContent from "./EventPageContent";

export default function EventDetailPage({ event }: { event: EventRow }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Navbar hideUseCases />

      <EventPageContent
        event={event}
        onRegisterClick={() => setShowModal(true)}
      />

      <Footer />

      <AnimatePresence>
        {showModal && (
          <EventRegisterModal event={event} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
