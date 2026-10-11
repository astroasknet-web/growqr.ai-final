"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Award, BadgeCheck, BookOpen, Bot, Briefcase, Building2, CalendarDays, ChevronDown, Command, Compass,
  FileText, Fingerprint, Globe2, GraduationCap, Laptop, Mail, Menu, Newspaper, QrCode, Rocket, School, Search,
  ShieldCheck, Sparkles, Telescope, UserRound, UserSearch, Users, X, Zap, ListChecks, Route, Library, type LucideIcon,
} from "lucide-react";
import { personas } from "@/lib/personas";
import { useAuthFlag } from "@/lib/useAuthFlag";
import { usePortalUser } from "@/lib/usePortalUser";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { AgentAvatar } from "./ui";
import { INTERNSHIPS, RESUME_SCORE_URL, SCORE_URL, type AgentKey } from "./data";
import {
  ABROAD, AGENT_LIST, ANNOUNCE, CAREERS_LEARN, CAREERS_OPPS, EMPLOYER_LINKS, INDEX, PERSONA_COPY, PLANS, PLATFORM, RESOURCES,
  type IconKey, type NavLink,
} from "./nav-data";

const ICONS: Record<IconKey, LucideIcon> = {
  qr: QrCode, passport: Fingerprint, bot: Bot, studio: FileText, briefcase: Briefcase, gig: Zap, tracker: ListChecks, rocket: Rocket,
  book: BookOpen, path: Route, ebook: Library, globe: Globe2, shield: ShieldCheck, student: GraduationCap, pro: UserRound, coach: Compass,
  free: Laptop, startup: Rocket, recruit: UserSearch, enterprise: Building2, institute: School, experts: Award, events: CalendarDays,
  community: Users, blog: Newspaper, about: BadgeCheck, contact: Mail, vision: Telescope, post: Briefcase, spark: Sparkles,
};

type MenuId = "platform" | "careers" | "solutions" | "employers" | "resources";
const MENUS: { id: MenuId; label: string }[] = [
  { id: "platform", label: "Platform" },
  { id: "careers", label: "Careers" },
  { id: "solutions", label: "Solutions" },
  { id: "employers", label: "Employers" },
  { id: "resources", label: "Resources" },
];

/* ---------------------------- atoms ---------------------------- */
function Row({ l, onNav }: { l: NavLink; onNav: () => void }) {
  const I = ICONS[l.icon];
  const inner = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-light text-orange-deep transition group-hover:bg-orange group-hover:text-white"><I className="h-[18px] w-[18px]" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[0.94rem] font-semibold text-ink">
          {l.label}
          {l.badge && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-700">{l.badge}</span>}
          {l.external && <ArrowUpRight className="h-3.5 w-3.5 text-ink-5 transition group-hover:text-orange" aria-hidden />}
        </span>
        {l.desc && <span className="block text-[0.8rem] leading-snug text-ink-4">{l.desc}</span>}
      </span>
    </>
  );
  const cls = "group flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange";
  return l.external ? (
    <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onNav}>{inner}</a>
  ) : (
    <Link href={l.href} className={cls} onClick={onNav}>{inner}</Link>
  );
}

const Head = ({ children }: { children: ReactNode }) => <p className="mb-2 px-2.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-ink-4">{children}</p>;

