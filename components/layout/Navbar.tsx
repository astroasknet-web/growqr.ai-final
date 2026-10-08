"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  UserRound,
  Compass,
  Laptop,
  Building2,
  School,
  Rocket,
  UserSearch,
  type LucideIcon,
} from "lucide-react";
import { agents } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { personas } from "@/lib/personas";
import { useAuthFlag } from "@/lib/useAuthFlag";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useIsIndia, useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";
import { AppsDropdown, AppsMobile } from "@/components/layout/AppsMenu";

const ease = [0.22, 1, 0.36, 1] as const;

const allIndividualAgents = agents.filter((a) => a.type === "individual");
const allEnterpriseAgents = agents.filter((a) => a.type === "enterprise");

// Temporarily hide the desktop Agents dropdown. The mobile menu has its own
// always-visible Agents accordion (mode-aware: individual vs enterprise
// roster), independent of this flag. Flip to `true` to bring the desktop
// dropdown back.
const SHOW_AGENTS_NAV = false;

// Featured roster (curated order): Kai, Vera, Lyra, Mira, Nova, Scout, Sage
const FEATURED_AGENT_IDS = ["04", "03", "07", "02", "05", "01", "06"];
const agentsById = Object.fromEntries(allIndividualAgents.map((a) => [a.id, a]));
const FEATURED_AGENTS = FEATURED_AGENT_IDS.map((id) => agentsById[id]).filter(Boolean);

/** Roles are stored with a leading "The " (e.g. "The Resume Expert").
 *  Strip it for the inline "Name — Role" heading. */
const shortRole = (role: string) => role.replace(/^The\s+/i, "");

/** A clean, relevant icon per persona for the Solutions dropdown (replaces the
 *  portrait thumbnails so the menu reads as a crisp, professional list). */
const PERSONA_ICON: Record<string, LucideIcon> = {
  students: GraduationCap,
  professionals: UserRound,
  coaches: Compass,
  freelancers: Laptop,
  enterprises: Building2,
  institutes: School,
  recruiters: UserSearch,
  startups: Rocket,
};

const AGENT_BADGES: Record<string, { label: string; cls: string }> = {
  "RQ-Vera":  { label: "Trending", cls: "bg-green-500 text-white" },
  "RQ-Nova":  { label: "New!",     cls: "bg-orange text-white" },
  "RQ-Kai":   { label: "New!",     cls: "bg-orange text-white" },
};

// Short one-liners shown under each agent in the dropdown.
const AGENT_TAGLINE: Record<string, string> = {
  "RQ-Kai":   "Rehearse the hard conversations.",
  "RQ-Vera":  "Mock interviews, real feedback.",
  "RQ-Lyra":  "Only the learning worth your time.",
  "RQ-Mira":  "Resumes that beat the ATS.",
  "RQ-Nova":  "Own your online presence.",
  "RQ-Scout": "Finds and applies to matched jobs.",
  "RQ-Sage":  "Closes the skills holding you back.",
};

