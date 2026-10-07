"use client";

/* ══════════════════════════════════════════════════════════════════════════
   Expert Intake Form
   A 6-step form that mirrors every section of the expert
   detail page (/experts/[slug]). Hard-enforces per-field character limits via
   the shared config (features/experts/intake/config.ts) so experts can only
   submit content that fits the live UI. Writes to the `expert_submissions`
   Supabase table through /api/expert-intake.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/ui/TurnstileWidget";
import {
  TextField, TextAreaField, SelectField, ImageUpload,
  StringListField, CardRow, AddCardButton, StepProgress, DurationField,
} from "@/features/experts/intake/fields";
import {
  LIMITS, COUNTS, PERSONA_OPTIONS, COUNTRY_OPTIONS,
  emptyIntakeForm, type IntakeForm,
} from "@/features/experts/intake/config";
import {
  trackGenerateLead,
  trackFormStart,
  trackFormStepComplete,
  trackFormError,
} from "@/lib/analytics";

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "About" },
  { id: 3, label: "Experience" },
  { id: 4, label: "Session" },
  { id: 5, label: "Reviews" },
  { id: 6, label: "Finish" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;
const t = (s: string) => s.trim();
const filledCount = (arr: string[]) => arr.filter((x) => t(x)).length;

/* Per-step required checks — returns a list of missing/invalid items (banner). */
function missingForStep(step: number, f: IntakeForm): string[] {
  const m: string[] = [];
  if (step === 1) {
    if (!t(f.name)) m.push("Name");
    if (!EMAIL_RE.test(t(f.email))) m.push("a valid Email");
    if (!t(f.role)) m.push("Role");
    if (!t(f.tag)) m.push("Tag");
    if (!t(f.yearsExperience) || Number.isNaN(Number(f.yearsExperience))) m.push("Years of experience");
    if (!t(f.bio)) m.push("Bio");
  }
  if (step === 2) {
    if (!t(f.about)) m.push("About");
    if (filledCount(f.expertise) < COUNTS.expertise.min) m.push(`at least ${COUNTS.expertise.min} Expertise tags`);
    if (filledCount(f.skills) < COUNTS.skills.min) m.push(`at least ${COUNTS.skills.min} Skills`);
    if (filledCount(f.industries) < COUNTS.industries.min) m.push("at least one Industry");
    if (filledCount(f.languages) < COUNTS.languages.min) m.push("at least one Language");
  }
  if (step === 3) {
    const work = f.workExperience.filter((w) => t(w.company) || t(w.position));
    if (work.length < 1) m.push("at least one Work experience");
    if (work.some((w) => !t(w.company) || !t(w.position) || !t(w.duration))) m.push("complete Work experience fields");
    const edu = f.education.filter((e) => t(e.degree) || t(e.school));
    if (edu.length < 1) m.push("at least one Education entry");
    if (edu.some((e) => !t(e.degree) || !t(e.school))) m.push("complete Education fields");
  }
  if (step === 4) {
    if (!t(f.headline)) m.push("Session heading");
    if (!t(f.intro)) m.push("Session description");
    const wyg = f.whatYouGet.filter((w) => t(w.title) || t(w.description));
    if (wyg.length < COUNTS.whatYouGet.min) m.push(`at least ${COUNTS.whatYouGet.min} "What you'll get" cards`);
    if (wyg.some((w) => !t(w.title) || !t(w.description))) m.push("complete \"What you'll get\" fields");
    const stats = f.stats.filter((s) => t(s.value) || t(s.label));
    if (stats.length < COUNTS.stats.min) m.push(`at least ${COUNTS.stats.min} Highlight stats`);
    if (stats.some((s) => !t(s.value) || !t(s.label))) m.push("complete Stat fields");
  }
  if (step === 5) {
    const reviews = f.reviews.filter((r) => t(r.name) || t(r.text));
    if (reviews.length < COUNTS.reviews.min) m.push(`at least ${COUNTS.reviews.min} Testimonials`);
    if (reviews.some((r) => !t(r.name) || !t(r.role) || !t(r.text))) m.push("complete Testimonial fields");
  }
  if (step === 6) {
    if (!t(f.linkedinUrl)) m.push("LinkedIn URL");
    else if (!URL_RE.test(t(f.linkedinUrl))) m.push("a valid LinkedIn URL (https://…)");
    if (!t(f.image)) m.push("a Portrait photo");
  }
  return m;
}

