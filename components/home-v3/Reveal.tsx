"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./home-v3.css";

/** Wraps the homepage: blocks marked data-rv fade up once they scroll into view. Content stays visible without JS. */
export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("rv-pre"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );
    root.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("rv-pre"); io.observe(el); }
    });
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`hx ${className}`}>{children}</div>;
}
