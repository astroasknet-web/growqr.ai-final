"use client";

/* ══════════════════════════════════════════════════════════════════════════
   Expert Intake — reusable form field primitives
   Floating-label inputs with HARD character counters, select, image upload,
   repeatable string list, and the step progress bar. Visual language matches
   components/pages/ambassadors/AmbassadorsApply.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Plus, UploadCloud, X } from "lucide-react";

/* ── Char counter ──────────────────────────────────────────────────────────────
   Stays hidden until it's actually useful — only shows while the field is focused
   or once you're within ~25% of the limit. Keeps the form from reading as a wall
   of "0 / 40" counters. */
function Counter({ value, max, focused }: { value: string; max: number; focused?: boolean }) {
  if (!max) return null;
  const near = value.length >= Math.ceil(max * 0.75);
  if (!focused && !near) return null;
  const over = value.length >= max;
  return (
    <p className={["text-[11px] shrink-0 tabular-nums transition-opacity", over ? "text-orange font-semibold" : "text-ink-4"].join(" ")}>
      {value.length} / {max}
    </p>
  );
}

/* ── Floating input (hard maxChars) ────────────────────────────────────────── */
export function TextField({
  id, label, type = "text", value, onChange, onBlur, placeholder, error,
  required, maxChars, autoComplete, hint, numeric,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (val: string) => void; onBlur?: () => void; placeholder?: string;
  error?: string | null; required?: boolean; maxChars?: number; autoComplete?: string; hint?: string;
  /** Digits only — strips any non-numeric character as the user types. */
  numeric?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          inputMode={numeric ? "numeric" : undefined}
          value={value}
          onChange={(e) => {
            let v = e.target.value;
            if (numeric) v = v.replace(/[^\d]/g, "");
            if (maxChars && v.length > maxChars) return;
            onChange(v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          placeholder={lifted ? placeholder : ""}
          className={[
            "peer w-full rounded-xl border px-3.5 pb-2.5 pt-[22px] text-[13.5px] text-ink outline-none transition-all bg-white placeholder:text-ink-4",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-400/15"
              : focused
              ? "border-orange ring-[3px] ring-orange/12"
              : "border-black/15 hover:border-black/25",
          ].join(" ")}
        />
        <label
          htmlFor={id}
          className={[
            "pointer-events-none absolute left-3.5 font-medium transition-all duration-200 select-none",
            lifted ? "top-[7px] text-[10px] tracking-[0.05em] uppercase" : "top-1/2 -translate-y-1/2 text-[13.5px]",
            error ? "text-red-500" : focused ? "text-orange" : lifted ? "text-ink-3" : "text-ink-4",
          ].join(" ")}
        >
          {label}
          {required && <span className="text-orange ml-px">*</span>}
        </label>
      </div>
      <div className="flex items-start justify-between gap-2 mt-1 pl-0.5">
        {error ? (
          <p className="text-[11.5px] font-medium text-red-500 flex items-center gap-1">
            <span aria-hidden className="text-[10px]">●</span> {error}
          </p>
        ) : hint ? (
          <p className="text-[11.5px] text-ink-4 leading-snug">{hint}</p>
        ) : <span />}
        {maxChars ? <Counter value={value} max={maxChars} focused={focused} /> : null}
      </div>
    </div>
  );
}

/* ── Floating textarea (hard maxChars) ─────────────────────────────────────── */
export function TextAreaField({
  id, label, value, onChange, onBlur, placeholder, error, required, rows = 4, hint, maxChars,
}: {
  id: string; label: string; value: string; onChange: (val: string) => void; onBlur?: () => void;
  placeholder?: string; error?: string | null; required?: boolean; rows?: number; hint?: string; maxChars?: number;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;
  return (
    <div>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (maxChars && v.length > maxChars) return;
            onChange(v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          rows={rows}
          placeholder={lifted ? placeholder : ""}
          className={[
            "peer w-full rounded-xl border px-3.5 pb-3 pt-[26px] text-[13.5px] text-ink outline-none transition-all resize-none bg-white placeholder:text-ink-4",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-400/15"
              : focused
              ? "border-orange ring-[3px] ring-orange/12"
              : "border-black/15 hover:border-black/25",
          ].join(" ")}
        />
        <label
          htmlFor={id}
          className={[
            "pointer-events-none absolute left-3.5 font-medium transition-all duration-200 select-none",
            lifted ? "top-[7px] text-[10px] tracking-[0.05em] uppercase" : "top-[20px] text-[13.5px]",
            error ? "text-red-500" : focused ? "text-orange" : lifted ? "text-ink-3" : "text-ink-4",
          ].join(" ")}
        >
          {label}
          {required && <span className="text-orange ml-px">*</span>}
        </label>
      </div>
      <div className="flex items-start justify-between gap-2 mt-1 pl-0.5">
        {error ? (
          <p className="text-[11.5px] font-medium text-red-500 flex items-center gap-1">
            <span aria-hidden className="text-[10px]">●</span> {error}
          </p>
        ) : hint ? (
          <p className="text-[11.5px] text-ink-4">{hint}</p>
        ) : <span />}
        {maxChars ? <Counter value={value} max={maxChars} focused={focused} /> : null}
      </div>
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────────────────────
   Uses the same floating-label box as TextField (label pinned top-left inside the
   control) so selects and inputs sitting in the same grid row line up perfectly. */
export function SelectField({
  id, label, value, onChange, options, required, placeholder,
}: {
  id: string; label: string; value: string; onChange: (val: string) => void;
  options: readonly { value: string; label: string }[]; required?: boolean; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={[
          "peer w-full appearance-none rounded-xl border bg-white px-3.5 pb-2.5 pt-[22px] pr-9 text-[13.5px] text-ink outline-none transition-all",
          focused ? "border-orange ring-[3px] ring-orange/12" : "border-black/15 hover:border-black/25",
        ].join(" ")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute left-3.5 top-[7px] text-[10px] font-medium uppercase tracking-[0.05em] select-none transition-colors",
          focused ? "text-orange" : "text-ink-3",
        ].join(" ")}
      >
        {label}{required && <span className="text-orange ml-px">*</span>}
      </label>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4"
        viewBox="0 0 24 24" fill="none" aria-hidden
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* From / To year range that composes into a single "2019 – 2021" / "2025 – Present"
   duration string. The expert types the years (4-digit, numeric only) and flips a
   "Present" toggle for ongoing roles — so the stored shape stays a plain string
   but the format never gets mangled. */
const YEAR_INPUT_CLS =
  "w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-all hover:border-black/25 focus:border-orange focus:ring-[3px] focus:ring-orange/12 placeholder:text-ink-4 disabled:bg-black/[0.03] disabled:text-ink-4 disabled:cursor-not-allowed disabled:hover:border-black/15";

export function DurationField({
  value, onChange, required,
}: {
  value: string; onChange: (val: string) => void; required?: boolean;
}) {
  const parts = value.split(/\s*[–-]\s*/);
  const start = (parts[0] ?? "").trim();
  const rawEnd = (parts[1] ?? "").trim();
  const present = rawEnd.toLowerCase() === "present";
  const end = present ? "" : rawEnd;

  const onlyYear = (v: string) => v.replace(/[^\d]/g, "").slice(0, 4);
  const compose = (s: string, e: string, isPresent: boolean) => {
    const tail = isPresent ? "Present" : e;
    return s || tail ? [s, tail].filter(Boolean).join(" – ") : "";
  };

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">
        Duration{required && <span className="text-orange ml-0.5">*</span>}
      </p>
      <div className="flex items-center gap-2.5">
        <input
          type="text" inputMode="numeric" value={start} placeholder="From e.g. 2019" aria-label="From year"
          onChange={(e) => onChange(compose(onlyYear(e.target.value), end, present))}
          className={YEAR_INPUT_CLS}
        />
        <span className="shrink-0 text-ink-4" aria-hidden>–</span>
        <input
          type="text" inputMode="numeric" value={end} placeholder="To e.g. 2024" aria-label="To year"
          disabled={present}
          onChange={(e) => onChange(compose(start, onlyYear(e.target.value), false))}
          className={YEAR_INPUT_CLS}
        />
      </div>
      <label className="mt-2 inline-flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-ink-3">
        <input
          type="checkbox" checked={present}
          onChange={(e) => onChange(compose(start, end, e.target.checked))}
          className="h-3.5 w-3.5 accent-orange"
        />
        I currently work here (Present)
      </label>
    </div>
  );
}

/* ── Image upload ─────────────────────────────────────────────────────────── */
export function ImageUpload({
  value, onChange, label, kind, required, error, uploadToken, onTokenUsed,
}: {
  value: string; onChange: (url: string) => void; label: string; kind: string;
  required?: boolean; error?: string | null;
  /**
   * Turnstile token for the upload endpoint, owned by the PARENT form.
   *
   * Deliberately not per-instance: the intake form renders up to seven of these
   * at once (six testimonials plus the portrait), and giving each its own
   * widget would fire seven invisible challenges on one page. Uploads are
   * inherently sequential — a person picks one file at a time — so a single
   * token that is re-issued after each use is both sufficient and much lighter.
   */
  uploadToken?: string | null;
  /** Tells the parent to burn the token and fetch a fresh one (single-use). */
  onTokenUsed?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (f: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setUploadError("Use a PNG, JPG, or WebP image."); return;
    }
    if (f.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5 MB."); return; }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", kind);
      if (uploadToken) fd.append("token", uploadToken);
      const res = await fetch("/api/upload-expert-image", { method: "POST", body: fd });
      const data = await res.json();
      // Burn the token either way — Turnstile rejects a replay, so a retry with
      // the same one would fail for the wrong reason.
      onTokenUsed?.();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url ?? data.path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
      onChange("");
    } finally {
      setUploading(false);
    }
  }, [kind, onChange, uploadToken, onTokenUsed]);

  return (
    <div>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.1em] ${error ? "text-red-500" : "text-ink-3"}`}>
        {label}{required && <span className="text-orange ml-0.5">*</span>}
      </p>
      {value && !uploading ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          <p className="flex-1 text-[12.5px] font-semibold text-green-800">Image uploaded</p>
          <button
            type="button"
            onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full hover:bg-green-200 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5 text-green-700" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) upload(e.dataTransfer.files[0]); }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={[
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all cursor-pointer",
            uploading ? "pointer-events-none" : "",
            dragging ? "border-orange bg-orange/5"
              : error ? "border-red-300 bg-red-50/50 hover:border-red-400"
              : "border-black/15 bg-white hover:border-orange/50 hover:bg-orange/[0.02]",
          ].join(" ")}
        >
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); }} />
          {uploading ? (
            <Loader2 className="h-6 w-6 text-orange animate-spin" />
          ) : (
            <>
              <div className={["flex h-10 w-10 items-center justify-center rounded-xl transition-colors", dragging ? "bg-orange/15" : "bg-black/[0.04]"].join(" ")}>
                <UploadCloud className={["h-5 w-5", dragging ? "text-orange" : "text-ink-3"].join(" ")} />
              </div>
              <p className="text-[13px] font-semibold text-ink">Drop image, or <span className="text-orange">browse</span></p>
              <p className="text-[11px] text-ink-4">PNG / JPG / WebP · Max 5 MB</p>
            </>
          )}
        </div>
      )}
      {(uploadError || error) && (
        <p className="mt-1.5 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
          <span aria-hidden className="text-[10px]">●</span> {uploadError || error}
        </p>
      )}
    </div>
  );
}

/* ── Repeatable string list (tags) ─────────────────────────────────────────── */
export function StringListField({
  label, values, onChange, maxChars, min, max, placeholder, hint,
}: {
  label: string; values: string[]; onChange: (vals: string[]) => void; maxChars: number;
  min: number; max: number; placeholder?: string; hint?: string;
}) {
  const filled = values.filter((v) => v.trim()).length;
  const optional = min === 0;
  const set = (i: number, v: string) => {
    if (v.length > maxChars) return;
    onChange(values.map((x, idx) => (idx === i ? v : x)));
  };
  const add = () => { if (values.length < max) onChange([...values, ""]); };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">
            {label}
            {!optional && <span className="text-orange ml-0.5">*</span>}
          </p>
          {hint && <p className="text-[11px] text-ink-4 mt-0.5">{hint}</p>}
        </div>
        <span className={["text-[11px] tabular-nums", filled < min ? "text-orange font-semibold" : "text-ink-4"].join(" ")}>
          {filled} / {optional ? max : `${min}–${max}`}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                value={v}
                onChange={(e) => set(i, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-black/15 bg-white pl-3.5 pr-14 py-2.5 text-[13.5px] text-ink outline-none transition-all hover:border-black/25 focus:border-orange focus:ring-[3px] focus:ring-orange/12 placeholder:text-ink-4"
              />
              {v.length >= Math.ceil(maxChars * 0.75) && (
                <span className={["absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums", v.length >= maxChars ? "text-orange font-semibold" : "text-ink-4"].join(" ")}>
                  {v.length}/{maxChars}
                </span>
              )}
            </div>
            {values.length > Math.max(min, 1) && (
              <button type="button" onClick={() => remove(i)} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-ink-4 hover:bg-black/5 hover:text-red-500 transition-colors" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {values.length < max && (
        <button type="button" onClick={add} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-orange hover:text-orange-dark transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

/* ── Card row wrapper for repeatable object sections ───────────────────────── */
export function CardRow({ index, onRemove, removable, children }: {
  index: number; onRemove?: () => void; removable?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-black/10 bg-black/[0.015] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-4">#{index + 1}</span>
        {removable && onRemove && (
          <button type="button" onClick={onRemove} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-4 hover:bg-black/5 hover:text-red-500 transition-colors" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function AddCardButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 py-2.5 text-[12.5px] font-semibold text-ink-3 transition-colors hover:border-orange/50 hover:text-orange disabled:cursor-not-allowed disabled:opacity-40">
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ── Step progress bar ─────────────────────────────────────────────────────── */
export function StepProgress({ steps, current }: { steps: { id: number; label: string }[]; current: number }) {
  return (
    <div className="flex items-start gap-0 mb-7">
      {steps.map((step, i) => (
        <div key={step.id} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={[
              "grid h-7 w-7 place-items-center rounded-full border-2 font-mono text-[11px] font-bold transition-all duration-300",
              current > step.id ? "bg-orange border-orange text-white"
                : current === step.id ? "bg-white border-orange text-orange shadow-[0_0_0_4px_rgba(255,106,47,0.1)]"
                : "bg-white border-black/12 text-ink-4",
            ].join(" ")}>
              {current > step.id ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} /> : step.id}
            </div>
            <span className={[
              "text-[9px] font-semibold tracking-[0.04em] uppercase text-center leading-tight max-w-[64px]",
              current === step.id ? "text-orange" : current > step.id ? "text-orange-deep" : "text-ink-4",
            ].join(" ")}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mb-[20px] mx-2">
              <div className="h-px bg-black/8 relative overflow-hidden rounded-full">
                <div className="h-full bg-orange transition-all duration-500 ease-out" style={{ width: current > step.id ? "100%" : "0%" }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
