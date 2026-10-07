import type { Metadata } from "next";

// Account pages are for people, not search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "same-origin", // keeps links in reset/verify emails from leaking to other sites; "no-referrer" would make browsers send "Origin: null" on form posts, which Next.js rejects
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
