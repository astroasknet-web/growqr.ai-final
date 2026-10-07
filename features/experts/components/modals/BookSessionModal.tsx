"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  RefreshCw,
  Shield,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import type { ExpertData, ExpertPackage } from "../../types";
import {
  trackGenerateLead,
  trackFormStart,
  trackFormStepComplete,
  trackFormError,
} from "@/lib/analytics";

/* ─────────────────────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────────────────────── */

type CalSlot  = { time: string };
type SlotsMap = Record<string, CalSlot[]>; // "YYYY-MM-DD" → slots

type Phase =
  | "slots"       // pick a slot (Google Calendar availability)
  | "details"     // name / email / goal
  | "payment"     // Razorpay checkout (launched as overlay)
  | "booking"     // creating booking + Google Meet after payment verified
  | "confirmed";  // success / error

type BookingResult = {
  uid?:        string;
  start?:      string;
  end?:        string;
  meetingUrl?: string;
  title?:      string;
};

// Razorpay browser type shim
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: any) => { open(): void; on(event: string, cb: () => void): void };
  }
}

const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/** Booking window: the current month plus (N-1) months ahead are viewable/
 *  bookable. Caps month navigation (and therefore availability API calls). */
const BOOKING_WINDOW_MONTHS = 2;

/** Experts are India-based and their availability is defined in IST. Slots are
 *  generated on the IST grid server-side, so we also DISPLAY them in IST —
 *  otherwise a viewer in another timezone sees India's 10am–6pm as odd local
 *  hours (e.g. a 1 AM slot). All slot times/dates in this modal are IST. */
const EXPERT_TZ = "Asia/Kolkata";

/** TEMP: payment step disabled. While false, the modal skips the payment phase
 *  and books directly (no Razorpay, no invoice). Flip to true to restore the
 *  full pay-then-book flow — all payment code below is preserved. Keep in sync
 *  with PAYMENTS_ENABLED in app/api/experts/book/route.ts. */
const PAYMENT_ENABLED = false;

const ease = [0.22, 1, 0.36, 1] as const;
const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  // "Today" in IST — slots are keyed by their IST calendar date.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EXPERT_TZ,
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
  }).format(new Date());
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   true,
    timeZone: EXPERT_TZ,
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday:  "short",
    day:      "numeric",
    month:    "long",
    timeZone: EXPERT_TZ,
  });
}

/** Dynamically load Razorpay checkout script (idempotent) */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.async   = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.head.appendChild(s);
  });
}