/* ════════════════ Main form ════════════════ */
export function ExpertIntakeForm() {
  const [form, setForm] = useState<IntakeForm>(emptyIntakeForm);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [stepError, setStepError] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // ONE token shared by every ImageUpload on the form (portrait + up to six
  // testimonial photos). Kept here rather than inside each field so the page
  // runs one invisible challenge instead of seven. Tokens are single-use, so a
  // field calls consumeUploadToken() after its request and the widget re-issues.
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const uploadTurnstileRef = useRef<TurnstileWidgetHandle>(null);
  const consumeUploadToken = useCallback(() => {
    setUploadToken(null);
    uploadTurnstileRef.current?.reset();
  }, []);

  useEffect(() => {
    trackFormStart("expert_intake");
  }, []);

  // ── State helpers ──────────────────────────────────────────────────────────
  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setItem = <K extends keyof IntakeForm>(key: K, i: number, value: unknown) =>
    setForm((p) => ({ ...p, [key]: (p[key] as unknown[]).map((x, idx) => (idx === i ? value : x)) as IntakeForm[K] }));

  const addItem = <K extends keyof IntakeForm>(key: K, blank: unknown, max: number) =>
    setForm((p) => {
      const arr = p[key] as unknown[];
      if (arr.length >= max) return p;
      return { ...p, [key]: [...arr, blank] as IntakeForm[K] };
    });

  const removeItem = <K extends keyof IntakeForm>(key: K, i: number) =>
    setForm((p) => ({ ...p, [key]: (p[key] as unknown[]).filter((_, idx) => idx !== i) as IntakeForm[K] }));

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = () => {
    const missing = missingForStep(step, form);
    if (missing.length) { setStepError(missing); return; }
    trackFormStepComplete("expert_intake", STEPS[step - 1].label, step);
    setStepError(null);
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    setStepError(null);
    setSubmitError(null);
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate every step before submit.
    for (let s = 1; s <= STEPS.length; s++) {
      const missing = missingForStep(s, form);
      if (missing.length) { setStep(s); setStepError(missing); return; }
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/expert-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token: turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed.");
      }
      trackGenerateLead("expert_intake");
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      trackFormError("expert_intake", "submit_failed");
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -36 : 36, opacity: 0 }),
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] rounded-2xl border border-black/8 bg-white px-8 py-14 text-center shadow-[0_24px_60px_-18px_rgba(17,24,39,0.12)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange/10 mb-5">
            <CheckCircle2 className="h-8 w-8 text-orange" strokeWidth={1.5} />
          </div>
          <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink mb-2.5">Profile submitted!</h2>
          <p className="text-[14.5px] text-ink-3 leading-relaxed">
            Thanks — your profile details have been received. Our team will review them and reach out if anything needs a tweak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/40 pt-20 pb-16 px-4 md:px-6">
      <div className="max-w-[680px] mx-auto">
        <div className="rounded-2xl border border-black/8 bg-white shadow-[0_24px_60px_-18px_rgba(17,24,39,0.12)] overflow-hidden">
          {/* Header */}
          <div className="px-5 md:px-8 pt-6 pb-5 border-b border-black/8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-3.5 py-1.5 mb-3 shadow-[0_4px_14px_rgba(255,106,47,0.35)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-white">Expert Profile</span>
            </div>
            <h1 className="text-[20px] md:text-[24px] font-bold tracking-[-0.025em] text-ink leading-tight">Build your GrowQR profile</h1>
            <p className="mt-1 text-[13px] text-ink-4">Six short steps, about 5 minutes. You can only enter text that fits your live profile, so it always looks right.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Invisible, and mounted once for the WHOLE form: it feeds every
                ImageUpload on every step, so a token is always ready no matter
                where the applicant is when they pick a file. */}
            <TurnstileWidget ref={uploadTurnstileRef} onVerify={setUploadToken} />

            <div className="px-5 md:px-8 py-6">
              <StepProgress steps={STEPS} current={step} />

              {stepError && stepError.length > 0 && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
                  Please provide: {stepError.join(", ")}.
                </div>
              )}

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>

                  {/* ── Step 1: Basics ── */}
                  {step === 1 && (
                    <div className="flex flex-col gap-7">
                      <StepHeading title="The basics" sub="How you appear at the top of your profile." />

                      <FieldGroup title="Who you are">
                        <div className="flex flex-col gap-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <TextField id="name" label="Full Name" value={form.name} onChange={(v) => set("name", v)} placeholder="Dr. Ruchi Sharma" required maxChars={LIMITS.name} />
                            <TextField id="role" label="Professional Title" value={form.role} onChange={(v) => set("role", v)} placeholder="Managing Partner, Bansal AV & Associates" required maxChars={LIMITS.role} />
                            <TextField id="tag" label="Profile Badge" value={form.tag} onChange={(v) => set("tag", v)} placeholder="Finance Educator & Mentor" required maxChars={LIMITS.tag} hint="A short badge on your listing card." />
                          </div>
                          <TextField id="bio" label="Short Bio" value={form.bio} onChange={(v) => set("bio", v)} placeholder="Educator, researcher & mentor helping people navigate careers." required maxChars={LIMITS.bio} hint="A one-line summary about you, shown on your listing card." />
                        </div>
                      </FieldGroup>

                      <FieldGroup title="Contact & details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <TextField id="email" label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@example.com" required />
                          <TextField id="years" label="Years of Experience" value={form.yearsExperience} onChange={(v) => set("yearsExperience", v)} placeholder="10" required numeric maxChars={2} />
                          <SelectField id="country" label="Country" value={form.country} onChange={(v) => set("country", v)} options={COUNTRY_OPTIONS} required />
                          <TextField id="location" label="City / Region" value={form.location} onChange={(v) => set("location", v)} placeholder="Chandigarh, India" maxChars={LIMITS.location} />
                          <div className="sm:col-span-2">
                            <SelectField id="persona" label="Primary Audience" value={form.persona} onChange={(v) => set("persona", v)} options={PERSONA_OPTIONS} placeholder="— Who do you mainly help? —" />
                          </div>
                        </div>
                      </FieldGroup>
                    </div>
                  )}

                  {/* ── Step 2: About & Skills ── */}
                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      <StepHeading title="About & expertise" sub="Your story and the tags that describe you." />
                      <TextAreaField id="about" label="About" value={form.about} onChange={(v) => set("about", v)} rows={6} required maxChars={LIMITS.about} />
                      <StringListField label="Expertise" values={form.expertise} onChange={(v) => set("expertise", v)} maxChars={LIMITS.expertiseItem} min={COUNTS.expertise.min} max={COUNTS.expertise.max} placeholder="Career Mentoring" hint="Short tags — the first 4 show in your hero." />
                      <StringListField label="Skills" values={form.skills} onChange={(v) => set("skills", v)} maxChars={LIMITS.skillItem} min={COUNTS.skills.min} max={COUNTS.skills.max} placeholder="Curriculum Design" />
                      <StringListField label="Industries" values={form.industries} onChange={(v) => set("industries", v)} maxChars={LIMITS.industryItem} min={COUNTS.industries.min} max={COUNTS.industries.max} placeholder="Higher Education" />
                      <StringListField label="Languages" values={form.languages} onChange={(v) => set("languages", v)} maxChars={LIMITS.languageItem} min={COUNTS.languages.min} max={COUNTS.languages.max} placeholder="English" />
                    </div>
                  )}

                  {/* ── Step 3: Experience & Education ── */}
                  {step === 3 && (
                    <div className="flex flex-col gap-5">
                      <StepHeading title="Experience & education" sub="Your background — the accordion sections on your profile." />
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">Work Experience<span className="text-orange ml-0.5">*</span></p>
                        <div className="flex flex-col gap-3">
                          {form.workExperience.map((w, i) => (
                            <CardRow key={i} index={i} removable={form.workExperience.length > 1} onRemove={() => removeItem("workExperience", i)}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TextField id={`wp-${i}`} label="Position" value={w.position} onChange={(v) => setItem("workExperience", i, { ...w, position: v })} maxChars={LIMITS.workPosition} required />
                                <TextField id={`wc-${i}`} label="Company" value={w.company} onChange={(v) => setItem("workExperience", i, { ...w, company: v })} maxChars={LIMITS.workCompany} required />
                              </div>
                              <DurationField value={w.duration} onChange={(v) => setItem("workExperience", i, { ...w, duration: v })} required />
                            </CardRow>
                          ))}
                          <AddCardButton label="Add work experience" onClick={() => addItem("workExperience", { company: "", position: "", duration: "" }, COUNTS.workExperience.max)} disabled={form.workExperience.length >= COUNTS.workExperience.max} />
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">Education<span className="text-orange ml-0.5">*</span></p>
                        <div className="flex flex-col gap-3">
                          {form.education.map((e, i) => (
                            <CardRow key={i} index={i} removable={form.education.length > 1} onRemove={() => removeItem("education", i)}>
                              <TextField id={`ed-${i}`} label="Degree" value={e.degree} onChange={(v) => setItem("education", i, { ...e, degree: v })} maxChars={LIMITS.eduDegree} required />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TextField id={`es-${i}`} label="School" value={e.school} onChange={(v) => setItem("education", i, { ...e, school: v })} maxChars={LIMITS.eduSchool} required />
                                <TextField id={`ey-${i}`} label="Year" value={e.year} onChange={(v) => setItem("education", i, { ...e, year: v })} placeholder="2021" maxChars={LIMITS.eduYear} numeric />
                              </div>
                            </CardRow>
                          ))}
                          <AddCardButton label="Add education" onClick={() => addItem("education", { degree: "", school: "", year: "" }, COUNTS.education.max)} disabled={form.education.length >= COUNTS.education.max} />
                        </div>
                      </div>
                      <StringListField label="Certifications" values={form.certifications} onChange={(v) => set("certifications", v)} maxChars={LIMITS.certificationItem} min={0} max={COUNTS.certifications.max} placeholder="Innovation Ambassador – AICTE" />
                      <StringListField label="Awards" values={form.awards} onChange={(v) => set("awards", v)} maxChars={LIMITS.awardItem} min={0} max={COUNTS.awards.max} placeholder="Women Icon Award, 2022" />
                    </div>
                  )}

                  {/* ── Step 4: The session ── */}
                  {step === 4 && (
                    <div className="flex flex-col gap-7">
                      <StepHeading title="Your session" sub="What people book — the session block on the right of your profile." />
                      <FieldGroup title="Session heading & pitch">
                        <div className="flex flex-col gap-3.5">
                          <TextField id="headline" label="Session Heading" value={form.headline} onChange={(v) => set("headline", v)} placeholder="Clarity, Confidence & Career — One Conversation at a Time" required maxChars={LIMITS.headline} hint="The big headline on your session block." />
                          <TextAreaField id="intro" label="Session Description" value={form.intro} onChange={(v) => set("intro", v)} rows={3} required maxChars={LIMITS.intro} hint="A 2–3 line pitch under the heading — what your session is about." />
                        </div>
                      </FieldGroup>
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">What You&apos;ll Get<span className="text-orange ml-0.5">*</span></p>
                        <div className="flex flex-col gap-3">
                          {form.whatYouGet.map((w, i) => (
                            <CardRow key={i} index={i} removable={form.whatYouGet.length > COUNTS.whatYouGet.min} onRemove={() => removeItem("whatYouGet", i)}>
                              <TextField id={`wt-${i}`} label="Title" value={w.title} onChange={(v) => setItem("whatYouGet", i, { ...w, title: v })} placeholder="Career Clarity" maxChars={LIMITS.whatTitle} required />
                              <TextField id={`wdesc-${i}`} label="Description" value={w.description} onChange={(v) => setItem("whatYouGet", i, { ...w, description: v })} placeholder="Navigate challenges confidently." maxChars={LIMITS.whatDescription} required />
                            </CardRow>
                          ))}
                          <AddCardButton label="Add card" onClick={() => addItem("whatYouGet", { title: "", description: "" }, COUNTS.whatYouGet.max)} disabled={form.whatYouGet.length >= COUNTS.whatYouGet.max} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">Highlight Stats<span className="text-orange ml-0.5">*</span> <span className="text-ink-4 font-normal normal-case tracking-normal">({COUNTS.stats.min}–{COUNTS.stats.max})</span></p>
                        <p className="mb-2 mt-0.5 text-[11px] text-ink-4">The big numbers near the top of your profile. e.g. <span className="text-ink-3">15+ Years Experience</span> · <span className="text-ink-3">1000+ Students Mentored</span> · <span className="text-ink-3">30+ Publications</span></p>
                        <div className="flex flex-col gap-3">
                          {form.stats.map((s, i) => (
                            <CardRow key={i} index={i} removable={form.stats.length > COUNTS.stats.min} onRemove={() => removeItem("stats", i)}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TextField id={`sv-${i}`} label="Value" value={s.value} onChange={(v) => setItem("stats", i, { ...s, value: v })} placeholder="15+" maxChars={LIMITS.statValue} required />
                                <TextField id={`sl-${i}`} label="Label" value={s.label} onChange={(v) => setItem("stats", i, { ...s, label: v })} placeholder="Years Experience" maxChars={LIMITS.statLabel} required />
                              </div>
                            </CardRow>
                          ))}
                          {form.stats.length < COUNTS.stats.max && (
                            <AddCardButton label="Add stat" onClick={() => addItem("stats", { value: "", label: "" }, COUNTS.stats.max)} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Step 5: Testimonials ── */}
                  {step === 5 && (
                    <div className="flex flex-col gap-5">
                      <StepHeading title="Testimonials" sub="Reviews shown in the carousel on your profile." />
                      <div className="flex flex-col gap-3">
                        {form.reviews.map((r, i) => (
                          <CardRow key={i} index={i} removable={form.reviews.length > COUNTS.reviews.min} onRemove={() => removeItem("reviews", i)}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <TextField id={`rn-${i}`} label="Reviewer Name" value={r.name} onChange={(v) => setItem("reviews", i, { ...r, name: v })} maxChars={LIMITS.reviewName} required />
                              <TextField id={`rr-${i}`} label="Reviewer Role" value={r.role} onChange={(v) => setItem("reviews", i, { ...r, role: v })} placeholder="Software Analyst · Acme" maxChars={LIMITS.reviewRole} required />
                            </div>
                            <TextAreaField id={`rt-${i}`} label="Testimonial" value={r.text} onChange={(v) => setItem("reviews", i, { ...r, text: v })} rows={3} maxChars={LIMITS.reviewText} required />
                            <ImageUpload value={r.image} onChange={(url) => setItem("reviews", i, { ...r, image: url })} label="Reviewer photo" kind="reviews" uploadToken={uploadToken} onTokenUsed={consumeUploadToken} />
                          </CardRow>
                        ))}
                        <AddCardButton label="Add testimonial" onClick={() => addItem("reviews", { name: "", role: "", rating: 5, text: "", image: "" }, COUNTS.reviews.max)} disabled={form.reviews.length >= COUNTS.reviews.max} />
                      </div>
                    </div>
                  )}

                  {/* ── Step 6: Photo, LinkedIn & extras ── */}
                  {step === 6 && (
                    <div className="flex flex-col gap-7">
                      <StepHeading title="Almost done" sub="Add your photo and a few finishing details, then submit." />

                      <FieldGroup title="Photo & link">
                        <div className="flex flex-col gap-3.5">
                          <ImageUpload value={form.image} onChange={(url) => set("image", url)} label="Portrait photo" kind="portrait" required uploadToken={uploadToken} onTokenUsed={consumeUploadToken} />
                          <TextField id="linkedin" label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} placeholder="https://linkedin.com/in/you" required maxChars={LIMITS.linkedinUrl} />
                        </div>
                      </FieldGroup>

                      <FieldGroup title="FAQ">
                        <div className="flex flex-col gap-3">
                          {form.faq.map((f, i) => (
                            <CardRow key={i} index={i} removable onRemove={() => removeItem("faq", i)}>
                              <TextField id={`fq-${i}`} label="Question" value={f.q} onChange={(v) => setItem("faq", i, { ...f, q: v })} maxChars={LIMITS.faqQ} required />
                              <TextAreaField id={`fa-${i}`} label="Answer" value={f.a} onChange={(v) => setItem("faq", i, { ...f, a: v })} rows={2} maxChars={LIMITS.faqA} required />
                            </CardRow>
                          ))}
                          {form.faq.length < COUNTS.faq.max && (
                            <AddCardButton label="Add FAQ" onClick={() => addItem("faq", { q: "", a: "" }, COUNTS.faq.max)} />
                          )}
                        </div>
                      </FieldGroup>

                      <div className="rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3">
                        <p className="text-[12px] text-ink-4 leading-relaxed">
                          Session length, price, and supported AI agents are set by GrowQR — you don&apos;t need to add them here.
                        </p>
                      </div>

                      {/* Invisible bot gate. Mounted only on the final step so
                          the Cloudflare challenge payload never loads for
                          someone who abandons at step 1. */}
                      <TurnstileWidget onVerify={setTurnstileToken} />

                      {submitError && <p className="text-[12.5px] font-medium text-red-500">{submitError}</p>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between gap-3 border-t border-black/8 px-5 md:px-8 py-4">
              <button type="button" onClick={goBack} disabled={step === 1}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 transition-colors hover:text-orange disabled:cursor-not-allowed disabled:opacity-30">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {step < STEPS.length ? (
                <button type="button" onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)]">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)] disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit profile <CheckCircle2 className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-[15px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="text-[12.5px] text-ink-4 mt-0.5">{sub}</p>
    </div>
  );
}

/* Labelled sub-section inside a step — a thin orange marker + small heading that
   chunks long steps into scannable groups so the form never reads as one long
   wall of inputs. */
function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3.5 w-1 rounded-full bg-orange/70" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{title}</p>
      </div>
      {children}
    </section>
  );
}
