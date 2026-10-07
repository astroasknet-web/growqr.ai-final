"use client";

import { useEffect } from "react";

/**
 * Loads the Studio's plain-JavaScript files (public/studio/*.js) in order, once per page visit. The scripts build and wire
 * the editor DOM themselves, so they must run after the server-rendered markup is in the page. A fresh <script> element is
 * created on every mount, so they also run when the student arrives by in-app navigation.
 */
export function StudioScripts({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    const added: HTMLScriptElement[] = [];
    let cancelled = false;
    const load = (i: number) => {
      if (cancelled || i >= srcs.length) return;
      const s = document.createElement("script");
      s.src = srcs[i];
      s.onload = () => load(i + 1);
      s.onerror = () => load(i + 1);
      document.body.appendChild(s);
      added.push(s);
    };
    load(0);
    return () => {
      cancelled = true;
      for (const s of added) s.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcs.join("|")]);
  return null;
}
