"use client";

import { useEffect, useState } from "react";

/**
 * Reading helpers for a blog post: a thin progress bar under the site header, and a contents list whose current section follows the reader.
 * Both are progressive: without JavaScript the list is a normal list of anchors and the bar is simply absent.
 */
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

export function ReadingProgress({ targetId }: { targetId: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    document.documentElement.classList.add("blog-scroll");
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.getElementById(targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setPct(total > 0 ? Math.min(100, Math.max(0, (-r.top / total) * 100)) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); document.documentElement.classList.remove("blog-scroll"); };
  }, [targetId]);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div className="h-full origin-left bg-orange-deep" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TocSpy({ items, label }: { items: Array<{ id: string; text: string }>; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const pick = () => {
      const line = window.innerHeight * 0.28;
      let cur = els[0].id;
      for (const e of els) if (e.getBoundingClientRect().top - line <= 0) cur = e.id;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1].id;
      setActive(cur);
    };
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pick(); }); };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [items]);
  return (
    <nav aria-label={label}>
      <ol className="space-y-0.5 border-l border-black/[0.1] text-[13.5px] leading-snug">
        {items.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <a href={`#${t.id}`} title={t.text} aria-current={on ? "location" : undefined} className={`-ml-px block truncate border-l-2 py-0.5 pl-3 transition-colors ${on ? "border-orange-deep font-semibold text-ink" : "border-transparent text-ink-2 hover:border-black/30 hover:text-ink"} ${focus}`}>{t.text}</a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
