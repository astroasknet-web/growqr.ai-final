import type { Metadata } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import HomeNav from "@/components/home-options/HomeNav";
import "./home-options.css";

// Client-review previews only: never indexed, never in the sitemap.
export const metadata: Metadata = {
  title: "Homepage options | GrowQR",
  robots: { index: false, follow: false },
};

export default function HomeOptionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeNav />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
