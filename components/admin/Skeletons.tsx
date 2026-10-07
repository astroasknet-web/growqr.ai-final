/**
 * Loading skeletons for the admin tabs.
 *
 * These exist to give each route a `loading.tsx`. Without one, an App Router
 * navigation to a dynamic page has nothing to show while the server renders,
 * so clicking a tab left the *previous* tab on screen, frozen, until the new
 * page's data came back. With a loading boundary the shell swaps instantly and
 * the skeleton stands in for the part that is still loading.
 *
 * The shapes deliberately mirror the real layouts so the swap doesn't shift
 * anything on screen.
 */

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-black/[0.06] motion-reduce:animate-none ${className}`} />
  );
}

export function AdminPageHeaderSkeleton() {
  return (
    <div>
      <Shimmer className="h-[34px] w-[320px] max-w-full" />
      <Shimmer className="mt-2.5 h-[17px] w-[420px] max-w-full" />
    </div>
  );
}

export function StatTilesSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-black/[0.1] shadow-card px-3 sm:px-6 py-4 sm:py-5"
        >
          <Shimmer className="h-[32px] w-[56px]" />
          <Shimmer className="mt-2 h-[12px] w-[72px]" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.1] shadow-card overflow-hidden">
      {/* Filter bar */}
      <div className="px-4 sm:px-5 py-4 border-b border-black/[0.1] flex flex-wrap items-center gap-3">
        <Shimmer className="h-[38px] w-full md:w-64 lg:w-80" />
        <Shimmer className="h-[38px] w-[130px]" />
        <Shimmer className="h-[38px] w-[130px]" />
        <div className="flex-1" />
        <Shimmer className="h-[38px] w-[110px]" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-black/[0.06]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 sm:px-5 py-4">
            <div className="flex-1 min-w-0 space-y-2">
              <Shimmer className="h-[14px] w-[180px] max-w-full" />
              <Shimmer className="h-[12px] w-[260px] max-w-full" />
            </div>
            <Shimmer className="hidden sm:block h-[12px] w-[140px]" />
            <Shimmer className="h-[12px] w-[90px]" />
            <Shimmer className="h-[12px] w-[70px]" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-4 sm:px-5 py-4 border-t border-black/[0.1] flex items-center justify-between">
        <Shimmer className="h-[12px] w-[160px]" />
        <div className="flex gap-2">
          <Shimmer className="h-[32px] w-[32px]" />
          <Shimmer className="h-[32px] w-[32px]" />
        </div>
      </div>
    </div>
  );
}

/** The shell every tab's loading state shares. */
export function AdminTabSkeleton({
  tiles,
  rows = 8,
}: {
  tiles: number;
  rows?: number;
}) {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-6"
    >
      <AdminPageHeaderSkeleton />
      <StatTilesSkeleton count={tiles} />
      <TableSkeleton rows={rows} />
    </main>
  );
}

/** Loading state for the single-record detail screens. */
export function AdminDetailSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-6"
    >
      <Shimmer className="h-[14px] w-[140px]" />
      <div>
        <Shimmer className="h-[32px] w-[280px] max-w-full" />
        <Shimmer className="mt-2.5 h-[16px] w-[360px] max-w-full" />
      </div>
      <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-6 space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-[11px] w-[110px]" />
            <Shimmer className="h-[15px] w-full max-w-[520px]" />
          </div>
        ))}
      </div>
    </main>
  );
}
