"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { agents } from "@/lib/data";
import CalButton from "@/components/ui/CalButton";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { getAttributionPayload } from "@/lib/attribution";
import { trackGenerateLead, trackFormError } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ────────────────────────────────────────────────────────────────────────
 * Context — lets the shared AgentHero / FinalCTA CTAs open the enterprise
 * contact modal instead of navigating. The provider carries the agent name so
 * every submission is attributed to the agent page it came from (tracking).
 * Outside the provider (i.e. individual agents) the hook reports `enabled:
 * false` and the CTAs fall back to their normal links.
 * ──────────────────────────────────────────────────────────────────────── */

interface EnterpriseContactValue {
  enabled: boolean;
  openContact: () => void;
}

const EnterpriseContactContext = createContext<EnterpriseContactValue | null>(null);

export function useEnterpriseContact(): EnterpriseContactValue {
  return (
    useContext(EnterpriseContactContext) ?? { enabled: false, openContact: () => {} }
  );
}

const TEAM_SIZES = ["1–50", "51–200", "201–1,000", "1,000+"] as const;

/** Copy for a general, multi-agent solution-page enquiry (not tied to one
 *  agent) — the badge label plus the modal heading to show. */
export interface SolutionContact {
  label: string;
  heading: string;
}

export function EnterpriseContactProvider({
  agent,
  solution,
  children,
}: {
  /** The single agent this page is about, e.g. "RQ-Theo" — recorded with the
   *  lead. Mutually exclusive with `solution`. */
  agent?: string;
  /** For multi-agent solution pages: a general enquiry attributed to the
   *  solution itself rather than one agent. Mutually exclusive with `agent`. */
  solution?: SolutionContact;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openContact = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ enabled: true, openContact }), [openContact]);

  return (
    <EnterpriseContactContext.Provider value={value}>
      {children}
      <EnterpriseContactModal
        agent={agent}
        solution={solution}
        open={open}
        onClose={() => setOpen(false)}
      />
    </EnterpriseContactContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function EnterpriseContactModal({
  agent,
  solution,
  open,
  onClose,
}: {
  agent?: string;
  solution?: SolutionContact;
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const agentLabel = agent?.replace(/^RQ-/, "") ?? "";
  // Pull the agent's role from the roster so the modal names the role, not just
  // the agent (e.g. "Rohan · Workforce Analyst").
  const agentRole = agent
    ? agents.find((a) => a.name === agent)?.role.replace(/^The\s+/, "") ?? ""
    : "";
  const subjectLabel = solution?.label ?? agentLabel;

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset the success + error state a moment after the modal is dismissed.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setDone(false);
      setError(null);
      setTurnstileToken(null);
    }, 250);
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      agent: agent ?? null, // ← which agent this enquiry came from (tracking)
      solution: solution?.label ?? null, // ← or which solution page, for general enquiries
      source: typeof window !== "undefined" ? window.location.pathname : null,
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      teamSize: data.get("teamSize"),
      message: data.get("message"),
      token: turnstileToken,
      attribution: getAttributionPayload(),
    };

    setError(null);

    if (!turnstileToken) {
      setError("Security check not ready. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/b2b-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not send your enquiry.");
      }
      trackGenerateLead("b2b_lead");
      setDone(true);
      form.reset();
    } catch (err) {
      trackFormError("b2b_lead", "submit_failed");
      setError(err instanceof Error ? err.message : "Could not send your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-3/70 focus:border-orange/60 focus:ring-2 focus:ring-orange/15";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Contact us about ${subjectLabel}`}
        >
          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.97, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.24, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-black/[0.05] hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>

            {done ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-7 w-7" strokeWidth={3} aria-hidden />
                </span>
                <h3 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-ink">
                  Thanks, we&apos;ll be in touch.
                </h3>
                <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-[1.6] text-ink-2">
                  Our team will reach out about {subjectLabel} for your organisation shortly.
                </p>
                <p className="mx-auto mt-5 max-w-[320px] text-[13px] leading-[1.5] text-ink-3">
                  Prefer to talk sooner?
                </p>
                <CalButton
                  label="Book a 15-minute call"
                  source="b2b-enterprise-modal"
                  solution={solution?.label ?? null}
                  agent={agent ?? null}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.1] px-6 py-3 text-[14px] font-bold text-ink transition-colors hover:border-orange/40 hover:text-orange-deep"
                />
              </div>
            ) : (
              <>
                {/* Attribution badge — also the visible tracking cue */}
                <span className="inline-flex items-center gap-2 rounded-full border border-orange/25 bg-orange-light/40 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-orange-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
                  {subjectLabel}
                  {!solution && agentRole && (
                    <>
                      <span className="text-orange/40" aria-hidden>
                        ·
                      </span>
                      <span className="font-medium normal-case tracking-normal">
                        {agentRole}
                      </span>
                    </>
                  )}
                </span>

                <h3 className="mt-4 text-[24px] font-bold leading-[1.15] tracking-[-0.03em] text-ink">
                  {solution ? solution.heading : `Bring your ${agentRole || agentLabel} to your team`}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
                  Share a few details and we&apos;ll take it from there.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
                  <input type="hidden" name="agent" value={agent ?? ""} />
                  <input type="hidden" name="solution" value={solution?.label ?? ""} />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ec-name" className="sr-only">
                      Full name
                    </label>
                    <input
                      id="ec-name"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Full name"
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ec-email" className="sr-only">
                      Work email
                    </label>
                    <input
                      id="ec-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Work email"
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <input
                      id="ec-company"
                      name="company"
                      required
                      autoComplete="organization"
                      placeholder="Company"
                      className={fieldClass}
                      aria-label="Company"
                    />
                    <select
                      id="ec-team"
                      name="teamSize"
                      defaultValue=""
                      className={`${fieldClass} appearance-none text-ink-2`}
                      aria-label="Team size"
                    >
                      <option value="" disabled>
                        Team size
                      </option>
                      {TEAM_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ec-message" className="sr-only">
                      What are you looking to solve?
                    </label>
                    <textarea
                      id="ec-message"
                      name="message"
                      rows={3}
                      placeholder="What are you looking to solve? (optional)"
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  <TurnstileWidget
                    onVerify={setTurnstileToken}
                    onError={() => setError("Security check failed. Please refresh and try again.")}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group mt-1 inline-flex items-center justify-center gap-2.5 rounded-xl border border-black/[0.1] py-3.5 text-[16px] font-bold text-ink transition-colors hover:border-orange/40 hover:text-orange-deep disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? "Sending…" : "Request a conversation"}
                    {!submitting && (
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                  </button>
                  {error && (
                    <p className="text-center text-[13px] font-medium text-red-600">{error}</p>
                  )}
                </form>

                {/* Prefer to skip the form? Book a slot directly. */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-black/[0.07]" aria-hidden />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                    or
                  </span>
                  <div className="h-px flex-1 bg-black/[0.07]" aria-hidden />
                </div>
                <CalButton
                  label="Book a 15-minute call"
                  source="b2b-enterprise-modal"
                  solution={solution?.label ?? null}
                  agent={agent ?? null}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3.5 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
