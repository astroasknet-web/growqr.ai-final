import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketShell } from "@/components/market/shell";
import { hub, hubs, totalUnits } from "@/lib/market/exam-prep";

type P = { params: Promise<{ slug: string }> };
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export function generateStaticParams() { return hubs().map((h) => ({ slug: h.slug })); }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const h = hub(clean((await params).slug));
  if (!h) return { title: "Exam prep | GrowQR", robots: { index: false, follow: true } };
  return { title: `${h.title}: Free Study Material and Mock Tests | GrowQR`, description: h.intro, alternates: { canonical: `/exam-prep/${h.slug}` } };
}

export default async function HubPage({ params }: P) {
  const h = hub(clean((await params).slug));
  if (!h) notFound();
  const primary = "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-orange-deep px-5 text-[15px] font-semibold text-white hover:bg-ink";
  const secondary = "inline-flex min-h-[44px] items-center rounded-lg border border-orange px-5 text-[15px] font-semibold text-orange-deep hover:bg-orange-lighter";
  const study = h.learn ?? (h.studyMap ? "/study" : null);
  return (
    <MarketShell user={null} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href="/" className="underline">Home</Link> / <Link href="/exam-prep" className="underline">Exam prep</Link> / {h.title}</nav>
      <p className="text-[0.74rem] font-bold uppercase tracking-wider text-orange-dark">{h.kind}</p>
      <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]">{h.title}</h1>
      <p className="mt-2 max-w-3xl text-[16px] text-ink-3">{h.intro}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {study ? <Link href={study} className={primary}>Start studying</Link> : null}
        {h.mock ? <Link href={h.mock} className={study ? secondary : primary}>Take a free mock test</Link> : null}
        <Link href="/exam-prep" className="inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] px-5 text-[15px] font-semibold hover:bg-cream-2">All exams</Link>
      </div>
      {!study && !h.mock ? <p className="mt-4 text-[14px] text-ink-3">Study material and practice tests for this exam are coming soon.</p> : null}

      <h2 className="mt-10 text-[20px] font-bold text-ink">What is covered{totalUnits(h) ? ` (${totalUnits(h)} ${h.unit})` : ""}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {h.sections.map((s) => {
          const body = (
            <>
              <span className="flex items-start justify-between gap-3"><b className="text-[15px] text-ink">{s.name}</b>{s.count ? <span className="shrink-0 rounded-full bg-cream-3 px-2.5 py-0.5 text-[12px] text-ink-3">{s.count}</span> : null}</span>
              <span className="mt-1 block text-[14px] leading-relaxed text-ink-3">{s.desc}</span>
            </>
          );
          return <li key={s.name}>{s.own ? <Link href={s.own} className="block h-full rounded-xl border border-black/[0.08] bg-white p-4 transition hover:border-orange">{body}</Link> : <div className="h-full rounded-xl border border-black/[0.08] bg-white p-4">{body}</div>}</li>;
        })}
      </ul>

      {h.tests.length ? (
        <>
          <h2 className="mt-10 text-[20px] font-bold text-ink">Practice and mock tests</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {h.tests.map((t) => (
              <li key={t.name}><Link href={t.own} className="block h-full rounded-xl border border-black/[0.08] bg-white p-4 transition hover:border-orange"><b className="text-[15px] text-ink">{t.name}</b><span className="mt-1 block text-[14px] text-ink-3">{t.desc}</span></Link></li>
            ))}
          </ul>
        </>
      ) : null}
    </MarketShell>
  );
}
