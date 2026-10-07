import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { PortalUser } from "@/lib/portal/session";
import { LogoutButton } from "./forms";

/** Page frame for signed-in portal pages: logo, a small menu, and a content column. */
const NAV = [
  { key: "account", href: "/account", label: "My account" },
  { key: "passport", href: "/passport", label: "Skill Passport" },
  { key: "studio", href: "/studio", label: "Resume Studio" },
  { key: "internships", href: "/internships", label: "Internships" },
  { key: "applications", href: "/applications", label: "My applications" },
  { key: "courses", href: "/my-courses", label: "My courses" },
  { key: "abroad", href: "/abroad", label: "Study abroad" },
  { key: "share", href: "/passport/share", label: "Share" },
] as const;

export function PortalPage({ user, active, title, subtitle, children, wide = false }: { user: PortalUser; active: string; title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean | "full" }) {
  const EMPLOYER_NAV = [NAV[0], { key: "employer", href: "/employer", label: "Hiring" }, { key: "post", href: "/employer/post", label: "Post a role" }] as const;
  const STAFF_NAV = [NAV[0], { key: "crm", href: "/crm", label: "Overseas CRM" }] as const;
  const COUNSELOR_NAV = [...STAFF_NAV, { key: "caseload", href: "/counselor", label: "My caseload" }] as const;
  const ADMIN_NAV = [...STAFF_NAV, { key: "console", href: "/console", label: "Admin console" }] as const;
  const links = user.role === "student" ? NAV : user.role === "employer" ? EMPLOYER_NAV : user.role === "admin" ? ADMIN_NAV : user.role === "counselor" ? COUNSELOR_NAV : NAV.filter((n) => n.key === "account");
  return (
    <div className="min-h-screen bg-cream-2">
      <header className="bg-white border-b border-black/[0.08]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="GrowQR home" className="shrink-0">
            <Image src="/growqr-logo.png" alt="GrowQR" width={120} height={34} className="h-8 w-auto" priority />
          </Link>
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {links.map((n) => (
              <Link key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined} className={`min-h-[44px] inline-flex items-center px-3 rounded-lg text-[14px] font-medium whitespace-nowrap ${active === n.key ? "bg-orange-light text-orange-deep" : "text-ink-3 hover:bg-cream-2"}`}>
                {n.label}
              </Link>
            ))}
            <LogoutButton className="min-h-[44px] px-3 rounded-lg text-[14px] font-medium text-ink-3 hover:bg-cream-2" />
          </nav>
        </div>
      </header>
      <main id="main" className={`mx-auto ${wide === "full" ? "max-w-7xl" : wide ? "max-w-5xl" : "max-w-3xl"} px-4 sm:px-6 py-8 sm:py-10`}>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">{title}</h1>
        {subtitle ? <p className="text-[15px] text-ink-3 mt-1.5 mb-7">{subtitle}</p> : <div className="mb-7" />}
        {children}
      </main>
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7 mb-6 ${className}`}>
      {title ? <h2 className="text-[18px] font-semibold text-ink mb-4">{title}</h2> : null}
      {children}
    </section>
  );
}

/** A 0-100 ring. */
export function ScoreRing({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 shrink-0" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#EFEEE8" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#FF6A2F" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[34px] font-bold text-ink">{Math.round(v)}</span>
    </div>
  );
}

export function Bars({ items }: { items: Array<{ name: string; percent: number }> }) {
  return (
    <ul className="space-y-3" aria-label="Score by section">
      {items.map((s) => {
        const p = Math.max(0, Math.min(100, Math.round(s.percent)));
        return (
          <li key={s.name} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] sm:grid-cols-[12rem_1fr_3rem] items-center gap-3 text-[14px]">
            <span className="text-ink-2 truncate">{s.name}</span>
            <span className="h-2.5 rounded-full bg-cream-3 overflow-hidden" aria-hidden><i className="block h-full rounded-full bg-orange" style={{ width: `${p}%` }} /></span>
            <b className="text-right text-ink">{p}%</b>
          </li>
        );
      })}
    </ul>
  );
}
