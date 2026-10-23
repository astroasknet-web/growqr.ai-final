"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { COMPARE, FAQ, PLANS, savingPercent } from "@/lib/market/plans";

const inr = (n: number): string => (n === 0 ? "₹0" : `₹${n.toLocaleString("en-IN")}`);

export default function PricingPlans() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="bg-cream-2">
      <section className="mx-auto max-w-[1180px] px-5 pb-6 pt-28 text-center md:pt-36">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ink-4">Student packages</p>
        <h1 className="mx-auto mt-3 max-w-[18em] text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.08] tracking-tight text-ink">
          Learn free. Pay only when you want more.
        </h1>
        <p className="mx-auto mt-4 max-w-[34em] text-[1.05rem] leading-relaxed text-ink-3">
          Four simple packages, priced for students. Start free, and upgrade when you are ready.
        </p>

        <div role="group" aria-label="Billing period" className="mx-auto mt-8 inline-flex rounded-full border border-black/10 bg-white p-1 text-[0.92rem] font-medium">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)} className={`min-h-[40px] rounded-full px-5 transition ${!yearly ? "bg-ink text-white" : "text-ink-3"}`}>Monthly</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)} className={`min-h-[40px] rounded-full px-5 transition ${yearly ? "bg-ink text-white" : "text-ink-3"}`}>
            Yearly <span className={`ml-1 text-[0.78rem] ${yearly ? "text-emerald-300" : "text-emerald-600"}`}>save 33%</span>
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Packages">
        {PLANS.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          const per = p.monthly === 0 ? "forever" : yearly ? "per year" : "per month";
          const perMonth = yearly && p.yearly ? Math.round(p.yearly / 12) : 0;
          return (
            <article key={p.key} style={p.badge ? { borderColor: p.accent, ["--tw-ring-color" as string]: p.accent } : undefined} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${p.badge ? "ring-2" : "border-black/10"}`}>
              {p.badge ? <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[0.72rem] font-semibold text-white" style={{ background: p.accent }}>{p.badge}</span> : null}
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: p.accent }} />
                <h2 className="text-[1.25rem] font-semibold text-ink">{p.name}</h2>
              </div>
              <p className="mt-2 min-h-[2.8em] text-[0.92rem] leading-snug text-ink-3">{p.tagline}</p>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[2.6rem] font-semibold leading-none tracking-tight text-ink">{inr(price)}</span>
                <span className="text-[0.9rem] text-ink-4">{per}</span>
              </p>
              <p className="mt-1 h-5 text-[0.82rem] text-emerald-700">
                {perMonth ? `Just ${inr(perMonth)} a month · save ${savingPercent(p)}%` : p.monthly === 0 ? "No card needed" : ""}
              </p>

              <Link
                href={p.key === "free" ? "/signup" : `/signup?plan=${p.key}`}
                className={`mt-5 inline-flex min-h-[46px] items-center justify-center rounded-xl px-5 text-[0.95rem] font-semibold transition ${p.key === "free" ? "border border-black/15 text-ink hover:bg-cream-2" : "bg-ink text-white hover:opacity-90"}`}
              >
                {p.cta}
              </Link>

              <div className="mt-6 border-t border-black/[0.07] pt-5">
                {p.inherits ? <p className="mb-3 text-[0.82rem] font-semibold text-ink">{p.inherits}</p> : <p className="mb-3 text-[0.82rem] font-semibold text-ink">Includes</p>}
                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f.text} className="flex gap-2.5 text-[0.9rem] leading-snug text-ink-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} aria-hidden />
                      <span>
                        {f.text}
                        {f.soon ? <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[0.68rem] font-semibold text-amber-800">Soon</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </section>

      <p className="mx-auto max-w-[44em] px-5 pb-10 text-center text-[0.85rem] text-ink-4">
        Early-access prices for students, in Indian rupees, taxes included. Items tagged <span className="font-semibold text-amber-800">Soon</span> are being built and will be added to your plan when they open.
      </p>


      <section className="mx-auto max-w-[1180px] px-5 pb-16" aria-labelledby="compare">
        <h2 id="compare" className="text-center text-[1.6rem] font-semibold text-ink">Compare packages</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="w-[34%] px-4 py-3 font-medium text-ink-4"><span className="sr-only">Feature</span></th>
                {PLANS.map((p) => (
                  <th key={p.key} scope="col" className="px-4 py-3 font-semibold text-ink">
                    <span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />{p.name}
                    <span className="block text-[0.8rem] font-normal text-ink-4">{p.monthly ? inr(yearly ? p.yearly : p.monthly) + (yearly ? "/yr" : "/mo") : "₹0"}</span>
                  </th>
                ))}
              </tr>
            </thead>
            {COMPARE.map((g) => (
              <tbody key={g.group}>
                <tr><th colSpan={5} scope="colgroup" className="bg-cream-2 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-ink-4">{g.group}</th></tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-t border-black/[0.06]">
                    <th scope="row" className="px-4 py-3 font-normal text-ink-2">
                      {r.label}{r.soon ? <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[0.66rem] font-semibold text-amber-800">Soon</span> : null}
                    </th>
                    {r.v.map((c, i) => (
                      <td key={i} className={`px-4 py-3 ${c === "–" ? "text-ink-5" : "font-medium text-ink"}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-[760px] px-5 pb-24">
        <h2 className="text-center text-[1.6rem] font-semibold text-ink">Questions</h2>
        <div className="mt-6 divide-y divide-black/[0.08] rounded-2xl border border-black/10 bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.98rem] font-medium text-ink">
                {f.q}
                <span aria-hidden className="text-ink-4 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-3">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-[0.9rem] text-ink-3">
          Questions about a plan? <Link href="/contact" className="font-medium text-ink underline">Talk to us</Link>. See the <Link href="/refund-policy" className="font-medium text-ink underline">refund policy</Link>.
        </p>
      </section>
    </div>
  );
}
