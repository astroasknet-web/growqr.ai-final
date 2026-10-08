import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/** The main site's navigation bar and footer around a portal page. The bar is fixed (64px), so the page starts below it. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-16">{children}</div>
      <Footer />
    </>
  );
}
