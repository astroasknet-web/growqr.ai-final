import type { Metadata } from "next";
import { QrsChrome } from "@/components/qrs/shell";

// Account pages are for people, not search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "same-origin", // keeps links in reset/verify emails from leaking to other sites; "no-referrer" would make browsers send "Origin: null" on form posts, which Next.js rejects
};

// Every signed-in or account page sits between the original qrscore header (with the Courses / Study Abroad menu) and its footer.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <QrsChrome>{children}</QrsChrome>;
}
