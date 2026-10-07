import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import GalleryPage from "@/components/pages/GalleryPage";
import { canonicalUrl, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { galleryImages, galleryLocations } from "@/lib/gallery/gallery-data";

const TITLE = "Gallery | GrowQR on Campus";
const DESCRIPTION =
  "Workshops, masterclasses and partnerships across Indian campuses, photographed as they happened.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/gallery") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl("/gallery"),
    images: [OG_IMAGE],
  },
};

export default function GalleryRoute() {
  // ImageGallery schema. Each photograph is a real, dated, located asset, so
  // it is worth describing properly for image search.
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl("/gallery"),
    about: galleryLocations,
    image: galleryImages.map((i) => ({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(i.src),
      width: i.width,
      height: i.height,
      caption: `${i.caption}. ${i.location}, ${i.place}.`,
      contentLocation: { "@type": "Place", name: `${i.location}, ${i.place}` },
    })),
  };

  // The opening frame is the LCP element on every viewport. Without this the
  // browser cannot discover it until the grid has parsed and hydrated, since
  // the markup comes from a client component. Preloading with the same srcset
  // and sizes the tile uses means the byte-identical candidate is already in
  // flight, rather than a second copy at the wrong width.
  const lcp = galleryImages[0];

  return (
    <PageShell>
      <link
        rel="preload"
        as="image"
        imageSrcSet={lcp.srcSet}
        imageSizes="(min-width: 1024px) 900px, 100vw"
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
      <GalleryPage />
    </PageShell>
  );
}
