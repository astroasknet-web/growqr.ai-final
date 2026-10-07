"use client";

import { useEffect } from "react";

/** The home page's own behaviour from home.js: sample-listing filter (keyword, location, field), and the "how it works" audience toggle. */
export function QrsHomeBehavior() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, ev: string, fn: (e: Event) => void) => { t.addEventListener(ev, fn); cleanups.push(() => t.removeEventListener(ev, fn)); };
    const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s);
    const $$ = <T extends HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s));

    const jobs = $$("#jobs .job");
    const status = $("#status");
    const empty = $("#empty");
    const q = $<HTMLInputElement>("#q");
    const loc = $<HTMLSelectElement>("#loc");
    const tabs = $$<HTMLButtonElement>("#tabs button");
    const state = { cat: "" };
    const apply = () => {
      if (!q || !loc) return;
      const term = q.value.trim().toLowerCase();
      let shown = 0;
      jobs.forEach((j) => {
        const ok = (!term || (j.dataset.text ?? "").includes(term)) && (!loc.value || j.dataset.loc === loc.value) && (!state.cat || j.dataset.cat === state.cat);
        j.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (status) status.textContent = `${shown}${shown === 1 ? " role" : " roles"} shown`;
    };
    const setCat = (cat: string) => { state.cat = cat; tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.cat === cat))); apply(); };
    const jump = () => $("#internships")?.scrollIntoView({ behavior: "smooth" });

    if (jobs.length && q && loc) {
      tabs.forEach((t) => on(t, "click", () => setCat(t.dataset.cat ?? "")));
      $$(".cat").forEach((c) => on(c, "click", () => setCat(c.dataset.cat ?? "")));
      const form = $("#search");
      if (form) on(form, "submit", (e) => { e.preventDefault(); apply(); jump(); });
      $$<HTMLButtonElement>("#chips button").forEach((b) => on(b, "click", () => {
        if (b.dataset.q) { q.value = b.dataset.q; loc.value = ""; }
        if (b.dataset.loc) { loc.value = b.dataset.loc; q.value = ""; }
        apply(); jump();
      }));
      on(q, "input", apply);
      on(loc, "change", apply);
      apply();
    }

    const seg = $$<HTMLButtonElement>("#seg button");
    const lists = $$<HTMLElement>(".steps");
    seg.forEach((b) => on(b, "click", () => {
      seg.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      lists.forEach((l) => { l.hidden = l.dataset.aud !== b.dataset.aud; });
    }));
    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
