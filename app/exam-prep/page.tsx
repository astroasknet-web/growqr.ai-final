import type { Metadata } from "next";
import Link from "next/link";
import { MarketShell } from "@/components/market/shell";
import { catalogue, hubs, totalUnits } from "@/lib/market/exam-prep";

export const metadata: Metadata = {
  title: "Free Exam Prep: JEE, NEET, UPSC, SSC, CAT, SAT, GRE, GMAT, IELTS | GrowQR",
  description: "Free study material, chapter lists and mock tests for JEE, NEET, UPSC, SSC CGL, CAT, SAT, GRE, GMAT, IELTS, AP Calculus and the Maths Olympiad.",
  alternates: { canonical: "/exam-prep" },
};

export default function ExamPrepPage() {
  const groups = Array.from(new Set(catalogue().map((c) => c.group)));
  return (
    <MarketShell user={null} active="courses">
      <h1 className="font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-semibold text-ink">Exam prep and free courses</h1>
      <p className="mt-2 max-w-[46em] text-ink-3">Free lessons, study material and mock tests for school, entrance exams, government jobs and study abroad. Everything runs right here, with no sign-up needed.</p>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.92rem]"><Link href="/study" className="font-semibold text-orange-deep underline">Study courses: CAT, SAT, GRE, SSC CGL, CTET</Link><Link href="/learn/jee" className="font-semibold text-orange-deep underline">JEE</Link><Link href="/learn/neet" className="font-semibold text-orange-deep underline">NEET</Link><Link href="/learn/ap-calculus-ab" className="font-semibold text-orange-deep underline">AP Calculus AB</Link><Link href="/school" className="font-semibold text-orange-deep underline">School, Class 1 to 12</Link><Link href="/olympiad/imo" className="font-semibold text-orange-deep underline">Maths Olympiad</Link><Link href="/ielts" className="font-semibold text-orange-deep underline">IELTS</Link><Link href="/vedic-math" className="font-semibold text-orange-deep underline">Vedic Mathematics</Link></p>

      <h2 className="mt-10 text-[1.3rem] font-bold text-ink">Exam preparation</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hubs().map((h) => (
          <li key={h.slug}>
            <Link href={`/exam-prep/${h.slug}`} className="group block h-full rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-orange-dark">{h.kind}</p>
              <h3 className="mt-1 text-[1.1rem] font-semibold text-ink">{h.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-3">{h.intro}</p>
              <p className="mt-3 text-[0.8rem] text-ink-4">{h.sections.length} {h.sections.length === 1 ? "section" : "sections"}{totalUnits(h) ? ` · ${totalUnits(h)} ${h.unit}` : ""}{h.tests.length ? ` · ${h.tests.length} ${h.tests.length === 1 ? "test" : "tests"}` : ""}</p>
            </Link>
          </li>
        ))}
      </ul>

      {groups.map((g) => (
        <section key={g} className="mt-10" aria-label={g}>
          <h2 className="text-[1.3rem] font-bold text-ink">{g}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue().filter((c) => c.group === g).map((c) => (
              <li key={c.title}>
                {c.own
                  ? <Link href={c.own} className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 py-3.5 transition hover:border-orange"><span className="font-semibold text-ink">{c.title}</span></Link>
                  : <span className="flex items-center justify-between rounded-xl border border-dashed border-black/[0.12] px-4 py-3.5"><span className="font-semibold text-ink-3">{c.title}</span><span className="text-[0.78rem] text-ink-4">Coming soon</span></span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </MarketShell>
  );
}