/* ─────────────────────────────────────────────────────────────
   Small reusable atoms
───────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.09em]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required,
}: {
  type?:        string;
  placeholder:  string;
  value:        string;
  onChange:     (v: string) => void;
  icon?:        React.ReactNode;
  required?:    boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 rounded-xl border border-black/[0.1] bg-white text-[14px] text-ink placeholder:text-ink-5 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/35 transition-all"
        style={{ paddingLeft: icon ? "2.75rem" : "1rem", paddingRight: "1rem" }}
      />
    </div>
  );
}

function SlotPill({ iso, selected, onClick }: { iso: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-xl border text-[12.5px] font-semibold transition-all duration-150 ${
        selected
          ? "border-orange bg-orange text-white shadow-[0_4px_12px_-4px_rgba(255,106,47,0.45)]"
          : "border-black/[0.09] text-ink hover:border-orange/50 hover:text-orange-deep hover:bg-orange-lighter"
      }`}
    >
      {fmtTime(iso)}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export default function BookSessionModal({
  expert,
  selectedPackage,
  onClose,
}: {
  expert:          ExpertData;
  selectedPackage: ExpertPackage;
  onClose:         () => void;
}) {
  const pkg = selectedPackage;
  // The charge amount is derived server-side from the expert slug (see
  // lib/payments/booking-amount.ts) — the client never sends an amount.

  /* ── phase ── */
  const [phase, setPhase] = useState<Phase>("slots");

  /* ── slot selection ── */
  const now = new Date();
  const [calYear,       setCalYear]       = useState(now.getFullYear());
  const [calMonth,      setCalMonth]      = useState(now.getMonth());
  const [slotsMap,      setSlotsMap]      = useState<SlotsMap>({});
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [slotsError,    setSlotsError]    = useState<string | null>(null);
  const [notConnected,  setNotConnected]  = useState(false);
  const [selDateKey,    setSelDateKey]    = useState<string | null>(null);
  const [selSlot,       setSelSlot]       = useState<string | null>(null);

  /* ── user details ── */
  const [form, setForm] = useState({ name: "", email: "", topic: "" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  /* ── payment ── */
  const [payError,  setPayError]  = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  /* ── booking result ── */
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingError,  setBookingError]  = useState<string | null>(null);

  /* keep a ref to the pending payment details so we can use them in the Razorpay callback */
  const pendingPayRef = useRef<{ orderId: string } | null>(null);

  useEffect(() => {
    trackFormStart("booking");
  }, []);

  /* ── lock body scroll while modal is open ── */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  /* ── preload Razorpay script when modal mounts ── */
  useEffect(() => {
    loadRazorpayScript().catch(() => {/* silent — will retry on Pay click */});
  }, []);

  /* Per-open-modal cache: month key → result. Makes revisiting a month and
     paging to a pre-warmed month instant (no spinner, no refetch). */
  const monthCache = useRef<Map<string, { slots: SlotsMap; notConnected: boolean }>>(new Map());
  const reqSeq = useRef(0);

  /* Time-slots panel — scrolled into view on mobile after a date is picked. */
  const timePanelRef = useRef<HTMLDivElement>(null);

  /* Pure network fetch for a month — no state writes, just parsed data. */
  const fetchMonthData = useCallback(
    async (year: number, month: number): Promise<{ slots: SlotsMap; notConnected: boolean }> => {
      const tz    = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const start = new Date(year, month, 0, 12, 0, 0).toISOString();
      const end   = new Date(year, month + 1, 1, 12, 0, 0).toISOString();

      const res = await fetch(
        `/api/experts/${encodeURIComponent(expert.slug)}/availability?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}&timeZone=${encodeURIComponent(tz)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data?.status === "success" && data.slots && typeof data.slots === "object") {
        return { slots: data.available === false ? {} : (data.slots as SlotsMap), notConnected: data.available === false };
      }
      throw new Error(data?.error ?? "bad-response");
    },
    [expert.slug],
  );

  /* Silently warm the cache for a future month (used to prefetch the next one).
     Uses a fresh `new Date()` so this callback stays referentially stable. */
  const prefetchMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    if (monthCache.current.has(key)) return;
    const today = new Date();
    const target = new Date(year, month, 1);
    const firstViewable = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastViewable = new Date(today.getFullYear(), today.getMonth() + (BOOKING_WINDOW_MONTHS - 1), 1);
    if (target < firstViewable || target > lastViewable) return; // outside booking window
    fetchMonthData(year, month)
      .then((d) => monthCache.current.set(key, d))
      .catch(() => {/* prefetch is best-effort */});
  }, [fetchMonthData]);

  /* ── load slots for the visible month (cache-first) ── */
  const fetchSlots = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`;
    const seq = ++reqSeq.current;
    const nextY = month === 11 ? year + 1 : year;
    const nextM = (month + 1) % 12;

    // Cached → render instantly.
    const cached = monthCache.current.get(key);
    if (cached) {
      setSlotsMap(cached.slots);
      setNotConnected(cached.notConnected);
      setSlotsError(null);
      setSlotsLoading(false);
      prefetchMonth(nextY, nextM);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);
    setNotConnected(false);
    try {
      const data = await fetchMonthData(year, month);
      if (seq !== reqSeq.current) return; // a newer month request superseded this one
      monthCache.current.set(key, data);
      setSlotsMap(data.slots);
      setNotConnected(data.notConnected);
    } catch (err) {
      if (seq !== reqSeq.current) return;
      console.error("[experts/availability] Fetch error:", err);
      setSlotsError("Couldn't load availability. Please try again.");
    } finally {
      if (seq === reqSeq.current) setSlotsLoading(false);
      prefetchMonth(nextY, nextM);
    }
  }, [fetchMonthData, prefetchMonth]);

  useEffect(() => {
    if (phase === "slots") {
      setSelDateKey(null);
      setSelSlot(null);
      fetchSlots(calYear, calMonth);
    }
  }, [calYear, calMonth, phase, fetchSlots]);

  /* On mobile the time panel sits below the calendar — bring it into view once
     a date is picked so the slots aren't hidden off-screen. */
  useEffect(() => {
    if (!selDateKey) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 639px)").matches) return;
    timePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selDateKey]);

  /* ── calendar helpers ── */
  const firstDow    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = todayKey();

  // Furthest viewable month = current month + (window − 1).
  const maxMonth = new Date(now.getFullYear(), now.getMonth() + (BOOKING_WINDOW_MONTHS - 1), 1);

  const canPrevMonth =
    calYear > now.getFullYear() ||
    (calYear === now.getFullYear() && calMonth > now.getMonth());

  const canNextMonth =
    calYear < maxMonth.getFullYear() ||
    (calYear === maxMonth.getFullYear() && calMonth < maxMonth.getMonth());

  const prevMonth = () => {
    if (!canPrevMonth) return;
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canNextMonth) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  /* ── Razorpay payment orchestration ── */
  const handlePay = useCallback(async () => {
    setPayError(null);
    setPayLoading(true);

    try {
      // 1. Load Razorpay script (no-op if already loaded)
      await loadRazorpayScript();

      // 2. Create Razorpay order on server (amount derived server-side from slug)
      const orderRes = await fetch("/api/razorpay/order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          slug:      expert.slug,
          packageId: pkg.id,
          start:     selSlot,
          name:      form.name,
          email:     form.email,
          topic:     form.topic,
        }),
      });
      const orderData = await orderRes.json();

      if (orderData.status !== "success") {
        throw new Error(orderData.error ?? "Couldn't create payment order");
      }

      pendingPayRef.current = { orderId: orderData.orderId };
      setPayLoading(false);

      // 3. Open Razorpay checkout overlay
      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,           // paise (from server)
        currency:    orderData.currency ?? "INR",
        order_id:    orderData.orderId,
        name:        "GrowQR Advisory",
        description: `${expert.name} · ${pkg.minutes} min session`,
        image:       "/logo.png",                // optional — replace with your logo path
        prefill: {
          name:  form.name,
          email: form.email,
        },
        theme: { color: "#FF6A2F" },

        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id:   string;
          razorpay_signature:  string;
        }) => {
          // 4. Payment captured by Razorpay — now verify + create the booking.
          //    This runs after money has changed hands, so any failure here must
          //    surface a clear support path rather than leaving the user stuck.
          setPhase("booking");

          try {
            const verifyRes = await fetch("/api/experts/book", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                token: turnstileToken,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                booking: {
                  slug:      expert.slug,
                  packageId: pkg.id,
                  start:     selSlot,
                  name:      form.name,
                  email:     form.email,
                  topic:     form.topic,
                  timeZone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
              }),
            });

            const verifyData = await verifyRes.json().catch(() => null);

            if (verifyRes.ok && verifyData?.status === "success") {
              trackGenerateLead("booking_confirmed");
              setBookingResult(verifyData.data ?? null);
              setBookingError(null);
            } else {
              trackFormError("booking", "submit_failed");
              setBookingError(
                verifyData?.error ??
                  "We couldn't confirm your booking. Your payment is safe — contact support@growqr.ai and we'll sort it out.",
              );
              setBookingResult(null);
            }
          } catch (err) {
            console.error("[experts/book] verify request failed:", err);
            trackFormError("booking", "submit_failed");
            setBookingError(
              "We couldn't reach our servers to confirm your booking. Your payment is safe — contact support@growqr.ai with this time and we'll confirm it manually.",
            );
            setBookingResult(null);
          } finally {
            setPhase("confirmed");
          }
        },
      });

      // Handle user closing Razorpay modal without paying
      rzp.on("payment.failed", () => {
        trackFormError("booking", "payment_failed");
        setPayError("Payment was unsuccessful. Please try again.");
      });

      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment error";
      console.error("[razorpay] handlePay error:", msg);
      setPayError(msg);
      setPayLoading(false);
    }
  }, [form, selSlot, expert.name, expert.slug, pkg.id, pkg.minutes, turnstileToken]);

  /* ── Free booking (payment step disabled) ── */
  const handleBookFree = useCallback(async () => {
    setPhase("booking");
    setBookingError(null);
    try {
      const res = await fetch("/api/experts/book", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          token: turnstileToken,
          booking: {
            slug:      expert.slug,
            packageId: pkg.id,
            start:     selSlot,
            name:      form.name,
            email:     form.email,
            topic:     form.topic,
            timeZone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.status === "success") {
        trackGenerateLead("booking_confirmed");
        setBookingResult(data.data ?? null);
        setBookingError(null);
      } else {
        trackFormError("booking", "submit_failed");
        setBookingError(
          data?.error ??
            "We couldn't confirm your booking. Please contact support@growqr.ai and we'll sort it out.",
        );
        setBookingResult(null);
      }
    } catch (err) {
      console.error("[experts/book] free booking failed:", err);
      trackFormError("booking", "submit_failed");
      setBookingError(
        "We couldn't reach our servers to confirm your booking. Please contact support@growqr.ai.",
      );
      setBookingResult(null);
    } finally {
      setPhase("confirmed");
    }
  }, [form, selSlot, expert.slug, pkg.id, turnstileToken]);

  /* ── derived ── */
  const availDays = new Set(Object.keys(slotsMap));
  const daySlots  = selDateKey ? (slotsMap[selDateKey] ?? []) : [];

  const canProceedFromSlots   = !!selSlot;
  const canProceedFromDetails =
    form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);

  /* ── modal width per phase ── */
  const modalWidth =
    phase === "slots"     ? "max-w-[820px]" :
    phase === "confirmed" ? "max-w-[520px]" :
    phase === "booking"   ? "max-w-[440px]" :
    "max-w-[540px]";

  const phaseLabel: Record<Phase, string> = {
    slots:     "Select a Slot",
    details:   "Your Details",
    payment:   "Confirm & Pay",
    booking:   "Creating Booking",
    confirmed: bookingError ? "Booking Issue" : "Booking Confirmed",
  };

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-x-0 top-0 z-[110] flex h-screen items-center justify-center"
      style={{
        // `h-screen` (100vh) is the fallback; `100dvh` (overrides it where
        // supported) tracks the *visible* viewport as mobile browser chrome
        // shows/hides — so the sheet never gets clipped behind the URL bar.
        height: "100dvh",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet — flex column so header/footer pin and body scrolls */}
      <motion.div
        className={`relative w-full bg-white rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col max-h-full transition-[max-width] duration-500 ${modalWidth}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease }}
      >
        {/* ── HEADER — pinned ── */}
        <div className="px-4 sm:px-7 pt-6 pb-5 border-b border-black/[0.05] flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`relative w-13 h-13 rounded-2xl overflow-hidden bg-gradient-to-br ${expert.bg} shrink-0`} style={{ width: 52, height: 52 }}>
              <Image src={expert.image} alt={expert.name} fill sizes="52px" className="object-contain object-bottom" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-orange-deep mb-0.5">
                {phaseLabel[phase]}
              </p>
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink leading-tight">
                {expert.name}
              </h2>
              <p className="text-[13px] text-ink-4 mt-0.5">
                {pkg.minutes} min · {PAYMENT_ENABLED ? `${pkg.price} · ` : ""}Video call
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-black/[0.05] flex items-center justify-center text-ink-4 hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY — scrollable ── */}
        <div className="flex-1 overflow-y-scroll overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/[0.03] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/35">
        <AnimatePresence mode="wait">
          <motion.div key={phase} {...fade} className="px-4 sm:px-7 py-5 sm:py-6">

            {/* ════════════════════════════
                PHASE: slots
            ════════════════════════════ */}
            {phase === "slots" && (
              <div className="flex flex-col gap-4">

                {/* Session info pill */}
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-cream border border-black/[0.07]">
                  <Video className="w-4 h-4 text-orange shrink-0" />
                  <span className="text-[14px] font-semibold text-ink">{pkg.minutes} min · 1:1 Video Session</span>
                  {PAYMENT_ENABLED && (
                    <span className="ml-auto text-[16px] font-bold text-ink">{pkg.price}</span>
                  )}
                </div>

                {/* Timezone note — all slots are shown in the expert's timezone (IST) */}
                <p className="-mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-4">
                  <Clock className="w-3.5 h-3.5 text-ink-5 shrink-0" />
                  All times shown in IST (India Standard Time)
                </p>

                {/* Calendar + time slots — stacks on mobile, side-by-side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4 items-start">

                  {/* Left: Calendar */}
                  <div className="rounded-2xl border border-black/[0.08] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] bg-cream/40">
                      <p className="text-[15px] font-bold text-ink">{MONTHS[calMonth]} {calYear}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={prevMonth}
                          disabled={!canPrevMonth}
                          className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center text-ink-4 hover:bg-cream active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={nextMonth}
                          disabled={!canNextMonth}
                          className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center text-ink-4 hover:bg-cream active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-7 mb-2">
                        {DAYS_SHORT.map((d) => (
                          <div key={d} className="text-[12px] font-semibold text-ink-5 text-center py-1">{d}</div>
                        ))}
                      </div>

                      {slotsLoading ? (
                        <div className="grid grid-cols-7 gap-y-1" aria-hidden>
                          {Array.from({ length: 35 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-center h-10">
                              <div
                                className="h-8 w-8 rounded-lg bg-black/[0.06] animate-pulse"
                                style={{ animationDelay: `${(i % 7) * 60}ms` }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : slotsError ? (
                        <div className="h-40 flex flex-col items-center justify-center gap-3 text-center">
                          <AlertCircle className="w-5 h-5 text-orange/60" />
                          <p className="text-[12.5px] text-ink-3">{slotsError}</p>
                          <button
                            onClick={() => fetchSlots(calYear, calMonth)}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-deep hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        </div>
                      ) : notConnected ? (
                        <div className="h-40 flex flex-col items-center justify-center gap-2.5 text-center px-4">
                          <AlertCircle className="w-5 h-5 text-orange/60" />
                          <p className="text-[13px] font-semibold text-ink">Not available for booking yet</p>
                          <p className="text-[12.5px] text-ink-4 leading-relaxed">
                            {expert.name.split(" ")[0]} hasn&apos;t opened up their calendar yet. Please check back soon.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-7 gap-y-1">
                          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d        = i + 1;
                            const key      = toDateKey(calYear, calMonth, d);
                            const isToday  = key === today;
                            const isPast   = key < today;
                            const hasSlots = availDays.has(key);
                            const isSel    = selDateKey === key;
                            const disabled = isPast || !hasSlots;

                            return (
                              <button
                                key={d}
                                disabled={disabled}
                                onClick={() => { setSelDateKey(key); setSelSlot(null); }}
                                className={`relative flex flex-col items-center justify-center h-10 rounded-lg text-[14px] font-medium transition-all active:scale-90 disabled:active:scale-100 ${
                                  isSel
                                    ? "bg-orange text-white shadow-[0_4px_14px_-4px_rgba(255,106,47,0.5)]"
                                    : disabled
                                    ? "text-ink-5 cursor-not-allowed"
                                    : "text-ink hover:bg-orange-lighter hover:text-orange-deep cursor-pointer"
                                } ${isToday && !isSel ? "font-bold underline underline-offset-2 decoration-orange/60" : ""}`}
                              >
                                {d}
                                {hasSlots && !isSel && !disabled && (
                                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange/70" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: time slots panel (below the calendar on mobile) */}
                  <div ref={timePanelRef} className="rounded-2xl border border-black/[0.08] overflow-hidden flex flex-col h-full scroll-mt-4">
                    <div className="px-4 py-3.5 border-b border-black/[0.06] bg-cream/40 shrink-0">
                      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-4 leading-tight">
                        {slotsLoading
                          ? "Loading times…"
                          : selDateKey
                          ? fmtDateShort(new Date(calYear, calMonth, parseInt(selDateKey.split("-")[2])).toISOString())
                          : "Select a date"}
                      </p>
                    </div>
                    <div className="p-2.5 sm:flex-1 sm:overflow-y-auto sm:max-h-[320px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15">
                      <AnimatePresence mode="wait">
                        {slotsLoading ? (
                          <motion.div key="loading" {...fade} className="grid grid-cols-2 sm:grid-cols-1 gap-1.5" aria-hidden>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-11 rounded-xl bg-black/[0.06] animate-pulse"
                                style={{ animationDelay: `${i * 70}ms` }}
                              />
                            ))}
                          </motion.div>
                        ) : !selDateKey ? (
                          <motion.p
                            key="no-date"
                            {...fade}
                            className="text-[12.5px] text-ink-5 text-center py-8 px-2 leading-relaxed"
                          >
                            Pick a highlighted date
                          </motion.p>
                        ) : daySlots.length === 0 ? (
                          <motion.p key="no-slots" {...fade} className="text-[12.5px] text-ink-4 text-center py-8">
                            No slots available.
                          </motion.p>
                        ) : (
                          <motion.div key={selDateKey} {...fade} className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                            {daySlots.map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => setSelSlot(slot.time)}
                                className={`w-full py-3 px-3 rounded-xl border text-[13.5px] font-semibold transition-all duration-150 text-center active:scale-[0.97] ${
                                  selSlot === slot.time
                                    ? "border-orange bg-orange text-white shadow-[0_4px_12px_-4px_rgba(255,106,47,0.45)]"
                                    : "border-black/[0.09] text-ink hover:border-orange/50 hover:text-orange-deep hover:bg-orange-lighter"
                                }`}
                              >
                                {fmtTime(slot.time)}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ════════════════════════════
                PHASE: details
            ════════════════════════════ */}
            {phase === "details" && (
              <div className="flex flex-col gap-4">
                {selSlot && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-orange-lighter border border-orange/15 px-4 py-3">
                    <Clock className="w-4 h-4 text-orange shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold text-orange-deep leading-tight">{fmtDateShort(selSlot)}</p>
                      <p className="text-[11.5px] text-orange-deep/80">{fmtTime(selSlot)} IST · {pkg.minutes} min session</p>
                    </div>
                  </div>
                )}

                <Field label="Full Name">
                  <Input
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    required
                  />
                </Field>

                <Field label="Email Address">
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                </Field>

                <Field label="What do you want to work on?">
                  <textarea
                    rows={3}
                    placeholder="e.g. AI strategy roadmap, startup GTM plan, career pivot…"
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-black/[0.1] bg-white text-[14px] text-ink placeholder:text-ink-5 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/35 transition-all resize-none leading-relaxed"
                  />
                </Field>

                {/* Invisible bot gate. Mounted on the details phase — the last
                    step the visitor sees before a booking is actually created —
                    so the token is ready whether the next click goes to the
                    Razorpay flow or straight to the free-booking path. */}
                <TurnstileWidget onVerify={setTurnstileToken} />
              </div>
            )}

            {/* ════════════════════════════
                PHASE: payment
            ════════════════════════════ */}
            {phase === "payment" && (
              <div className="flex flex-col gap-4">
                {/* Order summary */}
                <div className="rounded-2xl bg-cream border border-black/[0.06] overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br ${expert.bg} shrink-0`}>
                        <Image src={expert.image} alt={expert.name} fill sizes="40px" className="object-contain object-bottom" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-ink leading-tight">{expert.name}</p>
                        <p className="text-[13px] text-ink-4">{pkg.label} · {pkg.minutes} min</p>
                      </div>
                    </div>
                    <span className="text-[22px] font-extrabold text-ink">{pkg.price}</span>
                  </div>
                  {selSlot && (
                    <div className="border-t border-black/[0.05] px-5 py-2.5 flex items-center gap-2 text-[12px] text-ink-4">
                      <Clock className="w-3.5 h-3.5 text-orange shrink-0" />
                      {fmtDateShort(selSlot)} · {fmtTime(selSlot)} IST · Video call
                    </div>
                  )}
                </div>

                {/* Razorpay launch button */}
                <button
                  onClick={handlePay}
                  disabled={payLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#072654] text-white text-[16px] font-bold flex items-center justify-center gap-2.5 hover:bg-[#0a3270] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-wait shadow-[0_8px_24px_-8px_rgba(7,38,84,0.4)]"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing payment…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Pay {pkg.price} securely via Razorpay
                    </>
                  )}
                </button>

                {payError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13.5px] text-red-700">{payError}</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-ink-5">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  256-bit SSL · Secured by Razorpay · UPI / Cards / Net Banking
                </div>
              </div>
            )}

            {/* ════════════════════════════
                PHASE: booking
            ════════════════════════════ */}
            {phase === "booking" && (
              <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-500" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="text-[17px] font-bold text-ink">
                    {PAYMENT_ENABLED ? "Payment confirmed!" : "Almost there!"}
                  </p>
                  <p className="text-[13px] text-ink-4 mt-1">Confirming your session…</p>
                </div>
                <Loader2 className="w-5 h-5 text-orange animate-spin" />
              </div>
            )}

            {/* ════════════════════════════
                PHASE: confirmed
            ════════════════════════════ */}
            {phase === "confirmed" && (
              <div className="flex flex-col gap-5">
                {bookingError ? (
                  <div className="flex flex-col items-center text-center gap-4 py-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[17px] font-bold text-ink">Booking issue</p>
                      <p className="text-[13px] text-ink-3 mt-1.5 max-w-[300px] leading-relaxed">{bookingError}</p>
                    </div>
                    <p className="text-[12px] text-ink-5 max-w-[280px] leading-relaxed">
                      Please contact{" "}
                      <a href="mailto:support@growqr.ai" className="text-orange-deep underline">support@growqr.ai</a>{" "}
                      and we&apos;ll sort it out immediately.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center text-center gap-3 py-2">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-16 h-16 rounded-2xl bg-orange-lighter flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-orange" strokeWidth={2.5} />
                      </motion.div>
                      <div>
                        <p className="text-[20px] font-extrabold text-ink tracking-[-0.025em]">Session booked!</p>
                        <p className="text-[13.5px] text-ink-3 mt-1">
                          {form.name && `${form.name} · `}{form.email}
                        </p>
                      </div>
                    </div>

                    {(bookingResult?.start || selSlot) && (
                      <div className="rounded-2xl bg-cream border border-black/[0.06] px-5 py-4 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5 text-[13px] text-ink">
                          <Calendar className="w-4 h-4 text-orange shrink-0" />
                          <span className="font-semibold">{fmtDateShort(bookingResult?.start ?? selSlot!)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px] text-ink">
                          <Clock className="w-4 h-4 text-orange shrink-0" />
                          <span>{fmtTime(bookingResult?.start ?? selSlot!)} IST · {pkg.minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px] text-ink">
                          <Video className="w-4 h-4 text-orange shrink-0" />
                          {bookingResult?.meetingUrl ? (
                            <a
                              href={bookingResult.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-deep font-semibold hover:underline truncate"
                            >
                              Join Google Meet
                            </a>
                          ) : (
                            <span className="text-ink-3">Meet link on its way via email</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-black/[0.07] bg-white p-4">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-4 mb-3">
                        Check your inbox for
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {[
                          { Icon: Video,        text: "Google Meet link for your session" },
                          { Icon: Mail,         text: "Booking confirmation email" },
                          { Icon: Calendar,     text: "Calendar invite + reminders" },
                          { Icon: CheckCircle2, text: "Pre-session prep notes" },
                        ].map(({ Icon, text }) => (
                          <div key={text} className="flex items-center gap-2.5 text-[13px] text-ink-2">
                            <div className="w-6 h-6 rounded-lg bg-orange-lighter flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-orange" />
                            </div>
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-orange text-white text-[14px] font-semibold hover:bg-orange-dark transition-colors shadow-[0_8px_20px_-8px_rgba(255,106,47,0.4)]"
                >
                  Done
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
        </div>{/* end scrollable body */}

        {/* ── FOOTER NAV — pinned ── */}
        {phase !== "booking" && phase !== "confirmed" && (
          <div className="px-4 sm:px-7 py-4 sm:py-5 border-t border-black/[0.05] flex items-center justify-between gap-3 shrink-0">
            {phase !== "slots" ? (
              <button
                onClick={() => {
                  if (phase === "details") setPhase("slots");
                  if (phase === "payment") setPhase("details");
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-black/[0.1] text-ink text-[14.5px] font-semibold hover:border-black/20 active:scale-[0.97] transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {phase === "slots" && (
              <button
                disabled={!canProceedFromSlots}
                onClick={() => {
                  trackFormStepComplete("booking", "slots", 1);
                  setPhase("details");
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-orange text-white text-[14.5px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.5)] hover:bg-orange-dark active:scale-[0.97] transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {phase === "details" && (
              <button
                disabled={!canProceedFromDetails}
                onClick={() => {
                  trackFormStepComplete("booking", "details", 2);
                  if (PAYMENT_ENABLED) setPhase("payment");
                  else handleBookFree();
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-orange text-white text-[14.5px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.5)] hover:bg-orange-dark active:scale-[0.97] transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {PAYMENT_ENABLED ? "Proceed to Payment" : "Confirm Booking"} <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* payment phase — CTA is the Razorpay button inside the body, no footer CTA needed */}
          </div>
        )}
      </motion.div>
    </div>
  );
}
