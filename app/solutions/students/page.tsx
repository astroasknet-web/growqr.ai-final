import type { Metadata } from "next";
import StudentsSolutionPage from "@/components/pages/StudentsSolutionPage";
import { studentsContent } from "@/lib/persona-content";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: studentsContent.meta.title,
  description: studentsContent.meta.description,
  alternates: { canonical: canonicalUrl("/solutions/students") },
  openGraph: {
    title: "GrowQR for Students",
    description: studentsContent.hero.subline,
    url: canonicalUrl("/solutions/students"),
    images: [OG_IMAGE],
  },
};

export default function StudentsUseCase() {
  return <StudentsSolutionPage />;
}
