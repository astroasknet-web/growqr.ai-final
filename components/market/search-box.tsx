"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Item { type: string; label: string; sub: string; url: string }

/** The search box with type-ahead. Works as a plain GET form when JavaScript is off. */
export function SearchBox({ defaultValue, preserve }: { defaultValue: string; preserve: Record<string, string | string[]> }) {
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const listId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      try {
        const r = await fetch(`/api/internships/suggest?q=${encodeURIComponent(q.slice(0, 60))}`, { signal: abort.current.signal });
        if (!r.ok) return setItems([]);
        const j = (await r.json()) as { items: Item[] };
        setItems(j.items ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline: keep the box usable without suggestions */
      }
    }, 150);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const go = (i: Item) => {
    setOpen(false);
    router.push(i.url);
  };

  return (
    <form method="get" action="/internships" role="search" className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      {Object.entries(preserve).flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((x) => <input key={k + x} type="hidden" name={k} value={x} />))}
      <label htmlFor="q" className="sr-only">Search internships</label>
      <div className="flex gap-2">
        <input
          id="q" name="q" type="search" value={q} autoComplete="off" maxLength={80} placeholder="Search roles, skills or companies, e.g. python, design, wfh"
          role="combobox" aria-expanded={open && items.length > 0} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
            else if (e.key === "Enter" && active >= 0) { e.preventDefault(); go(items[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          className="flex-1 min-h-[48px] px-4 rounded-lg border border-black/[0.15] bg-white text-[16px] outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60"
        />
        <button type="submit" className="min-h-[48px] px-6 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Search</button>
      </div>
      {open && items.length > 0 ? (
        <ul id={listId} role="listbox" className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-black/[0.1] shadow-card overflow-hidden">
          {items.map((it, i) => (
            <li key={it.type + it.label} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(it)} className={`w-full text-left min-h-[44px] px-4 py-2 flex items-center justify-between gap-3 ${i === active ? "bg-cream-2" : "hover:bg-cream-2"}`}>
                <span className="text-[15px] text-ink">{it.label}</span>
                <span className="text-[12px] text-ink-4 whitespace-nowrap">{it.type === "did-you-mean" ? it.sub : `${it.type} · ${it.sub}`}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
