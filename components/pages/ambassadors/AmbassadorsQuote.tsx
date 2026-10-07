"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function AmbassadorsQuote() {
  return (
    <section className="bg-white py-16 md:py-24 px-6 md:px-14">
      <div className="max-w-[840px] mx-auto">
        <Reveal direction="up" offset={24}>
          <div className="text-center mx-auto">
            <p className="text-[20px] md:text-[28px] font-medium leading-relaxed text-ink-2 tracking-[-0.03em]">
              &ldquo;Being a GrowQR Ambassador isn&apos;t about hustling for the brand. It&apos;s about{" "}
              <span className="text-ink text-[1.05em] font-semibold">hustling for your own future</span>{" "}
              and bringing your campus along for the ride.&rdquo;
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="relative h-10 w-10 rounded-[10px] overflow-hidden shrink-0 border border-black/[0.08] shadow-sm">
                <Image
                  src="/android-chrome-192x192.png"
                  alt="GrowQR"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="text-[14px] md:text-[15px] font-bold tracking-tight text-ink uppercase">The GrowQR Team</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
