import Image from "next/image";
import Link from "next/link";

/**
 * ExpertCard — the canonical expert portrait card used across the site
 * (the /experts instructor rail and the home-page experts row). Grayscale
 * portrait, RQ-Score badge, gradient name overlay. Sizing of the portrait
 * frame is left to the caller via `frameClassName` (fixed dims for the
 * drag rail, responsive aspect for grids).
 */

export type ExpertCardItem = {
  href: string;
  name: string;
  imageUrl: string;
  role: string;
  bg: string;
  rqScore: number;
};

export function ExpertCard({
  expert,
  frameClassName,
  sizes,
  priority = false,
}: {
  expert: ExpertCardItem;
  /** Tailwind sizing for the portrait frame. */
  frameClassName: string;
  /** Next/Image `sizes` hint for the responsive fill. */
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative group">
      <div className={`relative overflow-hidden rounded-3xl ${expert.bg} ${frameClassName}`}>
        <Link href={expert.href} draggable={false} className="block h-full w-full">
          <Image
            alt={expert.name}
            src={expert.imageUrl}
            fill
            draggable={false}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover object-top rounded-3xl grayscale transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        </Link>
      </div>

      {/* RQ-Score badge */}
      <div className="absolute top-3 left-3 z-10 md:top-4 md:left-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 py-1 pl-2.5 pr-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06] backdrop-blur-md md:gap-1.5 md:py-1.5 md:pl-3.5 md:pr-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink/60 md:text-[10px]">RQ-Score</span>
          <span className="h-3 w-px bg-black/10 md:h-3.5" />
          <span className="text-[14px] font-extrabold leading-none text-orange tabular-nums md:text-[16px]">{expert.rqScore}</span>
        </span>
      </div>

      {/* readability gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2/3 rounded-b-3xl bg-gradient-to-t from-black/55 to-transparent" />

      <div className="absolute bottom-0 flex flex-col gap-2 p-4 md:gap-4 md:p-6">
        <Link href={expert.href} draggable={false}>
          <h5 className="text-base font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-orange-light md:text-2xl">
            {expert.name}
          </h5>
        </Link>
        <p className="w-fit rounded-full border border-white/90 px-3 py-1 text-[11px] text-white transition-colors duration-200 group-hover:bg-white/20 md:px-5 md:py-2 md:text-base">
          {expert.role}
        </p>
      </div>
    </div>
  );
}
