"use client";

import { useCallback, useState, type ReactNode } from "react";
import { galleryImages, type GalleryImage } from "@/lib/gallery/gallery-data";
import GalleryLightbox from "./GalleryLightbox";

/**
 * The gallery grid.
 *
 * LAYOUT — a CSS multi-column masonry interrupted by full-width BANDS. A band
 * is a pair: a feature two columns wide plus a companion filling the third, so
 * it spans the grid edge to edge with no dead column. Bands alternate which
 * side the feature sits on. Both widths are derived from the column grid
 * itself, so every edge lands on a real column edge.
 *
 * Photographs keep their native aspect ratio; only a band's companion is
 * cropped, and the pairs are shape-matched in scripts/build-gallery.mjs so that
 * crop is a few percent. The running order is balanced there too, so columns
 * end flush instead of leaving ragged holes above each band.
 *
 * Bands and masonry tiles must all be direct children of the multicol
 * container — `column-span` only works on a direct child.
 *
 * NO ROUNDED CORNERS on the imagery. Square edges are the house style here and
 * are what let the mixed aspect ratios line up cleanly.
 *
 * METADATA — nothing is set under the frames. The default state is the
 * photographs and nothing else; hovering lifts the detail in over the image.
 * On touch, where there is no hover, tapping opens the lightbox and the detail
 * is set beneath the picture there.
 *
 * PERFORMANCE — each tile reserves its exact box from the intrinsic dimensions
 * (nothing shifts as files arrive), paints a ~100-byte inline WebP blur
 * underneath, and lazy-loads everything past the opening band.
 */
export default function GalleryGrid() {
  const [openAt, setOpenAt] = useState<number | null>(null);

  const nodes: ReactNode[] = [];
  let bandCount = 0;

  for (let i = 0; i < galleryImages.length; i++) {
    const image = galleryImages[i];
    if (image.companion) continue; // drawn as part of the band before it

    if (image.feature) {
      const companion = galleryImages[i + 1];
      // Alternate the side the feature sits on so the page swings.
      const flipped = bandCount % 2 === 1;
      bandCount++;
      nodes.push(
        <div
          key={image.slug}
          className={`my-8 flex flex-col gap-4 [column-span:all] sm:gap-5 lg:my-14 lg:gap-6 ${
            flipped ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          <GalleryTile
            image={image}
            index={i}
            onOpen={() => setOpenAt(i)}
            className="lg:w-[calc((100%-3rem)/3*2+1.5rem)]"
            sizes="(min-width: 1024px) 900px, 100vw"
          />
          <GalleryTile
            image={companion}
            index={i + 1}
            onOpen={() => setOpenAt(i + 1)}
            className="lg:w-[calc((100%-3rem)/3)]"
            sizes="(min-width: 1024px) 440px, 100vw"
            stretch
          />
        </div>
      );
      continue;
    }

    nodes.push(
      <GalleryTile
        key={image.slug}
        image={image}
        index={i}
        onOpen={() => setOpenAt(i)}
        className="mb-4 break-inside-avoid sm:mb-5 lg:mb-6"
        sizes="(min-width: 1024px) 460px, (min-width: 640px) calc(50vw - 2rem), calc(100vw - 2rem)"
      />
    );
  }

  return (
    <>
      <div
        className="mx-auto max-w-[1440px] columns-1 px-4 [column-gap:1rem]
                   sm:columns-2 sm:px-6 sm:[column-gap:1.25rem]
                   lg:columns-3 lg:px-10 lg:[column-gap:1.5rem]"
      >
        {nodes}
      </div>

      <GalleryLightbox
        images={galleryImages}
        index={openAt}
        onClose={() => setOpenAt(null)}
        onNavigate={setOpenAt}
      />
    </>
  );
}

function GalleryTile({
  image,
  index,
  onOpen,
  className,
  sizes,
  stretch = false,
}: {
  image: GalleryImage;
  index: number;
  onOpen: () => void;
  className: string;
  sizes: string;
  /** Band companion: fills the band's height instead of using its own ratio. */
  stretch?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  // A cached or eagerly-fetched image can finish decoding BEFORE React hydrates
  // and attaches onLoad, in which case that event never fires and the fade-in
  // below would leave the picture stuck at opacity-0 forever. That hid the
  // opening frame every time. Checking `complete` as the node mounts catches
  // exactly that case; onLoad still covers the normal path.
  const measureRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true);
  }, []);

  // The opening band is fetched eagerly; everything else waits for the viewport.
  const eager = index < 2;

  return (
    <figure
      className={`group flex flex-col ${className}`}
      // Aspect lives in a custom property rather than an inline aspect-ratio so
      // a band companion can drop it at `lg` and stretch instead — an inline
      // style would outrank the class that turns it off.
      style={{ "--ar": `${image.width} / ${image.height}` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${image.caption}, ${image.location}`}
        className={`relative block w-full cursor-pointer overflow-hidden bg-cream-3
                    [aspect-ratio:var(--ar)]
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange
                    ${stretch ? "lg:min-h-0 lg:flex-1 lg:[aspect-ratio:auto]" : ""}`}
      >
        {/* Placeholder behind the photograph, so a slow connection sees the
            right colours in the right box rather than an empty hole. */}
        <span
          aria-hidden
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
          style={{ backgroundImage: `url("${image.lqip}")` }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element -- static
            pre-transcoded WebP with a hand-built srcset; next/image would only
            re-optimise files already at their target sizes and bill a
            transformation for each one. */}
        <img
          ref={measureRef}
          src={image.src}
          srcSet={image.srcSet}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={`${image.caption}. ${image.location}, ${image.place}.`}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`relative h-full w-full object-cover transition-[transform,opacity] duration-700
                      ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
                      ${loaded ? "opacity-100" : "opacity-0"}
                      [@media(hover:hover)]:group-hover:scale-[1.035]
                      motion-reduce:[@media(hover:hover)]:group-hover:scale-100`}
        />

        {/* Hover reveal, pointer devices only. Sticky :hover on touch would
            leave this stuck open after a tap, so the whole treatment is gated
            behind a hover query; touch reads the same detail in the lightbox. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t
                     from-ink/80 via-ink/15 to-transparent opacity-0 transition-opacity
                     duration-500 group-hover:opacity-100 [@media(hover:hover)]:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-1.5
                     p-5 text-left opacity-0 transition-[opacity,transform] duration-500
                     ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0
                     group-hover:opacity-100 motion-reduce:transition-none
                     [@media(hover:hover)]:block"
        >
          <span className="block text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">
            {image.location}
          </span>
          <span className="mt-1 block text-[12px] leading-snug text-white/70">
            {image.caption}
            <span className="mx-1.5 text-white/40">·</span>
            {image.place}
            {image.date ? (
              <>
                <span className="mx-1.5 text-white/40">·</span>
                {image.date}
              </>
            ) : null}
          </span>
        </span>
      </button>
    </figure>
  );
}
