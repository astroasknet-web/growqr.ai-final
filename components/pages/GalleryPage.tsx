import GalleryGrid from "@/components/gallery/GalleryGrid";
import { Eyebrow, SectionHeading } from "@/components/home/SectionHeader";

/**
 * /gallery — the campus photography set.
 *
 * Server-rendered header over a client grid. The header stays deliberately
 * bare: no counts, no stat row. The photographs carry the page.
 */
export default function GalleryPage() {
  return (
    <>
      <section className="px-6 pb-12 pt-32 md:px-14 md:pb-16 md:pt-40">
        <div className="mx-auto max-w-[760px] xl:max-w-[980px] text-center">
          <Eyebrow center>Gallery</Eyebrow>
          {/* One line at every width. The headline is 29 characters, which at
              the shared 64px display size needs ~890px — wider than the 760px
              text column — so the column opens up at xl and the size goes
              fluid below it. `nowrap` is what actually forbids the break; the
              clamp is what keeps that from overflowing on a phone. */}
          <SectionHeading className="whitespace-nowrap text-[clamp(22px,5.9vw,64px)] md:text-[clamp(22px,5.9vw,64px)] xl:text-[clamp(22px,5.9vw,64px)]">
            Ideas in action, <span className="text-orange">across India.</span>
          </SectionHeading>
        
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <GalleryGrid />
      </section>
    </>
  );
}
