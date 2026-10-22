import type { Metadata } from "next";
import HomeClassic from "@/components/home/HomeClassic";

// The previous homepage, kept so it can be restored: copy this page's body back into app/page.tsx.
export const metadata: Metadata = {
  title: "Classic home | GrowQR",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomeClassic />;
}
