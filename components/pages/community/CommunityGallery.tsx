"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { GALLERY } from "./community-data";

export default function CommunityGallery() {
  return (
    <section className="bg-white border-y border-black/5 py-12 md:py-16 lg:py-20 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-8 lg:mb-10">
            <Eyebrow>Community in Action</Eyebrow>
            <h2 className="mt-3 text-[32px] md:text-[42px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              Growth happens <span className="text-orange">together.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal direction="up" offset={20}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-[190px] sm:auto-rows-[300px] md:auto-rows-[360px] lg:auto-rows-[440px]">
            {GALLERY.map((img) => (
              <div
                key={img.src}
                className={`group relative overflow-hidden ${img.span}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                {/* Subtle gradient for an elegant, non-stock feel */}
                <div
                  aria-hidden
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,12,20,0.34) 0%, transparent 52%)",
                  }}
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
