"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { Eyebrow, SectionHeading, SectionSub } from "@/components/home/SectionHeader";
import InternshipRoleModal from "./InternshipRoleModal";
import {
  APPLY_PATH,
  INTERNSHIP_ROLES,
  ROLE_CATEGORIES,
  applyHref,
  type InternshipRole,
} from "./internship-data";

const ALL = "All roles";

/**
 * Card widths for the row the filter leaves behind. Five cards read best as
 * two wide over three; every smaller count divides the six-column grid
 * evenly, so no filter ever leaves a stranded card hanging off the left edge.
 */
function spanFor(count: number, idx: number): string {
  if (count === 1) return "lg:col-span-2 lg:col-start-3";
  if (count === 2 || count === 4) return "lg:col-span-3";
  if (count === 3) return "lg:col-span-2";
  return idx < 2 ? "lg:col-span-3" : "lg:col-span-2";
}

export default function InternshipRoles() {
  const [openRole, setOpenRole] = useState<InternshipRole | null>(null);
  const [filter, setFilter] = useState<string>(ALL);

  const counts = useMemo(() => {
    const map = new Map<string, number>([[ALL, INTERNSHIP_ROLES.length]]);
    for (const role of INTERNSHIP_ROLES) {
      map.set(role.category, (map.get(role.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const visible = useMemo(
    () => (filter === ALL ? INTERNSHIP_ROLES : INTERNSHIP_ROLES.filter((r) => r.category === filter)),
    [filter],
  );

  return (
    <section id="roles" className="scroll-mt-24 bg-white px-6 py-16 md:px-14 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <Eyebrow center>Open roles</Eyebrow>
          <SectionHeading>
            Pick where you <span className="text-orange">start.</span>
          </SectionHeading>
          <SectionSub className="mt-6 text-center">
            Every role is remote and mentored. Open a card for the details.
          </SectionSub>
        </div>

        {/* Filter badges. Categories are coarser than the cards, so Marketing
            genuinely narrows the grid rather than acting as a second title. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {[ALL, ...ROLE_CATEGORIES].map((category) => {
            const active = filter === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(category)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? "border-orange bg-orange text-white shadow-[0_8px_20px_-8px_rgba(255,106,47,0.6)]"
                    : "border-black/[0.1] bg-white text-ink-3 hover:border-orange/40 hover:text-orange-deep"
                }`}
              >
                {category}
                <span className={active ? "text-white/70" : "text-ink-5"}>
                  {counts.get(category) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Keyed on the filter so the new set fades in rather than snapping. */}
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 md:mt-10"
        >
          {visible.map((role, idx) => {
            const Icon = role.icon;
            const span = spanFor(visible.length, idx);
            // An odd card on the two-column breakpoint fills the row instead
            // of sitting half-width beside a gap.
            const fillRow = visible.length % 2 === 1 && idx === visible.length - 1 ? "sm:col-span-2" : "";
            return (
              <article
                key={role.value}
                className={`group relative flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange/25 hover:shadow-[0_16px_40px_-16px_rgba(17,24,39,0.14)] ${span} ${fillRow}`}
              >
                {/* The whole card is the apply link, so the tap target is the
                    card and not a 90px button inside it. */}
                <Link
                  href={applyHref(role)}
                  aria-label={`Apply for the ${role.title} internship`}
                  className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-2"
                />

                <div className="flex items-center gap-4">
                  <span className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange/8 text-orange transition-colors group-hover:bg-orange/14">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="text-[18px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                    {role.title}
                  </h3>
                </div>

                <p className="mt-4 text-[14.5px] leading-relaxed text-ink-3">{role.summary}</p>

                <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
                  {role.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-black/[0.07] bg-cream/70 px-2.5 py-1 text-[11.5px] font-medium text-ink-3"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenRole(role)}
                    className="relative z-[2] inline-flex items-center gap-1.5 rounded-full border border-black/[0.12] bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 transition hover:border-orange/40 hover:bg-orange/[0.04] hover:text-orange-deep"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Full job description
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange">
                    Apply
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </motion.div>

        <p className="mt-10 text-center text-[13.5px] text-ink-4">
          Not sure which one fits?{" "}
          <Link href={APPLY_PATH} className="font-semibold text-orange underline-offset-4 hover:underline">
            Start the form
          </Link>{" "}
          and pick a role on the way through.
        </p>
      </div>

      <InternshipRoleModal role={openRole} onClose={() => setOpenRole(null)} />
    </section>
  );
}
