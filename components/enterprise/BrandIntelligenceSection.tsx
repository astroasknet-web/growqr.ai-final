"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, FileText, Globe, Loader2, Mail } from "lucide-react";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { Eyebrow } from "@/components/home/SectionHeader";
import CalButton from "@/components/ui/CalButton";

const ease = [0.22, 1, 0.36, 1] as const;
const INK = "#333333";

type Step = "website" | "social" | "processing" | "email" | "success";

const CATEGORIES = [
  "Brand Visibility",
  "Positioning Analysis",
  "Trust Signals",
  "Content Opportunities",
  "Growth Recommendations",
];

const PROCESSING_TASKS = [
  "Scanning brand visibility",
  "Analyzing positioning",
  "Checking trust signals",
  "Finding content opportunities",
  "Preparing growth recommendations",
];

const TASK_DELAY_MS = 680;

/** Ordered input steps → drives the progress bar (success = complete). */
const FLOW_STEPS: Step[] = ["website", "social", "processing", "email"];

/** Small uppercase label shown top-left of the card per step. */
const STEP_LABEL: Record<Step, string> = {
  website: "Company",
  social: "Channels",
  processing: "Analyzing",
  email: "Delivery",
  success: "Complete",
};

const stepVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
const stepTransition = { duration: 0.34, ease };

/* ─── CTA pill (full-width inside the card) ─── */
function CTAButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      className={`group w-full inline-flex items-center justify-center gap-2.5 text-white text-[15px] font-semibold py-4 rounded-xl transition-all duration-300
        ${
          disabled
            ? "bg-orange/35 cursor-not-allowed"
            : "bg-orange hover:bg-orange-dark cursor-pointer shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
        }`}
    >
      {label}
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-white/20 text-[12px] transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </motion.button>
  );
}

/* ─── Labeled field ─── */
function LabeledField({
  label,
  optional = false,
  icon,
  iconColor,
  value,
  onChange,
  onEnter,
  placeholder,
  type = "text",
  autoFocus = false,
}: {
  label: string;
  optional?: boolean;
  icon: React.ReactNode;
  iconColor?: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="w-full text-left">
      <label className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        {optional && <span className="text-[12px] text-ink-4">Optional</span>}
      </label>
      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          style={iconColor ? { color: iconColor } : { color: "#9aa0a6" }}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-black/[0.10] bg-cream-2/50 text-[15px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/50 focus:bg-white transition-all"
        />
      </div>
    </div>
  );
}

/* ─── Step 1: Website (required) ─── */
function StepWebsite({ onNext }: { onNext: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [hint, setHint] = useState(false);
  const shake = useAnimationControls();

  const submit = () => {
    if (url.trim()) {
      onNext(url.trim());
      return;
    }
    setHint(true);
    shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.42, ease } });
  };

  return (
    <div className="flex flex-col gap-5">
      <motion.div animate={shake}>
        <LabeledField
          label="Company website"
          icon={<Globe className="w-[18px] h-[18px] text-orange" />}
          iconColor="#FF6A2F"
          value={url}
          onChange={(v) => {
            setUrl(v);
            if (hint) setHint(false);
          }}
          onEnter={submit}
          placeholder="https://yourcompany.com"
          autoFocus
        />
        <AnimatePresence>
          {hint && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease }}
              className="mt-2 text-[12.5px] font-medium text-orange-deep"
            >
              Add your company website to continue.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
      <CTAButton label="Analyze My Brand" onClick={submit} />
    </div>
  );
}

/* ─── Step 2: Social (optional) ─── */
function StepSocial({
  onNext,
  onSkip,
}: {
  onNext: (linkedin: string, instagram: string) => void;
  onSkip: () => void;
}) {
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <LabeledField
        label="LinkedIn company page"
        optional
        icon={<FaLinkedinIn className="w-4 h-4" />}
        iconColor="#0A66C2"
        value={linkedin}
        onChange={setLinkedin}
        placeholder="linkedin.com/company/yourbrand"
        autoFocus
      />
      <LabeledField
        label="Instagram profile"
        optional
        icon={<FaInstagram className="w-4 h-4" />}
        iconColor="#E1306C"
        value={instagram}
        onChange={setInstagram}
        placeholder="instagram.com/yourbrand"
      />
      <div className="flex flex-col gap-3">
        <CTAButton label="Generate Report" onClick={() => onNext(linkedin, instagram)} />
        <button
          type="button"
          onClick={onSkip}
          className="text-[13.5px] text-ink-4 hover:text-ink transition-colors py-1"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Processing ─── */
function StepProcessing({ onDone }: { onDone: () => void }) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed >= PROCESSING_TASKS.length) {
      const t = setTimeout(onDone, 460);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCompleted((c) => c + 1), TASK_DELAY_MS);
    return () => clearTimeout(t);
  }, [completed, onDone]);

  return (
    <div className="flex flex-col gap-3.5 text-left">
      {PROCESSING_TASKS.map((task, i) => {
        const done = i < completed;
        const active = i === completed;
        const pending = i > completed;
        return (
          <motion.div
            key={task}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
            transition={{ duration: 0.28, delay: i * 0.05, ease }}
            className="flex items-center gap-3"
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.22, ease: [0.22, 1.5, 0.36, 1] }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-orange" strokeWidth={2} />
                  </motion.div>
                ) : active ? (
                  <Loader2 className="w-[18px] h-[18px] text-orange animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-black/[0.16]" />
                )}
              </AnimatePresence>
            </div>
            <span className={`text-[14.5px] font-medium ${done || active ? "text-ink" : "text-ink-4"}`}>
              {task}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Step 4: Business email ─── */
function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="flex flex-col gap-5">
      <LabeledField
        label="Work email"
        icon={<Mail className="w-4 h-4" />}
        type="email"
        value={email}
        onChange={setEmail}
        onEnter={() => valid && onNext(email)}
        placeholder="you@company.com"
        autoFocus
      />
      <CTAButton label="Send My Report" onClick={() => onNext(email)} disabled={!valid} />
    </div>
  );
}