export default function Navbar({ hideUseCases = false }: { hideUseCases?: boolean } = {}) {
  // "Use Cases" dropdown swaps its persona set with the shared Hero toggle:
  // job-seeker (individual) personas vs organisation (enterprise) personas.
  const { mode } = useHomeMode();

  // When we're on a specific solution page (e.g. /solutions/startups), the
  // dropdown locks to that persona's set and marks it active — so a B2B page
  // shows only the B2B solutions with the current one highlighted, regardless
  // of the global toggle.
  const pathname = usePathname();
  const activePersona = personas.find((p) => p.link === pathname);
  // Agent subpages aren't persona pages, but they still belong to a side:
  // enterprise agent pages (/enterprise/*) show the B2B solutions, individual
  // agent pages (/ai-*) show the individual ones — mirroring the home toggle.
  const agentMode = pathname.startsWith("/enterprise/")
    ? "enterprise"
    : /^\/ai-/.test(pathname)
      ? "individual"
      : null;
  const effectiveMode = activePersona?.type ?? agentMode ?? mode;

  // Explicit order for the business/enterprise dropdown; individual mode keeps
  // the source order. Only reorders the nav, not the shared personas list.
  const ENTERPRISE_ORDER = ["enterprises", "institutes", "recruiters", "startups"];
  const useCasePersonas = (() => {
    const list = personas.filter((p) => p.type === effectiveMode);
    if (effectiveMode !== "enterprise") return list;
    return [...list].sort(
      (a, b) => ENTERPRISE_ORDER.indexOf(a.id) - ENTERPRISE_ORDER.indexOf(b.id),
    );
  })();

  // When logged in (cross-subdomain cookie), the primary CTA becomes
  // "Dashboard"; otherwise it drives new signups. Sign in stays either way.
  const loggedIn = useAuthFlag();
  const primaryCta = loggedIn
    ? { label: "Dashboard", href: "https://app.growqr.ai/home" }
    : { label: "Get Started", href: "https://app.growqr.ai/signup" };

  // Logged-out visitors in non-live markets open the shared waitlist modal.
  // The navbar uses business-facing "Book a Call" copy for that same flow.
  const isIndia = useIsIndia();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  const isNonLiveVisitor = !loggedIn && !isLive;
  // Experts, events and community are India-specific and stay out of the
  // international mobile navigation (US, UAE, UK, Ireland, and other markets).
  const indiaExploreLinks = isIndia
    ? [
        { href: "/experts", label: "Experts" },
        { href: "/events", label: "Events" },
        { href: "/community", label: "Community" },
      ]
    : [];

  const [scrolled,           setScrolled]           = useState(false);
  const [menuOpen,           setMenuOpen]            = useState(false);
  const [agentsOpen,         setAgentsOpen]          = useState(false);
  const [mobileAgentsOpen,   setMobileAgentsOpen]    = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [useCasesOpen,       setUseCasesOpen]        = useState(false);

  const agentsRef        = useRef<HTMLDivElement>(null);
  const agentsTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useCasesRef      = useRef<HTMLDivElement>(null);
  const useCasesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolledRef      = useRef(false);

  const clearAgentsTimer = () => {
    if (agentsTimerRef.current) {
      clearTimeout(agentsTimerRef.current);
      agentsTimerRef.current = null;
    }
  };
  const openAgents  = () => { clearAgentsTimer(); setAgentsOpen(true); };
  const closeAgents = () => {
    clearAgentsTimer();
    agentsTimerRef.current = setTimeout(() => setAgentsOpen(false), 160);
  };

  const clearUseCasesTimer = () => {
    if (useCasesTimerRef.current) {
      clearTimeout(useCasesTimerRef.current);
      useCasesTimerRef.current = null;
    }
  };
  const openUseCases  = () => { clearUseCasesTimer(); setUseCasesOpen(true); };
  const closeUseCases = () => {
    clearUseCasesTimer();
    useCasesTimerRef.current = setTimeout(() => setUseCasesOpen(false), 160);
  };

  // Scroll hysteresis
  useEffect(() => {
    const ENTER = 56, EXIT = 28;
    const apply = (next: boolean) => { scrolledRef.current = next; setScrolled(next); };
    const onScroll = () => {
      const y = window.scrollY;
      if (!scrolledRef.current && y > ENTER) { apply(true); return; }
      if (scrolledRef.current  && y < EXIT)  apply(false);
    };
    apply(window.scrollY > ENTER);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (scrollStateTimer.current) clearTimeout(scrollStateTimer.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Click-outside closes the dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (agentsRef.current && !agentsRef.current.contains(e.target as Node)) {
        clearAgentsTimer(); setAgentsOpen(false);
      }
      if (useCasesRef.current && !useCasesRef.current.contains(e.target as Node)) {
        clearUseCasesTimer(); setUseCasesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape closes the dropdowns
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearAgentsTimer(); setAgentsOpen(false);
      clearUseCasesTimer(); setUseCasesOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => () => { clearAgentsTimer(); clearUseCasesTimer(); }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/[0.92] backdrop-blur-[20px] saturate-[180%] border-b border-black/[0.08] shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto max-w-[1440px] px-6 md:px-14 h-[64px] flex items-center">
          {/* ── Mobile top bar ─────────────────────────────────────────── */}
          <div className="flex md:hidden w-full items-center justify-between">
            <Link
              href="/"
              aria-label="GrowQR — Agentic AI"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/growqr-logo.png"
                alt="GrowQR"
                width={400}
                height={200}
                priority
                className="h-[34px] w-auto select-none"
              />
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-black/[0.1] bg-white/70 text-ink transition-colors"
            >
              <span className="relative flex items-center justify-center w-4 h-4" aria-hidden>
                <span className={`absolute block w-4 h-[1.75px] rounded-full bg-current origin-center transition-all duration-300 ${menuOpen ? "rotate-45" : "-translate-y-[5px]"}`} />
                <span className={`absolute block w-4 h-[1.75px] rounded-full bg-current origin-center transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`absolute block w-4 h-[1.75px] rounded-full bg-current origin-center transition-all duration-300 ${menuOpen ? "-rotate-45" : "translate-y-[5px]"}`} />
              </span>
            </button>
          </div>

          {/* ── Desktop nav ────────────────────────────────────────────── */}
          <div className="hidden md:grid w-full grid-cols-[auto,1fr,auto] items-center">
            <Link
              href="/"
              aria-label="GrowQR — Agentic AI"
              className="col-start-1 flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/growqr-logo.png"
                alt="GrowQR"
                width={400}
                height={200}
                priority
                className="h-[34px] sm:h-[38px] w-auto select-none"
              />
            </Link>

            <div className="col-start-2" />

            <div className="col-start-3 justify-self-end flex items-center gap-2">

              {/* ── Apps menu: every GrowQR application, site-wide ──────── */}
              <AppsDropdown />

              {/* ── Use Cases dropdown ───────────────────────────────── */}
              {!hideUseCases && (
              <div
                ref={useCasesRef}
                className="relative"
                onMouseEnter={openUseCases}
                onMouseLeave={closeUseCases}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={useCasesOpen}
                  onClick={() => { clearUseCasesTimer(); setUseCasesOpen((v) => !v); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault(); clearUseCasesTimer(); setUseCasesOpen((v) => !v);
                    }
                    if (e.key === "Escape") setUseCasesOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-[15px] font-bold text-ink-3 px-5 py-2 rounded-full border border-black/[0.11] bg-white/60 transition-all hover:text-ink hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 tracking-tight"
                >
                  <span className={activePersona ? "text-orange" : undefined}>
                    {activePersona ? activePersona.navLabel : "Solutions"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${useCasesOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {useCasesOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.99 }}
                      transition={{ duration: 0.18, ease }}
                      onMouseEnter={openUseCases}
                      onMouseLeave={closeUseCases}
                      className="absolute top-[calc(100%+12px)] right-0 w-[min(90vw,480px)] bg-cream rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {useCasePersonas
                            .filter((persona) => persona.id !== activePersona?.id)
                            .map((persona) => {
                              const Icon = PERSONA_ICON[persona.id] ?? UserRound;
                              return (
                            <Link
                              key={persona.id}
                              href={persona.link}
                              role="menuitem"
                              onClick={() => setUseCasesOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-2xl transition-colors duration-150 hover:bg-white group"
                            >
                              <span className="grid w-11 h-11 flex-shrink-0 place-items-center rounded-xl bg-white text-ink-3 ring-1 ring-black/[0.06] transition-colors duration-150 group-hover:bg-orange-lighter group-hover:text-orange group-hover:ring-orange/20">
                                <Icon className="w-[21px] h-[21px]" strokeWidth={2} aria-hidden />
                              </span>
                              <span className="text-[15.5px] font-bold text-ink leading-tight tracking-tight">
                                {persona.navLabel}
                              </span>
                            </Link>
                              );
                            })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}

              {/* ── Agents dropdown — hidden for now ─────────────────── */}
              {SHOW_AGENTS_NAV && (
              <div
                ref={agentsRef}
                className="relative"
                onMouseEnter={openAgents}
                onMouseLeave={closeAgents}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={agentsOpen}
                  onClick={() => { clearAgentsTimer(); setAgentsOpen((v) => !v); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault(); clearAgentsTimer(); setAgentsOpen((v) => !v);
                    }
                    if (e.key === "Escape") setAgentsOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-[15px] font-bold text-ink-3 px-5 py-2 rounded-full border border-black/[0.11] bg-white/60 transition-all hover:text-ink hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 tracking-tight"
                >
                  Agents
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${agentsOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {agentsOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.99 }}
                      transition={{ duration: 0.18, ease }}
                      onMouseEnter={openAgents}
                      onMouseLeave={closeAgents}
                      className="absolute top-[calc(100%+12px)] right-0 w-[min(92vw,740px)] bg-cream rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-2">
                          {FEATURED_AGENTS.map((agent) => {
                            const badge = AGENT_BADGES[agent.name];
                            return (
                              <Link
                                key={agent.id}
                                href="/agents"
                                role="menuitem"
                                onClick={() => setAgentsOpen(false)}
                                className="flex items-start gap-4 p-4 rounded-2xl transition-colors duration-150 hover:bg-white group"
                              >
                                {/* Agent portrait — light tinted square */}
                                <div
                                  className="w-[64px] h-[64px] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: `${agent.color}1A` }}
                                >
                                  {agent.image ? (
                                    <Image
                                      src={agent.image}
                                      alt={agent.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover object-top"
                                    />
                                  ) : (
                                    <span className="text-xl font-bold" style={{ color: agent.color }}>
                                      {agent.initials}
                                    </span>
                                  )}
                                </div>

                                {/* Text block */}
                                <div className="pt-0.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[16.5px] font-bold text-ink leading-tight tracking-tight">
                                      <AgentName name={agent.name} />
                                      <span className="font-semibold text-ink-3"> - {shortRole(agent.role)}</span>
                                    </span>
                                    {badge && (
                                      <span className={`inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-md leading-none ${badge.cls}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[14px] font-medium text-ink-4 mt-1 leading-snug truncate">
                                    {AGENT_TAGLINE[agent.name] ?? shortRole(agent.role)}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}

                          {/* Final slot — Explore All CTA (matches agent card layout) */}
                          <Link
                            href="/agents"
                            role="menuitem"
                            onClick={() => setAgentsOpen(false)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-orange/[0.06] hover:bg-orange/[0.1] border border-orange/20 hover:border-orange/35 transition-colors group"
                          >
                            <div className="w-[64px] h-[64px] rounded-2xl bg-orange/10 flex-shrink-0 flex items-center justify-center">
                              <ArrowRight className="w-6 h-6 text-orange transition-transform duration-150 group-hover:translate-x-0.5" />
                            </div>
                            <div className="pt-0.5 min-w-0">
                              <p className="text-[16.5px] font-bold text-ink leading-tight tracking-tight">
                                All Agents
                              </p>
                              <p className="text-[14px] font-medium text-ink-4 mt-1 leading-snug">
                                Explore the full squad.
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}

              {!isNonLiveVisitor && (
                <>
                  {/* Divider */}
                  <span className="w-px h-5 bg-black/[0.1] mx-1" aria-hidden />

                  {/* Sign in — secondary, for returning users */}
                  <a
                    href="https://app.growqr.ai/login"
                    onClick={() =>
                      trackAppCta({
                        ctaLabel: "Sign in",
                        ctaLocation: "navbar_desktop",
                        destinationUrl: "https://app.growqr.ai/login",
                      })
                    }
                    className="text-[15px] font-bold text-ink-3 px-5 py-2 rounded-full border border-black/[0.11] bg-white/60 transition-all hover:text-ink hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 tracking-tight"
                  >
                    Sign in
                  </a>
                </>
              )}

              {/* Primary — Get Started/Dashboard in live markets; shared
                  waitlist popup for logged-out visitors in non-live markets. */}
              {isNonLiveVisitor ? (
                <button
                  type="button"
                  onClick={() => {
                    trackAppCta({
                      ctaLabel: "Book a Call",
                      ctaLocation: "navbar_desktop",
                      ctaAction: "waitlist",
                    });
                    openWaitlist("navbar");
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-orange px-5 py-2 text-[15px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(255,106,47,0.4)] transition-all hover:bg-orange-dark hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 focus-visible:ring-offset-2 tracking-tight"
                >
                  Book a Call
                </button>
              ) : (
                <a
                  href={primaryCta.href}
                  onClick={() =>
                    trackAppCta({
                      ctaLabel: primaryCta.label,
                      ctaLocation: "navbar_desktop",
                      destinationUrl: primaryCta.href,
                    })
                  }
                  className="inline-flex items-center justify-center rounded-full bg-orange px-5 py-2 text-[15px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(255,106,47,0.4)] transition-all hover:bg-orange-dark hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 focus-visible:ring-offset-2 tracking-tight"
                >
                  {primaryCta.label}
                </a>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile full-screen menu ───────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-40 flex flex-col pt-[64px] pb-8 px-5"
            style={{
              background: "radial-gradient(circle at top center, rgba(255,255,255,0.94) 0%, rgba(252,248,242,0.98) 100%)",
              backdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none opacity-50" />

            <div className="relative flex-1 flex flex-col overflow-y-auto no-scrollbar">

              {/* Agents — accordion, same roster as the desktop dropdown.
                  Role only (not the branded name) — that's what tells a
                  visitor what the agent actually does. */}
              <div className="border-b border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setMobileAgentsOpen((v) => !v)}
                  className="flex w-full items-center justify-between py-[18px] text-[18px] font-bold tracking-[-0.01em] text-ink transition-opacity active:opacity-60"
                >
                  Agents
                  <svg
                    className={`w-[18px] h-[18px] text-ink-4 transition-transform duration-300 ${mobileAgentsOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileAgentsOpen && (
                  <div className="flex flex-col gap-0.5 pb-4">
                    {(effectiveMode === "enterprise" ? allEnterpriseAgents : allIndividualAgents).map((agent) => (
                      <Link
                        key={agent.id}
                        href="/agents"
                        onClick={() => setMenuOpen(false)}
                        className="py-[11px] text-[15.5px] font-medium tracking-[-0.005em] text-ink-3 transition-colors active:text-orange"
                      >
                        {shortRole(agent.role)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Apps — accordion with every GrowQR application */}
              <AppsMobile onNavigate={() => setMenuOpen(false)} />

              {/* Solutions — accordion, mirrors the desktop dropdown's persona
                  list/order, hidden on the same non-persona pages. */}
              {!hideUseCases && (
              <div className="border-b border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setMobileSolutionsOpen((v) => !v)}
                  className="flex w-full items-center justify-between py-[18px] text-[18px] font-bold tracking-[-0.01em] text-ink transition-opacity active:opacity-60"
                >
                  Solutions
                  <svg
                    className={`w-[18px] h-[18px] text-ink-4 transition-transform duration-300 ${mobileSolutionsOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileSolutionsOpen && (
                  <div className="flex flex-col gap-0.5 pb-4">
                    {useCasePersonas
                      .filter((persona) => persona.id !== activePersona?.id)
                      .map((persona) => (
                        <Link
                          key={persona.id}
                          href={persona.link}
                          onClick={() => setMenuOpen(false)}
                          className="py-[11px] text-[15.5px] font-medium tracking-[-0.005em] text-ink-3 transition-colors active:text-orange"
                        >
                          {persona.navLabel}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
              )}

              {/* Flat links */}
              {indiaExploreLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-black/[0.06] py-[18px] text-[18px] font-bold tracking-[-0.01em] text-ink transition-opacity active:opacity-60"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="relative mt-6 pt-6 border-t border-black/[0.06] flex flex-col gap-3">
              {isNonLiveVisitor ? (
                <button
                  type="button"
                  onClick={() => {
                    trackAppCta({
                      ctaLabel: "Book a Call",
                      ctaLocation: "navbar_mobile",
                      ctaAction: "waitlist",
                    });
                    setMenuOpen(false);
                    openWaitlist("navbar-mobile");
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-orange px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(255,106,47,0.45)] transition-all active:scale-[0.98]"
                >
                  Book a Call
                </button>
              ) : (
                <a
                  href={primaryCta.href}
                  onClick={() => {
                    trackAppCta({
                      ctaLabel: primaryCta.label,
                      ctaLocation: "navbar_mobile",
                      destinationUrl: primaryCta.href,
                    });
                    setMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-orange px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(255,106,47,0.45)] transition-all active:scale-[0.98]"
                >
                  {primaryCta.label}
                </a>
              )}
              {!isNonLiveVisitor && (
                <a
                  href="https://app.growqr.ai/login"
                  onClick={() => {
                    trackAppCta({
                      ctaLabel: "Sign in",
                      ctaLocation: "navbar_mobile",
                      destinationUrl: "https://app.growqr.ai/login",
                    });
                    setMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full border border-black/[0.12] bg-white px-6 py-4 text-[15px] font-bold text-ink transition-all active:scale-[0.98]"
                >
                  Sign in
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
