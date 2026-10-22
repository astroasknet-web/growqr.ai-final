import type { Metadata } from "next";
import Link from "next/link";
import { MarketShell } from "@/components/market/shell";
import { CLASSES, IMO_SECTIONS, classNumber, subject } from "@/lib/lms/school";

export const metadata: Metadata = {
  title: "Free Maths Olympiad (IMO) Preparation, Class 1 to 12 | GrowQR",
  description: "Free IMO preparation for every class: chapter lessons, in-lesson checks, chapter tests and full-syllabus mock tests across Logical Reasoning, Mathematical Reasoning, Everyday Mathematics and the Achievers Section.",
  alternates: { canonical: "/olympiad/imo" },
};

export default function ImoHome() {
  return (
    <MarketShell user={null} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href="/exam-prep" className="underline">Exam prep</Link> / Maths Olympiad</nav>
      <h1 className="font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-semibold text-ink">Maths Olympiad (IMO), Class 1 to 12</h1>
      <p className="mt-2 max-w-[46em] text-ink-3">Free preparation for every class: chapter lessons, in-lesson checks, chapter tests, and full-syllabus mock tests sectioned like the real olympiad.</p>
      <ul className="mt-4 flex flex-wrap gap-2">{IMO_SECTIONS.map((s) => <li key={s.key} className="rounded-full bg-cream-3 px-3 py-1 text-[13px] text-ink-2">{s.label}</li>)}</ul>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CLASSES.map((c) => {
          const s = subject(c, "imo");
          return (
            <li key={c}>
              <Link href={`/olympiad/imo/${c}`} className="block h-full rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
                <h2 className="text-[1.15rem] font-semibold text-ink">Class {classNumber(c)}</h2>
                <p className="mt-2 text-[0.85rem] text-ink-3">{s ? `${s.chapters.length} chapters · full mock test` : "Coming soon"}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </MarketShell>
  );
}