/* ─── Step 5: Success — premium "report ready" artifact ─── */
function StepSuccess({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col gap-6"
    >
      {/* Confirmation */}
      <div className="flex flex-col items-center text-center gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1.5, 0.36, 1] }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white shadow-[0_12px_28px_-10px_rgba(255,106,47,0.6)]"
          style={{ background: "radial-gradient(circle at 35% 30%, #FF8A5C, #FF6A2F 60%, #D44F1A)" }}
        >
          <Check className="w-6 h-6" strokeWidth={3} />
        </motion.span>
        <div>
          <p className="text-[18px] font-semibold text-ink tracking-[-0.01em]">
            Your report is being prepared
          </p>
          <p className="mt-1 text-[13.5px] text-ink-3">
            {email ? (
              <>
                Arriving at <span className="font-semibold text-ink">{email}</span>
              </>
            ) : (
              "Landing in your inbox shortly."
            )}
          </p>
        </div>
      </div>

      {/* Report artifact — looks like the deliverable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease }}
        className="rounded-2xl border border-black/[0.08] overflow-hidden bg-white shadow-[0_18px_44px_-30px_rgba(0,0,0,0.4)]"
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5 text-white"
          style={{ background: "linear-gradient(135deg, #FF6A2F, #D44F1A)" }}
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
            <FileText className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold leading-tight">AI Brand Intelligence Report</p>
            <p className="text-[11px] text-white/80 mt-0.5">5 sections · PDF · ~2 min</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] bg-white/15 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulseDot" />
            Preparing
          </span>
        </div>
        <div className="p-4 flex flex-col gap-2.5">
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.07, ease }}
              className="flex items-center gap-2.5"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-orange-lighter flex-shrink-0">
                <Check className="w-3 h-3 text-orange" strokeWidth={3} />
              </span>
              <span className="text-[13.5px] font-medium text-ink">{c}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <CalButton
        source="brand-intelligence"
        label="Want a walkthrough? Book a demo"
        className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-orange-deep hover:text-orange transition-colors"
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section
   ═══════════════════════════════════════════════════════════════════════════ */
export default function BrandIntelligenceSection() {
  const [step, setStep] = useState<Step>("website");
  const [email, setEmail] = useState("");

  const idx = step === "success" ? FLOW_STEPS.length : FLOW_STEPS.indexOf(step);
  const pct = ((idx + (step === "success" ? 0 : 1)) / FLOW_STEPS.length) * 100;
  const stepNum = Math.min(idx + 1, FLOW_STEPS.length);

  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-14"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      <div className="mx-auto max-w-[1440px]">
        {/* Heading — stable, the big promise */}
        <div className="max-w-[680px] mx-auto text-center">
          <Eyebrow center>Brand Intelligence</Eyebrow>
          <h2
            className="mt-3 text-[30px] sm:text-[38px] md:text-[44px] xl:text-[50px] font-medium leading-[1.05] tracking-[-0.03em] md:tracking-[-0.04em]"
            style={{ color: INK }}
          >
            See how your brand{" "}
            <span className="text-orange">actually shows up.</span>
          </h2>
        </div>

        {/* The tool card */}
        <div className="mt-12 md:mt-14 mx-auto w-full max-w-[480px]">
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-7 md:p-8 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.45)]">
            {/* Progress header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-deep">
                {STEP_LABEL[step]}
              </span>
              <span className="text-[11.5px] font-semibold text-ink-4">
                {step === "success" ? "Done" : `Step ${stepNum} of ${FLOW_STEPS.length}`}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-black/[0.07] overflow-hidden mb-7">
              <motion.div
                className="h-full bg-orange rounded-full"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease }}
              />
            </div>

            {/* Step content */}
            <div className="min-h-[210px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                >
                  {step === "website" && <StepWebsite onNext={() => setStep("social")} />}
                  {step === "social" && (
                    <StepSocial
                      onNext={() => setStep("processing")}
                      onSkip={() => setStep("processing")}
                    />
                  )}
                  {step === "processing" && <StepProcessing onDone={() => setStep("email")} />}
                  {step === "email" && (
                    <StepEmail
                      onNext={(e) => {
                        setEmail(e);
                        setStep("success");
                      }}
                    />
                  )}
                  {step === "success" && <StepSuccess email={email} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
