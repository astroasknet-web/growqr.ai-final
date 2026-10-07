import { PROGRAM_FACTS } from "./internship-data";

/**
 * The terms every job description repeats. Saying them once here is what keeps
 * the role cards down to a single line each.
 *
 * One row of five on desktop, split by hairlines so the columns read as one
 * table rather than five floating pairs. Below that the row would crush, so it
 * wraps into a plain grid and the dividers come off.
 */
export default function InternshipFacts() {
  const last = PROGRAM_FACTS.length - 1;

  return (
    <section className="border-y border-black/[0.06] bg-cream/50 px-6 py-8 md:px-14 md:py-9">
      <dl className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 lg:gap-y-0 lg:divide-x lg:divide-black/[0.08]">
        {PROGRAM_FACTS.map((fact, idx) => (
          <div
            key={fact.label}
            className={`flex flex-col gap-2 lg:px-7 ${idx === 0 ? "lg:pl-0" : ""} ${
              idx === last ? "lg:pr-0" : ""
            }`}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-4">
              {fact.label}
            </dt>
            <dd className="text-[14.5px] font-medium leading-snug tracking-[-0.015em] text-ink">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
