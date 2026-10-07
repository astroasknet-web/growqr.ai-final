"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import LogoutButton from "./LogoutButton";

interface Props { breadcrumb?: string }

const NAV = [
  {
    href: "/admin/ambassador",
    label: "Ambassadors",
    match: (p: string) => p.startsWith("/admin/ambassador"),
  },
  {
    href: "/admin/events",
    label: "Events",
    match: (p: string) =>
      p.startsWith("/admin/events") || p.startsWith("/admin/registrations"),
  },
  {
    href: "/admin/internship",
    label: "Internship",
    match: (p: string) => p.startsWith("/admin/internship"),
  },
  {
    href: "/admin/logs",
    label: "Activity",
    match: (p: string) => p.startsWith("/admin/logs"),
  },
] as const;

export default function AdminHeader({ breadcrumb: _breadcrumb }: Props = {}) {
  const pathname = usePathname() || "";

  /* Don't render on the login page — it has its own standalone layout */
  if (pathname === "/admin/login") return null;

  return (
    <header className="bg-white/[0.98] backdrop-blur-sm border-b border-black/[0.06] sticky top-0 z-40 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      {/* ── Main bar ── */}
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/admin/ambassador"
          className="shrink-0 flex items-center opacity-90 hover:opacity-100 transition-opacity duration-150"
        >
          <Image
            src="/growqr-logo.png"
            alt="GrowQR"
            width={110}
            height={32}
            className="h-[30px] w-auto"
            priority
          />
        </Link>

        {/* Desktop nav — absolutely centered so logo + logout float independently */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <nav
            className="flex items-center gap-0.5 pointer-events-auto"
            role="navigation"
            aria-label="Admin navigation"
          >
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-[15px] py-[7px] rounded-[10px] text-[14px] tracking-[-0.01em] transition-colors duration-150 select-none ${
                    active
                      ? "font-semibold text-ink"
                      : "font-medium text-ink-4 hover:text-ink-2"
                  }`}
                >
                  {/* Sliding active pill — framer-motion layoutId animates it
                      smoothly between links when navigating */}
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className="absolute inset-0 rounded-[10px] bg-black/[0.06]"
                      transition={{ type: "spring", duration: 0.35, bounce: 0.18 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center shrink-0">
          <LogoutButton />
        </div>
      </div>

      {/* ── Mobile nav (scrollable chip row) ── */}
      <nav
        className="md:hidden border-t border-black/[0.06] overflow-x-auto scrollbar-hide"
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="flex items-center gap-1 px-4 py-2.5 min-w-max">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? "bg-black/[0.06] text-ink"
                    : "text-ink-4 hover:text-ink-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
