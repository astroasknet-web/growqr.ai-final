"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneFrame, usePrefersReducedMotion } from "./ui";
import { SCENES } from "./Screens";

/** Pinned phone on the right; text steps scroll on the left and drive the screen. Stacks on mobile. */
export function PinnedStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  const A = SCENES[active].C;
  return (
    <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr,420px] lg:gap-20">
      <ol>
        {SCENES.map((s, i) => {
          const S = s.C;
          return (
            <li key={s.k} ref={(el) => { refs.current[i] = el; }} data-i={i} className="flex min-h-[auto] flex-col justify-center py-10 lg:min-h-[78vh] lg:py-0">
              <span className={`mb-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition ${active === i ? "border-orange bg-orange text-white" : "border-black/10 bg-white text-ink-4"}`}>0{i + 1} · {s.k}</span>
              <h3 className={`mb-4 max-w-[16ch] font-sans text-[clamp(1.9rem,3.6vw,3rem)] font-semibold leading-[1.08] transition-opacity duration-500 ${active === i || reduce ? "opacity-100" : "lg:opacity-30"}`}>{s.t}</h3>
              <p className={`max-w-[32em] text-[1.08rem] leading-relaxed text-ink-3 transition-opacity duration-500 ${active === i || reduce ? "opacity-100" : "lg:opacity-30"}`}>{s.d}</p>
              <div className="mt-8 lg:hidden"><PhoneFrame><S /></PhoneFrame></div>
            </li>
          );
        })}
      </ol>
      <div className="relative hidden lg:block">
        <div className="sticky top-[calc(50vh-340px)] pt-6">
          <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/25 blur-[90px]" />
          <PhoneFrame><A key={active} /></PhoneFrame>
          <div className="mt-6 flex justify-center gap-2" aria-hidden>
            {SCENES.map((s, i) => (<span key={s.k} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-orange" : "w-1.5 bg-black/20"}`} />))}
          </div>
        </div>
      </div>
    </div>
  );
}
