"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, BookOpen, Briefcase, Building2, FileText, Gauge, Globe2, GraduationCap, Library, type LucideIcon } from "lucide-react";

/**
 * "Apps" menu of the main navigation: every GrowQR application (the former qrscore portal) in one place, on every page of the site.
 * Same look as the Solutions menu: pill button on desktop, accordion in the mobile menu.
 */
interface App { href: string; label: string; blurb: string; icon: LucideIcon; external?: boolean }

export const APPS: App[] = [
  { href: "/internships", label: "Internships", blurb: "Paid roles, verified employers, free to apply.", icon: Briefcase },
  { href: "/courses", label: "Courses", blurb: "Self-paced courses with a certificate and badge.", icon: BookOpen },
  { href: "/study-abroad", label: "Study Abroad", blurb: "Compare universities, costs and visas.", icon: Globe2 },
  { href: "/passport", label: "Skill Passport", blurb: "Your scored profile, shareable with a QR code.", icon: BadgeCheck },
  { href: "/studio", label: "Resume Studio", blurb: "45 resume formats with a live score.", icon: FileText },
  { href: "/resume-score", label: "Free Resume Score", blurb: "Your RQ Score out of 100 in 20 seconds.", icon: Gauge },
  { href: "/employer/post", label: "For Employers", blurb: "Post a role and hire vetted interns.", icon: Building2 },
  { href: "/go?c=nav&p=%2Fshop", label: "E-books", blurb: "Practice books for SAT, JEE, CAT, IMO and CTET.", icon: Library, external: true },
];

const COUNTRIES: Array<[string, string]> = [["usa", "USA"], ["uk", "UK"], ["canada", "Canada"], ["germany", "Germany"], ["australia", "Australia"], ["france", "France"], ["uae", "UAE"]];

const cls = (a: App) => ({ href: a.href, ...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) });
const ease = [0.22, 1, 0.36, 1] as const;

/** Whether the visitor has a portal session (name and role only), so the menu can offer Log in or My account. */
function usePortalUser(): { name: string; role: string } | null | undefined {
  const [u, setU] = useState<{ name: string; role: string } | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    fetch("/api/portal/me", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : { user: null })).then((j) => { if (live) setU(j.user ?? null); }).catch(() => { if (live) setU(null); });
    return () => { live = false; };
  }, []);
  return u;
}

function AccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const u = usePortalUser();
  if (u === undefined) return null;
  const a = "text-[14px] font-semibold text-ink-3 hover:text-orange transition-colors";
  return u ? (
    <div className="flex items-center gap-4"><Link href="/account" onClick={onNavigate} className={a}>My account ({u.name.split(" ")[0]})</Link></div>
  ) : (
    <div className="flex items-center gap-4"><Link href="/login" onClick={onNavigate} className={a}>Log in</Link><Link href="/signup" onClick={onNavigate} className={a}>Create a free account</Link></div>
  );
}

export function AppsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const show = () => { clear(); setOpen(true); };
  const hide = () => { clear(); timer.current = setTimeout(() => setOpen(false), 160); };

  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { clear(); setOpen(false); } };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { clear(); setOpen(false); } };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); clear(); };
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button" aria-haspopup="menu" aria-expanded={open}
        onClick={() => { clear(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 text-[15px] font-bold text-ink-3 px-5 py-2 rounded-full border border-black/[0.11] bg-white/60 transition-all hover:text-ink hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 tracking-tight"
      >
        Apps
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={{ duration: 0.18, ease }}
            onMouseEnter={show} onMouseLeave={hide}
            className="absolute top-[calc(100%+12px)] right-0 w-[min(92vw,720px)] bg-cream rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
          >
            <div className="p-3">
              <p className="px-3 pt-2 pb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">GrowQR apps</p>
              <div className="grid grid-cols-2 gap-1.5">
                {APPS.map((a) => (
                  <Link key={a.label} {...cls(a)} role="menuitem" onClick={() => setOpen(false)} className="flex items-start gap-3 p-2.5 rounded-2xl transition-colors duration-150 hover:bg-white group">
                    <span className="grid w-11 h-11 flex-shrink-0 place-items-center rounded-xl bg-white text-ink-3 ring-1 ring-black/[0.06] transition-colors duration-150 group-hover:bg-orange-lighter group-hover:text-orange group-hover:ring-orange/20">
                      <a.icon className="w-[21px] h-[21px]" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-[15.5px] font-bold text-ink leading-tight tracking-tight">{a.label}</span>
                      <span className="block text-[13px] font-medium text-ink-4 leading-snug mt-0.5">{a.blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-black/[0.07] bg-white/60 px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-3"><GraduationCap className="w-4 h-4" aria-hidden />Study in</span>
              {COUNTRIES.map(([k, n]) => <Link key={k} href={`/study-abroad/${k}`} onClick={() => setOpen(false)} className="text-[13.5px] font-semibold text-ink-3 hover:text-orange transition-colors">{n}</Link>)}
              <span className="ml-auto"><AccountLinks onNavigate={() => setOpen(false)} /></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppsMobile({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.06]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-[18px] text-[18px] font-bold tracking-[-0.01em] text-ink transition-opacity active:opacity-60">
        Apps
        <svg className={`w-[18px] h-[18px] text-ink-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pb-4">
          {APPS.map((a) => <Link key={a.label} {...cls(a)} onClick={onNavigate} className="py-[11px] text-[15.5px] font-medium tracking-[-0.005em] text-ink-3 transition-colors active:text-orange">{a.label}</Link>)}
          <div className="pt-3"><AccountLinks onNavigate={onNavigate} /></div>
        </div>
      )}
    </div>
  );
}
