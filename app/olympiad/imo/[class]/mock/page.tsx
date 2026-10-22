import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketShell } from "@/components/market/shell";
import MockTest, { type MockSec } from "@/components/lms/MockTest";
import { render } from "@/lib/lms/content";
import { IMO_SECTIONS, assembleImoMock, classNumber, isClass, sectionLabel } from "@/lib/lms/school";

export const dynamic = "force-dynamic"; // a fresh set of questions on every visit

type P = { params: Promise<{ class: string }> };
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = clean((await params).class);
  if (!isClass(c)) return { title: "Test not found | GrowQR", robots: { index: false, follow: true } };
  return { title: `Class ${classNumber(c)} IMO Mock Test: Free Online Maths Olympiad Test | GrowQR`, description: `A full-syllabus Class ${classNumber(c)} Maths Olympiad mock test, sectioned like the real olympiad, with worked explanations.`, alternates: { canonical: `/olympiad/imo/${c}/mock` } };
}

export default async function ImoMock({ params }: P) {
  const c = clean((await params).class);
  const mock = isClass(c) ? assembleImoMock(c) : null;
  if (!mock || !mock.questions.length) notFound();
  const sections: MockSec[] = IMO_SECTIONS.map((s) => ({
    type: "mcq",
    title: sectionLabel(s.key),
    questions: mock.questions.filter((q) => q.section === s.key).map((q) => ({
      q: render(q.q) + (q.diagram ? `<div class="mt-2">${render(q.diagram)}</div>` : ""),
      options: q.options.map((o) => render(o)),
      correct: q.correct,
      explanation: render(q.explanation),
      marks: mock.marks[s.key] ?? mock.marks.default ?? 1,
      neg: 0,
    })),
  })).filter((s) => s.questions.length);
  return (
    <MarketShell user={null} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href="/olympiad/imo" className="underline">Maths Olympiad</Link> / <Link href={`/olympiad/imo/${c}`} className="underline">Class {classNumber(c)}</Link> / Mock test</nav>
      <MockTest id={`imo-${c}-mock`} title={`Class ${classNumber(c)} IMO mock test`} level="Full syllabus" minutes={mock.minutes} sections={sections} marking="1 mark for each question, 3 marks in the Achievers Section. No negative marking." />
    </MarketShell>
  );
}
