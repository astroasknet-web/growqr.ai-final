import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketShell } from "@/components/market/shell";
import MockTest from "@/components/lms/MockTest";
import { loadExam, testSections } from "@/lib/lms/exams";

type P = { params: Promise<{ slug: string; paper: string }> };
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await params;
  const d = loadExam(clean(p.slug));
  const t = d?.tests.find((x) => x.key === clean(p.paper));
  if (!d || !t) return { title: "Test not found | GrowQR", robots: { index: false, follow: true } };
  return { title: `${d.raw.meta.name} ${t.name}: Free Online Mock Test | GrowQR`, description: `${t.questions} questions, ${t.marks} marks, ${t.minutes} minutes. ${t.marking} Worked explanations after you submit.`.slice(0, 160), alternates: { canonical: `/exam/${d.slug}/test/${t.key}` } };
}

export default async function ExamTestPage({ params }: P) {
  const p = await params;
  const d = loadExam(clean(p.slug));
  const data = d ? testSections(d, clean(p.paper)) : null;
  if (!d || !data) notFound();
  const { test, sections } = data;
  return (
    <MarketShell user={null} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href="/exam-prep" className="underline">Exam prep</Link> / <Link href={`/exam/${d.slug}`} className="underline">{d.raw.meta.name}</Link> / {test.name}</nav>
      <MockTest id={`exam-${d.slug}-${test.key}`} title={`${d.raw.meta.name}: ${test.name}`} level={test.role} minutes={test.minutes} sections={sections} marking={test.marking} note={test.note} />
    </MarketShell>
  );
}