function Feature({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-[#26180f] to-[#3b1d0e] p-5 text-white ${className}`}><span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange/40 blur-[50px]" /><div className="relative">{children}</div></div>;
}

/* ---------------------------- panels ---------------------------- */
function PlatformPanel({ close }: { close: () => void }) {
  return (
    <div className="grid grid-cols-[1.1fr,0.9fr,0.9fr] gap-6">
      <div><Head>The product</Head>{PLATFORM.map((l) => <Row key={l.label} l={l} onNav={close} />)}</div>
      <div>
        <Head>Meet the agents</Head>
        <ul className="grid grid-cols-2 gap-1.5">
          {AGENT_LIST.map((a) => (
            <li key={a.key}><Link href="/agents" onClick={close} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-cream"><AgentAvatar k={a.key as AgentKey} size={34} ring={false} /><span className="text-[0.78rem] font-semibold leading-tight text-ink">{a.name.replace("RQ-", "")}<span className="block text-[0.64rem] font-normal text-ink-4">{a.role}</span></span></Link></li>
          ))}
        </ul>
      </div>
      <Feature>
        <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]">Free · no sign-up</p>
        <p className="font-serif text-[1.7rem] leading-tight">Score my resume</p>
        <p className="mt-1 text-[0.82rem] text-white/70">PDF, Word or pasted text. A grade and three focus areas in seconds.</p>
        <a href={RESUME_SCORE_URL} onClick={close} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-orange px-5 text-[0.88rem] font-bold text-white transition hover:bg-orange-dark">Try it free <ArrowRight className="h-4 w-4" aria-hidden /></a>
      </Feature>
    </div>
  );
}

function CareersPanel({ close }: { close: () => void }) {
  const it = INTERNSHIPS[0];
  return (
    <div className="grid grid-cols-[1fr,1fr,1fr,0.95fr] gap-6">
      <div><Head>Opportunities</Head>{CAREERS_OPPS.map((l) => <Row key={l.label} l={l} onNav={close} />)}</div>
      <div>
        <Head>Learn</Head>{CAREERS_LEARN.map((l) => <Row key={l.label} l={l} onNav={close} />)}
        <p className="mt-2 px-2.5 text-[0.76rem] text-ink-4">Fields: AI &amp; ML, Data Analytics, Software, Cloud, Digital Marketing, Blockchain and more.</p>
      </div>
      <div>
        <Head>Study abroad · 58 universities</Head>
        <ul className="grid grid-cols-2 gap-1.5 px-1">
          {ABROAD.map((c) => (<li key={c.label}><a href={c.href} target="_blank" rel="noopener noreferrer" onClick={close} className="flex items-center justify-between rounded-xl border border-black/[0.07] px-3 py-2 text-[0.82rem] font-semibold transition hover:border-orange hover:bg-orange-lighter">{c.label}<span className="text-orange-dark">{c.count}</span></a></li>))}
        </ul>
        <a href="/study-abroad" onClick={close} className="mt-3 inline-flex items-center gap-1 px-2.5 text-[0.84rem] font-semibold text-orange-dark">View all universities <ArrowRight className="h-3.5 w-3.5" aria-hidden /></a>
      </div>
      <Feature>
        <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]">Featured role</p>
        <p className="text-[1.05rem] font-bold leading-tight">{it.title}</p>
        <p className="text-[0.8rem] text-white/60">{it.company} · {it.place} · {it.weeks} weeks</p>
        <p className="mt-3 font-serif text-[2rem] leading-none">₹{it.stipend.toLocaleString("en-IN")}<span className="font-sans text-[0.75rem] text-white/60">/mo</span></p>
        <p className="mt-2 flex items-center gap-1.5 text-[0.76rem] text-white/80"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> First month in escrow</p>
        <a href={SCORE_URL} onClick={close} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 text-[0.86rem] font-bold text-ink transition hover:bg-orange hover:text-white">View &amp; apply <ArrowRight className="h-4 w-4" aria-hidden /></a>
      </Feature>
    </div>
  );
}

function SolutionsPanel({ close }: { close: () => void }) {
  const col = (type: "individual" | "enterprise", title: string) => (
    <div>
      <Head>{title}</Head>
      {personas.filter((p) => p.type === type).map((p) => {
        const c = PERSONA_COPY[p.id];
        return <Row key={p.id} l={{ label: p.navLabel, desc: c?.desc, href: p.link, icon: c?.icon ?? "student" }} onNav={close} />;
      })}
    </div>
  );
  return (
    <div className="grid grid-cols-[1fr,1fr,0.8fr] gap-6">
      {col("individual", "For individuals")}
      {col("enterprise", "For organisations")}
      <Feature>
        <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#FFB380]">Human in the loop</p>
        <p className="font-serif text-[1.6rem] leading-tight">Agents that work. Experts that stand behind them.</p>
        <Link href="/experts" onClick={close} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-orange px-5 text-[0.86rem] font-bold text-white transition hover:bg-orange-dark">Meet the experts <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </Feature>
    </div>
  );
}

function EmployersPanel({ close }: { close: () => void }) {
  return (
    <div className="grid grid-cols-[1fr,1.1fr] gap-6">
      <div><Head>Hire on proof</Head>{EMPLOYER_LINKS.map((l) => <Row key={l.label} l={l} onNav={close} />)}</div>
      <div>
        <Head>Plans for employers</Head>
        <ul className="grid gap-2 px-1">
          {PLANS.map((p) => (<li key={p.name} className="flex items-center justify-between rounded-2xl border border-black/[0.07] px-4 py-3"><span><span className="block text-[0.92rem] font-bold">{p.name}</span><span className="text-[0.78rem] text-ink-4">{p.note}</span></span><span className="font-serif text-[1.25rem] text-orange-dark">{p.price}</span></li>))}
        </ul>
        <a href={SCORE_URL} onClick={close} className="mt-3 inline-flex min-h-[44px] items-center gap-2 px-2.5 text-[0.88rem] font-bold text-orange-dark">Post your first role free <ArrowRight className="h-4 w-4" aria-hidden /></a>
      </div>
    </div>
  );
}

