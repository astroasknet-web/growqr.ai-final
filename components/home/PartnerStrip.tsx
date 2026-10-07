import Image from "next/image";
import { partnerLogos } from "@/lib/partner-logos";
import Reveal from "@/components/ui/Reveal";

// Each track renders the original list once. CSS animation loops it
// seamlessly with a second identical (aria-hidden) track — 2× total,
// down from the previous 6×.
const LOGO_SIZES = "(max-width: 768px) 112px, 136px";

function LogoTrack({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      className="flex min-w-full shrink-0 items-center gap-3 md:gap-16 pr-3 md:pr-16 marquee group-hover:[animation-play-state:paused]"
      aria-hidden={hidden || undefined}
    >
      {partnerLogos.map((partner) => (
        <div
          key={partner.name}
          className="flex items-center justify-center md:min-w-[136px]"
        >
          <Image
            src={partner.src}
            alt={hidden ? "" : `${partner.name} logo`}
            width={180}
            height={80}
            sizes={LOGO_SIZES}
            loading="lazy"
            className="h-12 md:h-[60px] w-auto object-contain opacity-90"
          />
        </div>
      ))}
    </div>
  );
}

export default function PartnerStrip() {
  return (
    <section className="py-14 md:py-18 overflow-hidden bg-white">
      <div className="mx-auto max-w-[1340px] px-6 md:px-14 mb-8 text-center">
        <Reveal direction="left" offset={60}>
          <h2 className="text-[30px] sm:text-[34px] md:text-[40px] font-medium tracking-[-0.035em] leading-[0.95] text-ink">
            Our Partners
          </h2>
        </Reveal>
      </div>

      <div className="relative flex overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <LogoTrack />
        <LogoTrack hidden />
      </div>
    </section>
  );
}