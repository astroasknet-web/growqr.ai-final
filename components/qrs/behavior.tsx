"use client";

import { useEffect } from "react";

/** Header behaviour of the original site (nav.js + the mobile menu part of home.js): mega-menu opens on hover, click or keyboard; burger toggles the menu. */
export function QrsBehavior() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, ev: string, fn: (e: Event) => void) => { t.addEventListener(ev, fn); cleanups.push(() => t.removeEventListener(ev, fn)); };
    const desktop = window.matchMedia("(min-width: 1024px) and (hover: hover)");

    document.querySelectorAll<HTMLElement>(".qrs .has-mega").forEach((box) => {
      const btn = box.querySelector<HTMLButtonElement>(".mega-btn");
      if (!btn) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const open = () => { clearTimeout(timer); box.classList.add("open"); btn.setAttribute("aria-expanded", "true"); };
      const close = () => { box.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
      on(btn, "click", () => (box.classList.contains("open") ? close() : open()));
      on(box, "mouseenter", () => { if (desktop.matches) open(); });
      on(box, "mouseleave", () => { if (desktop.matches) timer = setTimeout(close, 180); });
      on(box, "focusout", (e) => { const r = (e as FocusEvent).relatedTarget as Node | null; if (r && !box.contains(r)) close(); });
      on(document, "keydown", (e) => { if ((e as KeyboardEvent).key === "Escape" && box.classList.contains("open")) { close(); btn.focus(); } });
      on(document, "click", (e) => { if (!box.contains(e.target as Node)) close(); });
    });

    const burger = document.getElementById("burger");
    const menu = document.getElementById("menu");
    if (burger && menu) {
      const set = (open: boolean) => { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
      on(burger, "click", () => set(!menu.classList.contains("open")));
      menu.querySelectorAll("a").forEach((a) => on(a, "click", () => set(false)));
      on(document, "keydown", (e) => { if ((e as KeyboardEvent).key === "Escape" && menu.classList.contains("open")) { set(false); burger.focus(); } });
    }
    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