function ResourcesPanel({ close }: { close: () => void }) {
  return <div className="grid grid-cols-2 gap-x-6">{RESOURCES.map((l) => <Row key={l.label} l={l} onNav={close} />)}</div>;
}

const PANEL: Record<MenuId, (p: { close: () => void }) => ReactNode> = {
  platform: (p) => <PlatformPanel {...p} />,
  careers: (p) => <CareersPanel {...p} />,
  solutions: (p) => <SolutionsPanel {...p} />,
  employers: (p) => <EmployersPanel {...p} />,
  resources: (p) => <ResourcesPanel {...p} />,
};
const PANEL_W: Record<MenuId, string> = { platform: "min(1060px,92vw)", careers: "min(1180px,94vw)", solutions: "min(980px,92vw)", employers: "min(760px,92vw)", resources: "min(620px,92vw)" };

/* ---------------------------- command palette ---------------------------- */
function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return INDEX.filter((h) => ["QR Score", "Skill Passport", "Internships", "AI Agents", "Courses", "Post a role"].includes(h.label)).concat(INDEX.filter((h) => h.group === "Study abroad").slice(0, 2));
    return INDEX.filter((h) => `${h.label} ${h.sub} ${h.group}`.toLowerCase().includes(s)).slice(0, 9);
  }, [q]);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);
  const go = (h: (typeof INDEX)[number]) => { onClose(); if (h.external) window.open(h.href, "_blank", "noopener,noreferrer"); else window.location.assign(h.href); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/50 px-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Search GrowQR">
          <motion.div className="w-full max-w-[640px] overflow-hidden rounded-3xl bg-white shadow-[0_40px_120px_rgba(0,0,0,0.4)]" initial={{ y: -16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              if (e.key === "Enter" && hits[sel]) go(hits[sel]);
            }}>
            <div className="flex items-center gap-3 border-b border-black/[0.07] px-5">
              <Search className="h-5 w-5 text-ink-4" aria-hidden />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search internships, courses, agents, countries…" aria-label="Search" className="h-16 flex-1 bg-transparent text-[1.05rem] outline-none placeholder:text-ink-5" />
              <kbd className="rounded-md border border-black/10 px-1.5 py-0.5 text-[0.68rem] font-semibold text-ink-4">Esc</kbd>
            </div>
            <ul ref={list} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
              {!q && <li className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-ink-4">Popular</li>}
              {hits.length === 0 && <li className="px-4 py-10 text-center text-[0.95rem] text-ink-4">No matches. Try &ldquo;internship&rdquo;, &ldquo;resume&rdquo; or &ldquo;Canada&rdquo;.</li>}
              {hits.map((h, i) => {
                const I = ICONS[h.icon];
                return (
                  <li key={h.group + h.label} data-i={i} role="option" aria-selected={i === sel}>
                    <button type="button" onMouseEnter={() => setSel(i)} onClick={() => go(h)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${i === sel ? "bg-orange-lighter" : ""}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${i === sel ? "bg-orange text-white" : "bg-orange-light text-orange-deep"}`}><I className="h-4 w-4" aria-hidden /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[0.94rem] font-semibold text-ink">{h.label}</span><span className="block truncate text-[0.78rem] text-ink-4">{h.sub}</span></span>
                      <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-ink-4">{h.group}</span>
                      {h.external && <ArrowUpRight className="h-4 w-4 text-ink-5" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-black/[0.07] bg-cream px-5 py-2.5 text-[0.72rem] text-ink-4"><span><kbd className="font-semibold">↑↓</kbd> navigate · <kbd className="font-semibold">Enter</kbd> open</span><span>Tip: press <kbd className="font-semibold">Ctrl/⌘ K</kbd> anywhere</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- the nav ---------------------------- */
export default function HomeNav() {
  const [open, setOpen] = useState<MenuId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [bar, setBar] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [mAcc, setMAcc] = useState<MenuId | null>("platform");
  const [pal, setPal] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggedIn = useAuthFlag();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();

  const show = (id: MenuId) => { if (timer.current) clearTimeout(timer.current); setOpen(id); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), 140); };
  const close = useCallback(() => { setOpen(null); setDrawer(false); }, []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((p) => !p); }
      if (e.key === "Escape") { setOpen(null); setDrawer(false); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => { document.body.style.overflow = drawer || pal ? "hidden" : ""; document.body.classList.toggle("ho-drawer", drawer || pal); return () => { document.body.style.overflow = ""; document.body.classList.remove("ho-drawer"); }; }, [drawer, pal]);

  const portalUser = usePortalUser();


  const accountHref = portalUser ? "/account" : "/login";


  const accountLabel = portalUser || loggedIn ? "My account" : "Log in";


  const cta = loggedIn
    ? { label: "Dashboard", onClick: () => window.location.assign("https://app.growqr.ai/home") }
    : !isLive
      ? { label: "Get started free", onClick: () => openWaitlist("home-options-nav") }
      : { label: "Get started free", onClick: () => window.location.assign("https://app.growqr.ai/signup") };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50" onMouseLeave={hide}>
        {/* announcement */}
        <div className={`overflow-hidden bg-gradient-to-r from-ink via-[#2a1a10] to-ink text-white transition-[max-height,opacity] duration-300 ${bar && !scrolled ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-center gap-3 px-4 text-[0.8rem]">
            <span className="hidden rounded-full bg-orange px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider sm:inline">New</span>
            <span className="truncate text-white/90">{ANNOUNCE.text}</span>
            <a href={ANNOUNCE.href} target="_blank" rel="noopener noreferrer" className="hidden shrink-0 items-center gap-1 font-semibold text-[#FFB380] hover:text-white sm:inline-flex">{ANNOUNCE.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden /></a>
            <button type="button" aria-label="Dismiss announcement" onClick={() => setBar(false)} className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" aria-hidden /></button>
          </div>
        </div>

        {/* main bar */}
        <div className={`mx-auto px-3 transition-all duration-300 md:px-6 ${scrolled ? "pt-2" : "pt-3"}`}>
          <nav aria-label="Primary" className={`mx-auto flex h-[60px] max-w-[1320px] items-center gap-2 rounded-[22px] border px-3 transition-all duration-300 md:h-[64px] md:px-4 ${scrolled || open || drawer ? "border-black/[0.08] bg-white/90 shadow-[0_10px_40px_-12px_rgba(26,26,26,0.25)] backdrop-blur-xl" : "border-white/60 bg-white/65 backdrop-blur-md"}`}>
            <Link href="/" aria-label="GrowQR home" className="mr-1 flex shrink-0 items-center md:mr-4"><Image src="/growqr-logo.png" alt="GrowQR" width={400} height={200} priority className="h-[32px] w-auto select-none md:h-[36px]" /></Link>

            <ul className="hidden items-center gap-0.5 lg:flex">
              {MENUS.map((m) => (
                <li key={m.id} onMouseEnter={() => show(m.id)}>
                  <button type="button" aria-haspopup="true" aria-expanded={open === m.id} onClick={() => show(m.id)} onFocus={() => show(m.id)}
                    className={`flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-full px-3 text-[0.9rem] font-semibold transition ${open === m.id ? "bg-orange-light text-orange-deep" : "text-ink-2 hover:bg-black/[0.04]"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange`}>
                    {m.label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open === m.id ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                </li>
              ))}
              <li onMouseEnter={hide}>
                <a href={SCORE_URL} className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.9rem] font-semibold text-ink-2 transition hover:bg-black/[0.04]">Internships <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-wider text-emerald-700">Live</span></a>
              </li>
            </ul>

            <div className="ml-auto flex items-center gap-1.5 md:gap-2" onMouseEnter={hide}>
              <button type="button" onClick={() => setPal(true)} aria-label="Search (Ctrl or Command K)" className="hidden min-h-[44px] items-center gap-2 rounded-full border border-black/10 bg-white/70 pl-3 pr-3 text-[0.84rem] text-ink-4 transition hover:border-orange md:flex 2xl:pr-2">
                <Search className="h-4 w-4" aria-hidden /><span className="hidden 2xl:inline">Search</span><kbd className="ml-1 hidden items-center gap-0.5 rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[0.66rem] font-semibold 2xl:inline-flex"><Command className="h-2.5 w-2.5" aria-hidden />K</kbd>
              </button>
              <button type="button" onClick={() => setPal(true)} aria-label="Search" className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/70 md:hidden"><Search className="h-[18px] w-[18px]" aria-hidden /></button>
              <a href={accountHref} className="hidden min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-[0.9rem] font-semibold text-ink-2 transition hover:bg-black/[0.04] md:inline-flex">{accountLabel}</a>
              <button type="button" onClick={cta.onClick} className="cta-shine hidden min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full bg-orange px-4 text-[0.88rem] font-bold text-white shadow-[0_10px_24px_-10px_rgba(255,106,47,0.7)] transition hover:bg-orange-dark sm:inline-flex">{cta.label}<ArrowRight className="h-4 w-4" aria-hidden /></button>
              <button type="button" aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} onClick={() => setDrawer((d) => !d)} className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/70 lg:hidden">{drawer ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}</button>
            </div>
          </nav>

          {/* mega panel */}
          <div className="relative mx-auto hidden max-w-[1320px] lg:block" onMouseEnter={() => timer.current && clearTimeout(timer.current)}>
            <div className="absolute left-1/2 top-2 -translate-x-1/2">
            <AnimatePresence mode="wait">
              {open && (
                <motion.div key={open} initial={{ opacity: 0, y: -8, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[28px] border border-black/[0.08] bg-white/95 p-5 shadow-[0_40px_100px_-30px_rgba(26,26,26,0.45)] backdrop-blur-xl" style={{ width: PANEL_W[open] }} role="menu">
                  {PANEL[open]({ close })}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[49] overflow-y-auto bg-cream pt-[132px] lg:hidden" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
            <div className="px-5 pb-40 pt-6">
              <div className="mb-5 flex gap-2.5">
                <a href={RESUME_SCORE_URL} onClick={close} className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-orange px-4 text-[0.95rem] font-bold text-white shadow-[0_12px_30px_-12px_rgba(255,106,47,0.7)]"><QrCode className="h-5 w-5" aria-hidden /> Score my resume</a>
                <a href={SCORE_URL} onClick={close} className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-[0.95rem] font-bold text-ink"><Briefcase className="h-5 w-5 text-orange" aria-hidden /> Internships</a>
              </div>
              {MENUS.map((m) => (
                <div key={m.id} className="border-b border-black/[0.08]">
                  <button type="button" onClick={() => setMAcc((a) => (a === m.id ? null : m.id))} aria-expanded={mAcc === m.id} className="flex min-h-[56px] w-full items-center justify-between text-left font-serif text-[1.6rem]">{m.label}<ChevronDown className={`h-5 w-5 text-ink-4 transition-transform ${mAcc === m.id ? "rotate-180" : ""}`} aria-hidden /></button>
                  <AnimatePresence initial={false}>
                    {mAcc === m.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid gap-0.5 pb-4">
                          {m.id === "platform" && PLATFORM.map((l) => <Row key={l.label} l={l} onNav={close} />)}
                          {m.id === "careers" && [...CAREERS_OPPS, ...CAREERS_LEARN].map((l) => <Row key={l.label} l={l} onNav={close} />)}
                          {m.id === "solutions" && personas.map((p) => <Row key={p.id} l={{ label: p.navLabel, desc: PERSONA_COPY[p.id]?.desc, href: p.link, icon: PERSONA_COPY[p.id]?.icon ?? "student" }} onNav={close} />)}
                          {m.id === "employers" && EMPLOYER_LINKS.map((l) => <Row key={l.label} l={l} onNav={close} />)}
                          {m.id === "resources" && RESOURCES.map((l) => <Row key={l.label} l={l} onNav={close} />)}
                          {m.id === "careers" && (<div className="mt-2 flex flex-wrap gap-1.5 px-2.5">{ABROAD.map((c) => (<a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" onClick={close} className="rounded-full border border-black/10 bg-white px-3 py-2 text-[0.8rem] font-semibold">{c.label} <span className="text-orange-dark">{c.count}</span></a>))}</div>)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2.5 border-t border-black/[0.08] bg-white/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
              <a href={accountHref} className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-black/10 text-[0.95rem] font-bold">{accountLabel}</a>
              <button type="button" onClick={() => { close(); cta.onClick(); }} className="flex min-h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-ink text-[0.95rem] font-bold text-white">{cta.label}<ArrowRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Palette open={pal} onClose={() => setPal(false)} />
    </>
  );
}
