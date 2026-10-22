import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketShell } from "@/components/market/shell";
import MockTest, { type MockSec } from "@/components/lms/MockTest";
import { chapter, exam, render, subjectIndex } from "@/lib/lms/content";

type P = { params: Promise<{ exam: string; subject: string; chapter: string; testId: string }> };
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

async function load(params: P["params"]) {
  const p = await params;
  const ex = exam(clean(p.exam));
  const subject = clean(p.subject);
  const ch = ex ? chapter(ex, subject, clean(p.chapter)) : null;
  const test = ch?.mock_tests.find((t) => t.id === clean(p.testId)) ?? null;
  const idx = ex ? subjectIndex(ex, subject) : null;
  return { ex, ch, test, idx };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { ex, ch, test } = await load(params);
  if (!ex || !ch || !test) return { title: "Test not found | GrowQR", robots: { index: false, follow: true } };
  return { title: `${ch.title}: ${test.title} (${ex.title}) | GrowQR`, description: `Timed ${ex.title} mock test on ${ch.title}, ${test.time_limit_minutes} minutes, with worked solutions.`, robots: { index: true, follow: true } };
}

export default async function TestPage({ params }: P) {
  const { ex, ch, test, idx } = await load(params);
  if (!ex || !ch || !test || !idx) notFound();
  const sections: MockSec[] = test.sections.map((s) => ({
    type: s.type,
    title: s.title,
    questions: s.questions.map((q) => ({
      q: render(q.q),
      options: q.options?.map((o) => render(o)),
      correct: q.correct,
      answer: q.answer,
      explanation: render(q.explanation),
    })),
  }));
  return (
    <MarketShell user={null} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href={`/learn/${ex.slug}`} className="underline">{ex.title}</Link> / <Link href={`/learn/${ex.slug}/${idx.subject}`} className="underline">{idx.subject_label}</Link> / <Link href={`/learn/${ex.slug}/${idx.subject}/${ch.slug}#tests`} className="underline">{ch.title}</Link></nav>
      <MockTest id={test.id} title={`${ch.title}: ${test.title}`} level={test.level} minutes={test.time_limit_minutes} sections={sections} />
    </MarketShell>
  );
}
