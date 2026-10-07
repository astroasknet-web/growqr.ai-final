"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Check,
  Calendar,
  Globe,
  AlertCircle,
} from "lucide-react";
import { registerForEvent } from "../../actions/registerForEvent";
import type { EventRow } from "../../types/event";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/ui/TurnstileWidget";

interface Props {
  event: EventRow;
  onClose: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  expectations: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  expectations: "",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-semibold text-ink-3 uppercase tracking-[0.08em]">
        {label}
        {required && <span className="text-orange ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[14px] text-ink placeholder:text-ink-5 focus:outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/40 transition-all";

export default function EventRegisterModal({ event, onClose }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ alreadyRegistered: boolean } | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const set = <K extends keyof FormState>(k: K) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const formattedDate = new Date(`${event.event_date}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );

  const processRegistration = useCallback(() => {
    startTransition(async () => {
      const result = await registerForEvent({
        slug: event.slug,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.company || undefined,
        expectations: form.expectations || undefined,
        token: turnstileToken ?? undefined,
      });
      if (!result.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        return;
      }
      setDone({ alreadyRegistered: result.alreadyRegistered ?? false });
    });
  }, [event.slug, form, turnstileToken]);

  useEffect(() => {
    if (shouldSubmit && turnstileToken) {
      processRegistration();
      setShouldSubmit(false);
    }
  }, [shouldSubmit, turnstileToken, processRegistration]);

  /* Lock body scroll while open + close on Escape. */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSubmit = () => {
    setError(null);
    if (honeypot) return; // silent bot drop
    if (!form.fullName || !form.email || !form.phone) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!turnstileToken) {
      setShouldSubmit(true);
      turnstileRef.current?.execute();
      return;
    }
    processRegistration();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-[520px] bg-white rounded-3xl shadow-[0_32px_80px_-20px_rgba(0,0,0,0.22)] overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-black/5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-deep mb-0.5">
                Register
              </p>
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink leading-snug">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <span className="text-[12px] text-ink-4 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                  {event.start_time ? ` · ${event.start_time}` : ""}
                </span>
                <span className="text-[12px] text-ink-4 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {event.format || "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-ink-4 hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6 gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-orange-lighter flex items-center justify-center">
                  <Check className="w-7 h-7 text-orange" strokeWidth={2.5} />
                </div>
                <h3 className="text-[22px] font-extrabold text-ink tracking-[-0.02em]">
                  {done.alreadyRegistered
                    ? "You're already in!"
                    : "You're registered!"}
                </h3>
                <p className="text-[14px] text-ink-3 max-w-[340px] leading-relaxed">
                  {done.alreadyRegistered
                    ? `This email is already registered for ${event.title}. Check your inbox at `
                    : `Confirmation sent to `}
                  <span className="font-semibold text-ink">{form.email}</span>.
                  We&apos;ll send reminders 24h and 1h before the session.
                </p>
                <button
                  onClick={() => { setTurnstileToken(null); turnstileRef.current?.reset(); onClose(); }}
                  className="mt-2 px-6 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold hover:bg-orange-dark active:scale-[0.97] transition-all"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-3.5"
              >
                <Field label="Full Name" required>
                  <input
                    className={inputCls}
                    placeholder="Jane Smith"
                    value={form.fullName}
                    onChange={(e) => set("fullName")(e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Email" required>
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                    />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      type="tel"
                      className={inputCls}
                      placeholder="+91 98xxx xxxxx"
                      value={form.phone}
                      onChange={(e) => set("phone")(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Company">
                  <input
                    className={inputCls}
                    placeholder="Acme Inc."
                    value={form.company}
                    onChange={(e) => set("company")(e.target.value)}
                  />
                </Field>

                <Field label="What do you expect from the session?">
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-none`}
                    placeholder="A line or two helps us tailor the Q&A."
                    value={form.expectations}
                    onChange={(e) => set("expectations")(e.target.value)}
                  />
                </Field>

                {/* Honeypot — hidden from real users */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <TurnstileWidget
                  ref={turnstileRef}
                  onVerify={(token) => setTurnstileToken(token)}
                  onError={() => {
                    setError("Security check failed. Please try again.");
                    setShouldSubmit(false);
                  }}
                />

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700 leading-relaxed">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-6 pb-6 pt-2 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_10px_28px_-10px_rgba(255,106,47,0.5)] hover:bg-orange-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {pending ? "Registering…" : "Register for Free"}
              {!pending && <ArrowRight className="w-4 h-4" />}
            </button>
            <p className="mt-3 text-[11.5px] text-ink-5 text-center">
              By registering you agree to receive event-related emails from GrowQR.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
