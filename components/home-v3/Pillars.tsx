import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { VERTICALS as ALL, type Vertical } from "./data";
import { COUNTRIES } from "@/components/home-options/data";

const ORDER = ["resume", "internships", "courses", "abroad", "classes", "math", "writing", "ebooks"];
const VERTICALS = ORDER.map((k) => ALL.find((v) => v.key === k)!);

/** Asymmetric bento: Resume Studio and Overseas Education are featured, the rest are compact. */
const SPAN: Record<string, string> = {
  resume: "md:col-span-3 md:row-span-2",
  internships: "md:col-span-3",
  courses: "md:col-span-3",
  abroad: "md:col-span-4",
  classes: "md:col-span-2",
  ebooks: "md:col-span-6",
};

function Visual({ v }: { v: Vertical }) {
  if (v.key === "resume")
    return (
      <div className="mt-6 grid grid-cols-[1fr,1.1fr] gap-3" aria-hidden>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 opacity-70"><span className="block h-2 w-14 rounded bg-slate-400" />{[0, 1, 2, 3, 4].map((i) => <span key={i} className="block h-1.5 rounded bg-slate-300" />)}<p className="pt-1 text-[0.62rem] font-semibold text-slate-400">BEFORE</p></div>
        <div className="space-y-2 rounded-xl border-2 border-[var(--v)] bg-white p-3 shadow-lg"><span className="block h-2.5 w-16 rounded bg-[#0b1020]" />{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`block h-1.5 rounded ${i % 2 ? "bg-[var(--v2)]" : "bg-slate-300"}`} />)}<p className="pt-1 text-[0.62rem] font-semibold text-[var(--v)]">AFTER</p></div>
      </div>
    );
  if (v.key === "abroad")
    return (
      <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-1.5 text-[0.88rem]" aria-label="Study destinations">
        {COUNTRIES.map((c) => <li key={c.name} className="flex justify-between border-b border-slate-200 py-1.5"><span className="font-semibold text-[#171a2b]">{c.name}</span><span className="text-[var(--hx-muted)]">{c.count} universities</span></li>)}
      </ul>
    );
  if (v.key === "ebooks")
    return (
      <div className="hidden gap-2 md:flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-16 w-11 rounded-sm bg-gradient-to-b from-[var(--v)] to-[var(--v2)] shadow-md" style={{ opacity: 1 - i * 0.15 }} />)}
      </div>
    );
  return null;
}

export default function Pillars() {
  return (
    <section id="pillars" className="scroll-mt-24 bg-[var(--hx-soft)] px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-pillars">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-14 max-w-[760px] text-center">
          <h2 data-rv id="hx-pillars" className="text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.06] tracking-tight text-[var(--hx-text)]">Everything You Need to <span className="hx-grad-text">Move Forward.</span></h2>
          <p data-rv className="mt-4 text-[1.08rem] leading-relaxed text-[var(--hx-muted)]">One connected ecosystem for learning, career growth, and global opportunities.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-6">
          {VERTICALS.map((v, i) => {
            const Icon = v.icon;
            const body = (
              <>
                <span className="hx-chip"><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-5 text-[1.3rem] font-semibold text-[var(--hx-text)]">{v.name}</h3>
                <p className="mt-1 text-[1.02rem] font-medium text-[var(--hx-text)]">{v.headline}</p>
                <p className="mt-2 max-w-[34em] text-[0.92rem] leading-relaxed text-[var(--hx-muted)]">{v.blurb}</p>
                <Visual v={v} />
                <span className="mt-6 inline-flex items-center gap-1.5 text-[0.92rem] font-semibold text-[var(--hx-text)] group-hover:text-[var(--v)]">{v.cta} <ArrowUpRight className="h-4 w-4" aria-hidden /></span>
              </>
            );
            const cls = `hx-tile group flex h-full flex-col p-7 hx-v-${v.key} ${v.key === "ebooks" ? "md:flex-row md:items-center md:justify-between md:gap-10" : ""}`;
            return (
              <li key={v.key} data-rv style={{ ["--d" as string]: `${i * 0.05}s` }} className={SPAN[v.key]}>
                {v.external
                  ? <a href={v.href} target="_blank" rel="noopener noreferrer" className={cls}><div>{body}</div></a>
                  : <Link href={v.href} className={cls}><div>{body}</div></Link>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
