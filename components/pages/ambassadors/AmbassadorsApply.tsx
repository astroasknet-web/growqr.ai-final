"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, ChevronDown, UploadCloud, FileText, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/ui/TurnstileWidget";
import INDIAN_COLLEGES from "@/lib/indian-colleges";
import { APPLICATIONS_OPEN } from "./ambassadors-data";
import {
  trackGenerateLead,
  trackFormStart,
  trackFormStepComplete,
  trackFormError,
} from "@/lib/analytics";

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = {
  fullName: string; email: string; phone: string; whatsapp: string;
  studentId: string; gender: string; aadhaarNumber: string;
  college: string; collegeLocation: string; course: string; passingYear: string;
  homeTown: string; currentAddress: string; linkedin: string;
  instagram: string; youtube: string; resume: string;
  whyJoin: string; whyFit: string; ledSomething: string; experience: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  fullName: "", email: "", phone: "", whatsapp: "", studentId: "",
  gender: "", aadhaarNumber: "",
  college: "", collegeLocation: "", course: "", passingYear: "",
  homeTown: "", currentAddress: "",
  linkedin: "", instagram: "", youtube: "", resume: "",
  whyJoin: "", whyFit: "", ledSomething: "", experience: "",
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

// ─── Fuzzy college scorer ─────────────────────────────────────────────────────

function scoreCollege(college: string, query: string): number {
  const c = college.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (c === q) return 100;
  if (c.startsWith(q)) return 90;
  const tokens = q.split(/\s+/).filter(Boolean);
  const allMatch = tokens.every(t => c.includes(t));
  if (allMatch) return 70 + tokens.length * 5;
  const matchedCount = tokens.filter(t => c.includes(t)).length;
  if (matchedCount > 0) return 30 + (matchedCount / tokens.length) * 30;
  return 0;
}

function searchColleges(query: string, limit = 8): string[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return INDIAN_COLLEGES
    .map(c => ({ c, score: scoreCollege(c, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c);
}

// ─── Field validation ────────────────────────────────────────────────────────

function validate(key: keyof FormState, value: string): string | null {
  switch (key) {
    case "fullName":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Enter your full name";
      return null;
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
      return null;
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (value.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit number";
      return null;
    case "college":
      if (!value.trim()) return "College name is required";
      return null;
    case "collegeLocation":
      if (!value.trim()) return "Campus location is required";
      return null;
    case "course":
      if (!value.trim()) return "Course is required";
      return null;
    case "passingYear":
      if (!value.trim()) return "Passing year is required";
      if (!/^\d{4}$/.test(value.trim())) return "Enter a valid 4-digit year";
      return null;
    case "whatsapp":
      if (!value.trim()) return "WhatsApp number is required";
      if (value.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit number";
      return null;
    case "studentId":
      if (!value.trim()) return "Student ID is required";
      return null;
    case "gender":
      if (!value) return "Please select your gender";
      return null;
    case "aadhaarNumber":
      if (!value.trim()) return "Aadhaar number is required";
      if (!/^\d{12}$/.test(value.replace(/\D/g, ""))) return "Enter a valid 12-digit Aadhaar number";
      return null;
    case "homeTown":
      if (!value.trim()) return "Home town is required";
      return null;
    case "currentAddress":
      if (!value.trim()) return "Current address is required";
      if (value.trim().length < 5) return "Enter your full current address";
      return null;
    case "linkedin":
      if (!value.trim()) return "LinkedIn profile is required";
      if (!value.includes("linkedin.com") && !/^https?:\/\/.+/.test(value))
        return "Enter your LinkedIn URL";
      return null;
    case "resume":
      if (!value.trim()) return "Please upload your resume PDF";
      return null;
    case "whyJoin":
      if (!value.trim()) return "This field is required";
      if (value.trim().split(/\s+/).filter(Boolean).length < 10) return "Write at least 10 words";
      return null;
    case "whyFit":
      if (!value.trim()) return "This field is required";
      if (value.trim().split(/\s+/).filter(Boolean).length < 10) return "Write at least 10 words";
      return null;
    case "ledSomething":
      if (!value) return "Please select an option";
      return null;
    default:
      return null;
  }
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "About You" },
  { id: 2, label: "Details" },
  { id: 3, label: "Presence" },
  { id: 4, label: "Your Story" },
] as const;

const STEP_FIELDS: Record<number, (keyof FormState)[]> = {
  1: ["fullName", "email", "phone", "whatsapp", "college", "course", "passingYear", "studentId"],
  2: ["gender", "aadhaarNumber", "collegeLocation", "homeTown", "currentAddress"],
  3: ["linkedin", "resume"],
  4: ["whyJoin", "whyFit", "ledSomething"],
};

// ─── College Autocomplete ─────────────────────────────────────────────────────

function CollegeAutocomplete({
  value, onChange, onBlur, error,
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string | null;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const skipOpenRef = useRef(false);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (skipOpenRef.current) {
      skipOpenRef.current = false;
      return;
    }
    
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }

    // Immediate fuzzy results from local dataset
    const staticResults = searchColleges(query);
    setSuggestions(staticResults);
    setOpen(true);
    setHighlighted(-1);

    // Debounced API fetch to enrich with any extra results
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const apiResults: string[] = await res.json();
        if (apiResults.length > 0) {
          const merged = [...new Set([...staticResults, ...apiResults])].slice(0, 8);
          setSuggestions(merged);
        }
      } catch { /* keep local results */ }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const select = useCallback((college: string) => {
    skipOpenRef.current = true;
    setQuery(college);
    onChange(college);
    setOpen(false);
    onBlur?.();
  }, [onChange, onBlur]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      select(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const lifted = focused || !!query;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          autoComplete="off"
          id="college-combobox"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="college-listbox"
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onKeyDown={handleKey}
          placeholder={lifted ? "Start typing your college name…" : ""}
          className={[
            "peer w-full rounded-xl border px-3.5 pb-2.5 pt-[22px] text-[13.5px] text-ink outline-none transition-all bg-white placeholder:text-ink-4 pr-9",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-400/15"
              : focused
              ? "border-orange ring-[3px] ring-orange/12"
              : "border-black/15 hover:border-black/25",
          ].join(" ")}
        />
        <label
          htmlFor="college-combobox"
          className={[
            "pointer-events-none absolute left-3.5 font-medium transition-all duration-200 select-none",
            lifted ? "top-[7px] text-[10px] tracking-[0.05em] uppercase" : "top-1/2 -translate-y-1/2 text-[13.5px]",
            error ? "text-red-500" : focused ? "text-orange" : lifted ? "text-ink-3" : "text-ink-4",
          ].join(" ")}
        >
          College / University<span className="text-orange ml-px">*</span>
        </label>
        <ChevronDown
          className={[
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform duration-200",
            open ? "rotate-180 text-orange" : "text-ink-4",
          ].join(" ")}
        />
      </div>

      {error && (
        <p className="mt-1 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
          <span aria-hidden className="text-[10px]">●</span> {error}
        </p>
      )}

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            ref={listRef}
            id="college-listbox"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-black/10 bg-white shadow-[0_8px_32px_-8px_rgba(17,24,39,0.18)] overflow-hidden"
          >
            {suggestions.map((college, i) => {
              const q = query.toLowerCase();
              const idx = college.toLowerCase().indexOf(q);
              return (
                <li
                  key={college}
                  role="option"
                  aria-selected={highlighted === i}
                  onMouseDown={() => select(college)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={[
                    "px-3.5 py-3 text-[13px] leading-snug cursor-pointer transition-colors",
                    highlighted === i ? "bg-orange/6 text-orange" : "text-ink hover:bg-black/[0.03]",
                  ].join(" ")}
                >
                  {/* A single text node (not separate flex items) so a long
                      name wraps as one continuous line instead of splitting
                      the highlighted match onto its own row. */}
                  {idx >= 0 ? (
                    <>
                      {college.slice(0, idx)}
                      <span className="font-semibold">{college.slice(idx, idx + query.length)}</span>
                      {college.slice(idx + query.length)}
                    </>
                  ) : college}
                </li>
              );
            })}
            {query.length >= 2 && (
              <li
                onMouseDown={() => select(query)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] text-ink-4 border-t border-black/5 cursor-pointer hover:bg-black/[0.03]"
              >
                <span className="text-orange text-[10px]">+</span>
                Use &ldquo;{query}&rdquo;
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Floating Input ──────────────────────────────────────────────────────────

function FloatingInput({
  id, label, type = "text", value, onChange, onBlur,
  placeholder, error, required, optional, autoComplete, maxLength, inputMode,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void; placeholder?: string; error?: string | null;
  required?: boolean; optional?: boolean; autoComplete?: string; maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode ?? (type === "tel" ? "numeric" : type === "number" ? "numeric" : undefined)}
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
          {optional && <span className="ml-1.5 text-[9px] font-mono normal-case tracking-normal text-ink-4 font-normal">optional</span>}
        </label>
      </div>
      {error && (
        <p className="mt-1 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
          <span aria-hidden className="text-[10px]">●</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Floating Select ─────────────────────────────────────────────────────────

function FloatingSelect({
  id, label, value, onChange, onBlur, options, error, required,
}: {
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void; options: { value: string; label: string }[];
  error?: string | null; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;

  return (
    <div>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          className={[
            "peer w-full rounded-xl border px-3.5 pb-2.5 pt-[22px] text-[13.5px] text-ink outline-none transition-all bg-white appearance-none pr-9 cursor-pointer",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-400/15"
              : focused
              ? "border-orange ring-[3px] ring-orange/12"
              : "border-black/15 hover:border-black/25",
          ].join(" ")}
        >
          <option value="" disabled hidden />
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
        <ChevronDown
          className={[
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform duration-200",
            focused ? "text-orange" : "text-ink-4",
          ].join(" ")}
        />
      </div>
      {error && (
        <p className="mt-1 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
          <span aria-hidden className="text-[10px]">●</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Floating Textarea ───────────────────────────────────────────────────────

function countWords(str: string) {
  return str.trim() === "" ? 0 : str.trim().split(/\s+/).length;
}

function FloatingTextarea({
  id, label, value, onChange, onBlur, placeholder,
  error, required, rows = 4, hint, maxWords, maxLength,
}: {
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void; placeholder?: string; error?: string | null;
  required?: boolean; rows?: number; hint?: string; maxWords?: number; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || !!value;
  const words = maxWords ? countWords(value) : 0;
  const overLimit = maxWords ? words > maxWords : false;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (maxWords && countWords(e.target.value) > maxWords) return;
    onChange(e);
  };

  return (
    <div>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          rows={rows}
          maxLength={maxLength}
          placeholder={lifted ? placeholder : ""}
          className={[
            "peer w-full rounded-xl border px-3.5 pb-3 pt-[26px] text-[13.5px] text-ink outline-none transition-all resize-none bg-white placeholder:text-ink-4",
            error || overLimit
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
        {maxWords && value.length > 0 && (
          <p className={["text-[11px] shrink-0 tabular-nums", words >= maxWords ? "text-orange font-semibold" : "text-ink-4"].join(" ")}>
            {words} / {maxWords} words
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Resume Upload ────────────────────────────────────────────────────────────

function ResumeUpload({
  value, onChange, error,
}: {
  value: string;
  onChange: (url: string) => void;
  error?: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The uploader carries its OWN Turnstile token rather than reusing the one
  // the application form holds. A Turnstile token is single-use at siteverify,
  // so sharing one would make whichever request ran second fail.
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const upload = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10 MB.");
      return;
    }
    setFile(f);
    setUploading(true);
    setUploadError(null);
    setProgress(0);

    // Simulate progress while uploading
    const tick = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 200);

    try {
      const fd = new FormData();
      fd.append("file", f);
      if (uploadToken) fd.append("token", uploadToken);
      const res = await fetch("/api/upload-resume", { method: "POST", body: fd });
      const data = await res.json();
      clearInterval(tick);
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProgress(100);
      onChange(data.url ?? data.path);
      // Tokens are single-use, so fetch a fresh one in case the applicant
      // replaces the file before submitting.
      setUploadToken(null);
      turnstileRef.current?.reset();
    } catch (err) {
      clearInterval(tick);
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setFile(null);
      setProgress(0);
      onChange("");
    } finally {
      setUploading(false);
    }
  }, [onChange, uploadToken]);

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) upload(files[0]);
  };

  const remove = () => {
    setFile(null);
    setProgress(0);
    setUploadError(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const uploaded = !!value && !uploading;

  return (
    <div>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.1em] ${error ? "text-red-500" : "text-ink-3"}`}>
        Resume (PDF)<span className="text-orange ml-0.5">*</span>
      </p>

      {uploaded ? (
        // Uploaded state
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-green-800 truncate">{file?.name ?? "Resume uploaded"}</p>
            <p className="text-[11px] text-green-600">
              {file ? `${(file.size / 1024).toFixed(0)} KB · PDF` : "PDF · Uploaded"}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full hover:bg-green-200 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5 text-green-700" />
          </button>
        </div>
      ) : (
        // Drop zone
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={[
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all cursor-pointer",
            uploading ? "pointer-events-none" : "",
            dragging
              ? "border-orange bg-orange/5 scale-[1.01]"
              : error
              ? "border-red-300 bg-red-50/50 hover:border-red-400"
              : "border-black/15 bg-white hover:border-orange/50 hover:bg-orange/[0.02]",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          {/* Invisible — gates the 10 MB storage write behind the same bot
              check as the form itself. */}
          <TurnstileWidget ref={turnstileRef} onVerify={setUploadToken} />

          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 text-orange animate-spin" />
              <div className="w-full max-w-[200px]">
                <div className="h-1.5 w-full rounded-full bg-black/8 overflow-hidden">
                  <motion.div
                    className="h-full bg-orange rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-ink-4">Uploading… {progress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className={["flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                dragging ? "bg-orange/15" : "bg-black/[0.04]"].join(" ")}>
                <UploadCloud className={["h-5 w-5 transition-colors", dragging ? "text-orange" : "text-ink-3"].join(" ")} />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  Drop your PDF here, or{" "}
                  <span className="text-orange">browse</span>
                </p>
                <p className="text-[11.5px] text-ink-4 mt-0.5">PDF only · Max 10 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {(uploadError || error) && (
        <p className="mt-1.5 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
          <span aria-hidden className="text-[10px]">●</span>
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-start gap-0 mb-7">
      {STEPS.map((step, i) => (
        <div key={step.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className={[
                "grid h-7 w-7 place-items-center rounded-full border-2 font-mono text-[11px] font-bold transition-all duration-300",
                current > step.id
                  ? "bg-orange border-orange text-white"
                  : current === step.id
                  ? "bg-white border-orange text-orange shadow-[0_0_0_4px_rgba(255,106,47,0.1)]"
                  : "bg-white border-black/12 text-ink-4",
              ].join(" ")}
            >
              {current > step.id ? (
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                step.id
              )}
            </div>
            <span
              className={[
                "text-[9.5px] font-semibold tracking-[0.05em] uppercase",
                current === step.id ? "text-orange" : current > step.id ? "text-orange-deep" : "text-ink-4",
              ].join(" ")}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 mb-[20px] mx-2">
              <div className="h-px bg-black/8 relative overflow-hidden rounded-full">
                <div
                  className="h-full bg-orange transition-all duration-500 ease-out"
                  style={{ width: current > step.id ? "100%" : "0%" }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Closed / Waitlist Screen ────────────────────────────────────────────────

function ClosedScreen() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadySignedUp, setAlreadySignedUp] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setServerError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }

    // Honeypot — silently succeed for bots
    if (honeypot) { setDone(true); return; }

    if (!turnstileToken) {
      setServerError("Security check not ready. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ambassador-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, token: turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) { setAlreadySignedUp(true); setDone(true); return; }
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      trackGenerateLead("ambassador_waitlist");
      setDone(true);
    } catch (err) {
      trackFormError("ambassador_waitlist", "submit_failed");
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream/40 pt-20 pb-16 px-4 md:px-6">
      <div className="max-w-[640px] mx-auto">
        <Link
          href="/ambassadors"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-orange transition-colors mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Ambassador Program
        </Link>

        <div className="rounded-2xl border border-black/8 bg-white shadow-[0_24px_60px_-18px_rgba(17,24,39,0.12)] overflow-hidden">
          <div className="px-5 md:px-8 py-12 flex flex-col items-center text-center">

            {done ? (
              <>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-orange/10 mb-5">
                  <CheckCircle2 className="h-8 w-8 text-orange" strokeWidth={1.5} />
                </div>
                <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink mb-2.5">
                  {alreadySignedUp ? "Already on the list!" : "You're on the list!"}
                </h2>
                <p className="text-[14.5px] text-ink-3 leading-relaxed max-w-[420px]">
                  {alreadySignedUp
                    ? <>This email is already registered. We&apos;ll notify <span className="font-semibold text-ink">{email}</span> when the next cohort opens.</>
                    : <>We&apos;ll notify you at <span className="font-semibold text-ink">{email}</span> the moment the next cohort opens.</>
                  }
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/ambassadors")}
                  className="mt-8 inline-flex items-center gap-2 bg-orange text-white text-[14px] font-semibold px-6 py-3 rounded-full transition hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)]"
                >
                  Back to Ambassador Program
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] border border-black/8 px-3.5 py-1.5 mb-5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-4">Applications Closed</span>
                </div>
                <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink mb-2.5">
                  Cohort 02 is full.
                </h2>
                <p className="text-[14.5px] text-ink-3 leading-relaxed max-w-[440px]">
                  The application window has closed. Drop your email below and we&apos;ll be the first to notify you when Cohort 03 opens.
                </p>

                <form onSubmit={handleNotify} noValidate className="mt-7 w-full max-w-[400px]">
                  {/* Honeypot — hidden from real users */}
                  <input
                    type="text"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(null); setServerError(null); }}
                        placeholder="your@email.com"
                        autoComplete="email"
                        className={[
                          "w-full rounded-xl border px-4 py-3 text-[13.5px] text-ink outline-none transition-all bg-white placeholder:text-ink-4",
                          emailError
                            ? "border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-400/15"
                            : "border-black/15 hover:border-black/25 focus:border-orange focus:ring-[3px] focus:ring-orange/12",
                        ].join(" ")}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 bg-orange text-white text-[13.5px] font-semibold px-5 py-3 rounded-xl transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify Me"}
                    </button>
                  </div>

                  {emailError && (
                    <p className="mt-1.5 text-[11.5px] font-medium text-red-500 flex items-center gap-1 text-left">
                      <span aria-hidden className="text-[10px]">●</span> {emailError}
                    </p>
                  )}
                  {serverError && (
                    <p className="mt-1.5 text-[11.5px] font-medium text-red-500 flex items-center gap-1 text-left">
                      <span aria-hidden>⚠</span> {serverError}
                    </p>
                  )}

                  <TurnstileWidget
                    onVerify={setTurnstileToken}
                    onError={() => setServerError("Security check failed. Please refresh and try again.")}
                    className="mt-3"
                  />
                </form>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-4">
          Questions? Email us at{" "}
          <a href="mailto:support@growqr.ai" className="text-orange hover:underline">support@growqr.ai</a>
        </p>
      </div>
    </div>
  );
}

// ─── Apply Form (standalone page) ────────────────────────────────────────────

export function ApplyForm() {
  if (!APPLICATIONS_OPEN) return <ClosedScreen />;
  return <ApplyFormInner />;
}

function ApplyFormInner() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);

  // Capture UTM attribution from the landing URL once on mount, so it survives
  // the multi-step flow and is sent with the submission (utm_medium = ambassador).
  const utmRef = useRef({ utmSource: "", utmMedium: "", utmCampaign: "" });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    utmRef.current = {
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
    };
  }, []);

  useEffect(() => {
    trackFormStart("ambassador_apply");
  }, []);

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [key]: val }));
    if (touched[key]) {
      const err = validate(key, val);
      setErrors((p) => ({ ...p, [key]: err ?? undefined }));
    }
  };

  /**
   * Digit-only fields. `maxLength` alone doesn't work for these: it counts
   * spaces and hyphens, so "1234 5678 9012" gets cut off at the 12th
   * keystroke, and it's ignored outright on `type="number"`. Stripping on
   * input means the applicant can type or paste a spaced Aadhaar number and
   * still end up with 12 digits.
   */
  const updateDigits = (key: keyof FormState, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, max);
    setForm((p) => ({ ...p, [key]: digits }));
    if (touched[key]) {
      const err = validate(key, digits);
      setErrors((p) => ({ ...p, [key]: err ?? undefined }));
    }
  };

  const updateField = (key: keyof FormState) => (val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (touched[key]) {
      const err = validate(key, val);
      setErrors((p) => ({ ...p, [key]: err ?? undefined }));
    }
  };

  const blur = (key: keyof FormState) => () => {
    setTouched((p) => ({ ...p, [key]: true }));
    const err = validate(key, form[key]);
    setErrors((p) => ({ ...p, [key]: err ?? undefined }));
  };

  const validateStep = (fields: (keyof FormState)[]) => {
    const newErrors: Errors = {};
    const newTouched: Partial<Record<keyof FormState, boolean>> = {};
    let ok = true;
    for (const key of fields) {
      newTouched[key] = true;
      const err = validate(key, form[key]);
      if (err) { newErrors[key] = err; ok = false; }
    }
    setTouched((p) => ({ ...p, ...newTouched }));
    setErrors((p) => ({ ...p, ...newErrors }));
    return ok;
  };

  const goNext = () => {
    if (!validateStep(STEP_FIELDS[step])) return;
    trackFormStepComplete("ambassador_apply", STEPS[step - 1].label, step);
    setDir(1);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setDir(-1);
    setStep((s) => s - 1);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(STEP_FIELDS[4])) return;
    if (honeypot) { setIsSuccess(true); return; }
    if (!turnstileToken) { setSubmitError("Please complete the security check below."); return; }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/send-ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...utmRef.current, token: turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed.");
      }
      trackGenerateLead("ambassador_apply");
      setIsSuccess(true);
      setForm(emptyForm);
      setTurnstileToken(null);
    } catch (err) {
      trackFormError("ambassador_apply", "submit_failed");
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -36 : 36, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-cream/40 pt-20 pb-16 px-4 md:px-6">
      <div className="max-w-[640px] mx-auto">

        {/* Back link */}
        <Link
          href="/ambassadors"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-orange transition-colors mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Ambassador Program
        </Link>

        <div className="rounded-2xl border border-black/8 bg-white shadow-[0_24px_60px_-18px_rgba(17,24,39,0.12)] overflow-hidden">

          {/* Header */}
          <div className="shrink-0 px-5 md:px-8 pt-6 pb-5 border-b border-black/8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-3.5 py-1.5 mb-3 shadow-[0_4px_14px_rgba(255,106,47,0.35)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-white">
                GrowQR AI Global Campus Program
              </span>
            </div>
            <h1 className="text-[20px] md:text-[24px] font-bold tracking-[-0.025em] text-ink leading-tight">
              Join GrowQR Cohort 02
            </h1>
          </div>

          {/* Success screen */}
          {isSuccess ? (
            <div className="px-5 md:px-8 py-14 flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-orange/10 mb-5">
                <CheckCircle2 className="h-8 w-8 text-orange" strokeWidth={1.5} />
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink mb-2.5">Application Received!</h2>
              <p className="text-[14.5px] text-ink-3 leading-relaxed max-w-[420px]">
                Thanks for applying to the GrowQR AI Global Campus Ambassador Program. We&apos;ll review your application and get back to you within{" "}
                <span className="font-semibold text-ink">2 business days</span>.
              </p>
              <button
                type="button"
                onClick={() => router.push("/ambassadors")}
                className="mt-8 inline-flex items-center gap-2 bg-orange text-white text-[14px] font-semibold px-6 py-3 rounded-full transition hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)]"
              >
                Back to Ambassador Program
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Form content */}
              <div className="px-5 md:px-8 py-6">
                <StepProgress current={step} />

                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* ── Step 1: Identity ── */}
                    {step === 1 && (
                      <div className="flex flex-col gap-4">
                        <div className="mb-1">
                          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink">Who are you?</h2>
                          <p className="text-[12.5px] text-ink-4 mt-0.5">Basic details, takes about 60 seconds.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <FloatingInput id="fullName" label="Full Name" value={form.fullName} onChange={update("fullName")} onBlur={blur("fullName")} placeholder="James Carter" error={errors.fullName} required autoComplete="name" />
                          <FloatingInput id="email" label="Email Address" type="email" value={form.email} onChange={update("email")} onBlur={blur("email")} placeholder="you@college.edu" error={errors.email} required autoComplete="email" />
                          <FloatingInput id="phone" label="Phone Number" type="tel" value={form.phone} onChange={update("phone")} onBlur={blur("phone")} placeholder="+91 98765 43210" error={errors.phone} required autoComplete="tel" maxLength={25} />
                          <FloatingInput id="whatsapp" label="WhatsApp Number" type="tel" value={form.whatsapp} onChange={update("whatsapp")} onBlur={blur("whatsapp")} placeholder="+91 98765 43210" error={errors.whatsapp} required autoComplete="tel" maxLength={25} />
                          <FloatingInput id="studentId" label="Student ID" value={form.studentId} onChange={update("studentId")} onBlur={blur("studentId")} placeholder="e.g. 12013271" error={errors.studentId} required />
                          <CollegeAutocomplete
                            value={form.college}
                            onChange={updateField("college")}
                            onBlur={blur("college")}
                            error={errors.college}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <FloatingInput id="course" label="Course" value={form.course} onChange={update("course")} onBlur={blur("course")} placeholder="B.Tech CSE" error={errors.course} required />
                          <FloatingInput id="passingYear" label="Passing Year" type="text" inputMode="numeric" value={form.passingYear} onChange={updateDigits("passingYear", 4)} onBlur={blur("passingYear")} placeholder="2026" error={errors.passingYear} required maxLength={4} />
                        </div>
                      </div>
                    )}

                    {/* ── Step 2: Identity & Address ── */}
                    {step === 2 && (
                      <div className="flex flex-col gap-3.5">
                        <div className="mb-1">
                          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink">A few more details.</h2>
                          <p className="text-[12.5px] text-ink-4 mt-0.5">Used for verification and program paperwork.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <FloatingSelect id="gender" label="Gender" value={form.gender} onChange={update("gender")} onBlur={blur("gender")} options={GENDER_OPTIONS} error={errors.gender} required />
                          <FloatingInput id="aadhaarNumber" label="Aadhaar Number" type="text" inputMode="numeric" value={form.aadhaarNumber} onChange={updateDigits("aadhaarNumber", 12)} onBlur={blur("aadhaarNumber")} placeholder="123456789012" error={errors.aadhaarNumber} required maxLength={12} />
                          <FloatingInput id="collegeLocation" label="Campus Location (City, State)" value={form.collegeLocation} onChange={update("collegeLocation")} onBlur={blur("collegeLocation")} placeholder="City, State" error={errors.collegeLocation} required maxLength={200} />
                          <FloatingInput id="homeTown" label="Home Town" value={form.homeTown} onChange={update("homeTown")} onBlur={blur("homeTown")} placeholder="City name" error={errors.homeTown} required maxLength={200} />
                        </div>
                        <FloatingTextarea id="currentAddress" label="Current Address" value={form.currentAddress} onChange={update("currentAddress")} onBlur={blur("currentAddress")} placeholder="Street, city, state, postal code" error={errors.currentAddress} required rows={3} maxLength={500} />
                      </div>
                    )}

                    {/* ── Step 3: Presence ── */}
                    {step === 3 && (
                      <div className="flex flex-col gap-3.5">
                        <div className="mb-1">
                          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink">Your presence online.</h2>
                          <p className="text-[12.5px] text-ink-4 mt-0.5">Profile links so we can learn more about you.</p>
                        </div>
                        <FloatingInput id="linkedin" label="LinkedIn Profile URL" type="url" value={form.linkedin} onChange={update("linkedin")} onBlur={blur("linkedin")} placeholder="linkedin.com/in/yourname" error={errors.linkedin} required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <FloatingInput id="instagram" label="Instagram Handle" value={form.instagram} onChange={update("instagram")} placeholder="@yourhandle" optional />
                          <FloatingInput id="youtube" label="YouTube Channel" type="url" value={form.youtube} onChange={update("youtube")} placeholder="https://youtube.com/c/yourchannel" optional />
                        </div>
                        <ResumeUpload
                          value={form.resume}
                          onChange={updateField("resume")}
                          error={touched.resume ? errors.resume : null}
                        />
                      </div>
                    )}

                    {/* ── Step 4: Story ── */}
                    {step === 4 && (
                      <div className="flex flex-col gap-5">
                        <div className="mb-1">
                          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink">Tell us your story.</h2>
                          <p className="text-[12.5px] text-ink-4 mt-0.5">Be specific and genuine. This is the most important step.</p>
                        </div>

                        <FloatingTextarea
                          id="whyJoin"
                          label="Why do you want to join GrowQR?"
                          value={form.whyJoin}
                          onChange={update("whyJoin")}
                          onBlur={blur("whyJoin")}
                          placeholder="What excites you about being part of an AI-powered campus community?"
                          error={errors.whyJoin}
                          required
                          rows={3}
                          maxWords={150}
                        />

                        <FloatingTextarea
                          id="whyFit"
                          label="What makes you a great fit?"
                          value={form.whyFit}
                          onChange={update("whyFit")}
                          onBlur={blur("whyFit")}
                          placeholder="Your strengths, campus presence, and leadership mindset"
                          error={errors.whyFit}
                          required
                          rows={3}
                          maxWords={150}
                        />

                        {/* Led something — pill radio */}
                        <div>
                          <p className={`mb-2.5 text-[10px] font-bold uppercase tracking-[0.1em] ${errors.ledSomething ? "text-red-500" : "text-ink-3"}`}>
                            Have you led or organized something before?
                            <span className="text-orange ml-0.5">*</span>
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {[{ val: "yes", label: "Yes, I have" }, { val: "no", label: "Not yet" }].map(({ val, label }) => (
                              <label
                                key={val}
                                className={[
                                  "inline-flex items-center gap-2 cursor-pointer rounded-full border px-5 py-3 text-[13px] font-semibold transition-all select-none",
                                  form.ledSomething === val
                                    ? "bg-orange/8 border-orange text-orange-deep shadow-[0_0_0_3px_rgba(255,106,47,0.1)]"
                                    : "bg-white border-black/15 hover:border-orange/40 text-ink",
                                ].join(" ")}
                              >
                                <input
                                  type="radio"
                                  name="led"
                                  value={val}
                                  checked={form.ledSomething === val}
                                  onChange={(e) => {
                                    setForm((p) => ({ ...p, ledSomething: e.target.value }));
                                    setTouched((p) => ({ ...p, ledSomething: true }));
                                    setErrors((p) => ({ ...p, ledSomething: undefined }));
                                  }}
                                  className="sr-only"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                          {errors.ledSomething && (
                            <p className="mt-1.5 text-[11.5px] font-medium text-red-500 flex items-center gap-1 pl-0.5">
                              <span aria-hidden className="text-[10px]">●</span> {errors.ledSomething}
                            </p>
                          )}
                        </div>

                        <FloatingTextarea
                          id="experience"
                          label="Describe your experience (optional)"
                          value={form.experience}
                          onChange={update("experience")}
                          placeholder="Share what you led, organized, or contributed to"
                          rows={3}
                        />

                        {/* Honeypot */}
                        <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                        <div>
                          <TurnstileWidget
                            onVerify={setTurnstileToken}
                            onError={() => setSubmitError("Security check failed. Please refresh and try again.")}
                          />
                        </div>

                        {submitError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 flex items-center gap-2"
                          >
                            <span aria-hidden>⚠</span> {submitError}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-t border-black/8 bg-white">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-orange transition-colors py-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                ) : (
                  <p className="text-[11.5px] text-ink-4">
                    ~3 min &middot; {5 - step} step{5 - step !== 1 ? "s" : ""} left
                  </p>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 bg-orange text-white text-[13px] font-semibold px-5 py-3 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)] active:scale-[0.97]"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-[11px] text-ink-4 whitespace-nowrap">
                      By submitting you agree to our{" "}
                      <Link href="/privacy-policy" className="underline hover:text-orange transition-colors">Privacy Policy</Link>.
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 bg-orange text-white text-[13px] font-semibold px-5 py-3 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                      ) : (
                        <>Submit Application <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Submission loading overlay */}
              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeInOut" }}
                    className="h-[3px] bg-orange origin-left"
                  />
                )}
              </AnimatePresence>

            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-4">
          Questions? Email us at{" "}
          <a href="mailto:support@growqr.ai" className="text-orange hover:underline">support@growqr.ai</a>
        </p>
      </div>
    </div>
  );
}
