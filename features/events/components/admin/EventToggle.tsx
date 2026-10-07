"use client";

import { useTransition } from "react";
import { toggleEventStatus } from "@/features/events/actions/admin/toggleEventStatus";

interface Props {
  id: string;
  isActive: boolean;
}

export default function EventToggle({ id, isActive }: Props) {
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      await toggleEventStatus(id, !isActive);
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={isActive ? "Deactivate event" : "Activate event"}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:ring-offset-2 disabled:opacity-50 ${
        isActive ? "bg-orange" : "bg-black/15"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
