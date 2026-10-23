import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hubs } from "@/lib/market/exam-prep";

/** Points the course catalogue at the free exam-prep hubs (JEE, NEET, UPSC, ...). */
export default function ExamPrepBanner() {
  return (
    <Link href="/exam-prep" className="group mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
      <span>
        <b className="block text-[1.05rem] text-ink">Free exam prep: JEE, NEET, UPSC, SSC, CAT, SAT, GRE, GMAT, IELTS and more</b>
        <span className="mt-1 block text-[0.88rem] text-ink-3">{hubs().length} exam hubs with chapters and mock tests, free and right here.</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-orange-deep">Explore exam prep <ArrowRight className="h-4 w-4" aria-hidden /></span>
    </Link>
  );
}
