"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createLeadAction, type NewLeadState } from "@/app/(portal)/crm/actions";

const f = "w-full px-3 py-2.5 rounded-lg border border-black/[0.15] bg-white text-[15px] min-h-[44px]";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="min-h-[48px] px-6 rounded-lg bg-orange hover:bg-orange-dark disabled:opacity-60 text-white font-semibold text-[15px]">{pending ? "Saving..." : "Save lead"}</button>;
}

export function NewLeadForm({ countries, sources }: { countries: string[]; sources: Record<string, string> }) {
  const [s, action] = useActionState(createLeadAction, {} as NewLeadState);
  const v = s.values ?? {};
  const key = useMemo(() => Math.random(), [s]); // eslint-disable-line react-hooks/exhaustive-deps -- remount so the selects keep what was sent
  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label htmlFor={`n-${id}`} className="block text-[13px] font-medium text-ink-2 mb-1">{label}</label><input id={`n-${id}`} name={id} defaultValue={v[id] ?? ""} className={f} {...props} /></div>
  );
  return (
    <section id="new" className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 mb-6" aria-labelledby="nl-h">
      <h2 id="nl-h" className="text-[18px] font-semibold text-ink mb-3">Add a lead</h2>
      {s.error ? <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[14px] text-red-800">{s.error}{s.duplicate ? <> <Link className="underline font-medium" href={`/crm/leads/${s.duplicate.id}`}>Open {s.duplicate.name}</Link>, or tick the box below to create a separate lead.</> : null}</p> : null}
      <form action={action} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div key={key} className="contents">
          {field("name", "Name *", { required: true, maxLength: 120 })}
          {field("phone", "Phone / WhatsApp", { type: "tel", maxLength: 20 })}
          {field("email", "Email", { type: "email", maxLength: 190 })}
          {field("city", "City", { maxLength: 80 })}
          {field("qualification", "Qualification", { maxLength: 80, placeholder: "B.Tech, 12th, MBA..." })}
          {field("percentage", "Percentage / CGPA %", { inputMode: "decimal", maxLength: 6 })}
          <div><label htmlFor="n-pref_country" className="block text-[13px] font-medium text-ink-2 mb-1">Preferred country</label><select id="n-pref_country" name="pref_country" defaultValue={v.pref_country ?? ""} className={f}><option value="">Not decided</option>{countries.map((c) => <option key={c}>{c}</option>)}</select></div>
          {field("pref_course", "Preferred course", { maxLength: 120, placeholder: "MSc Computer Science" })}
          {field("intake", "Intake", { maxLength: 30, placeholder: "Sep 2027" })}
          {field("budget_inr", "Budget (INR)", { inputMode: "numeric", maxLength: 12, placeholder: "1500000" })}
          <div><label htmlFor="n-source" className="block text-[13px] font-medium text-ink-2 mb-1">Source</label><select id="n-source" name="source" defaultValue={v.source ?? "walk_in"} className={f}>{Object.entries(sources).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <input type="hidden" name="consent" value="1" />
          {s.duplicate ? <label className="sm:col-span-2 lg:col-span-3 flex items-center gap-2.5 min-h-[44px] text-[14px]"><input type="checkbox" name="force" value="1" />Create anyway, this is a different student</label> : null}
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex gap-3"><Submit /><Link href="/crm/leads" className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-black/[0.15] text-[15px] hover:bg-cream-2">Cancel</Link></div>
      </form>
    </section>
  );
}
