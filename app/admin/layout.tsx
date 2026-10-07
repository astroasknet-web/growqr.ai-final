import type { Metadata } from "next";
import AdminProgressBar from "@/components/admin/AdminProgressBar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageTransition from "@/components/admin/AdminPageTransition";

export const metadata: Metadata = {
  title: "Admin — GrowQR",
  robots: { index: false, follow: false },
};

/**
 * Admin shell layout.
 *
 * Structure (from outermost):
 *   bg wrapper          ← always present
 *   AdminProgressBar    ← fixed top progress bar (client)
 *   AdminHeader         ← sticky nav, hidden on /admin/login (client)
 *   AdminPageTransition ← fade-in wrapper keyed on pathname (client)
 *     {children}        ← each page's <main> (server or client)
 *
 * Keeping the header *outside* the transition wrapper means the nav stays
 * visually persistent and its layoutId pill can slide between active items
 * without being unmounted.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-2 font-sans text-ink">
      <AdminProgressBar />
      <AdminHeader />
      <AdminPageTransition>
        {children}
      </AdminPageTransition>
    </div>
  );
}
