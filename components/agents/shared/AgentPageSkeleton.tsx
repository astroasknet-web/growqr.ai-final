/**
 * Route-level loading skeleton for the dedicated agent landing pages
 * (ai-interviewer, ai-resume-expert, …). Rendered by each route's
 * `loading.tsx` while the page streams in, so a card click navigates
 * instantly to a shaped placeholder instead of a spinner. Mirrors the
 * shared agent Hero: a nav bar, a two-column hero (copy left, media right).
 */
export default function AgentPageSkeleton() {
  return (
    <div className="min-h-screen bg-white" aria-busy aria-label="Loading agent page">
      <div className="animate-pulse">
        {/* Nav placeholder */}
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-14">
          <div className="h-8 w-28 rounded-lg bg-black/[0.06]" />
          <div className="hidden items-center gap-6 md:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 rounded bg-black/[0.06]" />
            ))}
          </div>
          <div className="h-9 w-24 rounded-full bg-black/[0.06]" />
        </div>

        {/* Hero */}
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 pt-16 md:px-14 md:pt-24 lg:grid-cols-2 lg:items-center">
          {/* Copy column */}
          <div className="flex flex-col gap-5">
            <div className="h-7 w-44 rounded-full bg-black/[0.06]" />
            <div className="flex flex-col gap-3.5">
              <div className="h-11 w-full rounded-xl bg-black/[0.07] md:h-14" />
              <div className="h-11 w-11/12 rounded-xl bg-black/[0.07] md:h-14" />
              <div className="h-11 w-2/3 rounded-xl bg-black/[0.07] md:h-14" />
            </div>
            <div className="mt-1 flex flex-col gap-2.5">
              <div className="h-4 w-full max-w-md rounded bg-black/[0.05]" />
              <div className="h-4 w-4/5 max-w-md rounded bg-black/[0.05]" />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="h-12 w-44 rounded-full bg-black/[0.08]" />
              <div className="h-12 w-32 rounded-full bg-black/[0.05]" />
            </div>
          </div>

          {/* Media column */}
          <div className="aspect-[4/3] w-full rounded-[28px] bg-black/[0.05]" />
        </div>
      </div>
    </div>
  );
}
