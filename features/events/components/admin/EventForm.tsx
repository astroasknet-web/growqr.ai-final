"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Eye, Save, Plus, Trash2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { createEvent, type EventFormPayload } from "@/features/events/actions/admin/createEvent";
import { updateEvent } from "@/features/events/actions/admin/updateEvent";
import type { EventRow, AgendaItem } from "@/features/events/types/event";
import ImageUploader from "./ImageUploader";
import EventPreviewModal from "./EventPreviewModal";

interface Props {
  eventId?: string;
  initialData?: EventRow | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function emptyPayload(): EventFormPayload {
  return {
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    speaker_name: "",
    speaker_designation: "",
    speaker_company: "",
    speaker_bio: "",
    speaker_image: "",
    poster_url: "",
    venue: "",
    city: "",
    country: "India",
    event_date: "",
    start_time: "",
    end_time: "",
    timezone: "Asia/Kolkata",
    duration: "",
    format: "Online",
    badge: "Free",
    price: "",
    registration_limit: "",
    is_active: true,
    event_mode: "offline",
    meeting_platform: "",
    meeting_url: "",
    learnings: [],
    agenda: [],
  };
}

function fromRow(row: EventRow): EventFormPayload {
  return {
    title: row.title ?? "",
    slug: row.slug ?? "",
    short_description: row.short_description ?? "",
    full_description: row.full_description ?? "",
    speaker_name: row.speaker_name ?? "",
    speaker_designation: row.speaker_designation ?? "",
    speaker_company: row.speaker_company ?? "",
    speaker_bio: row.speaker_bio ?? "",
    speaker_image: row.speaker_image ?? "",
    poster_url: row.poster_url ?? "",
    venue: row.venue ?? "",
    city: row.city ?? "",
    country: row.country ?? "India",
    event_date: row.event_date ?? "",
    start_time: row.start_time ?? "",
    end_time: row.end_time ?? "",
    timezone: row.timezone ?? "Asia/Kolkata",
    duration: row.duration ?? "",
    format: row.format ?? "Online",
    badge: row.badge ?? "Free",
    price: row.price ?? "",
    registration_limit:
      row.registration_limit != null ? String(row.registration_limit) : "",
    is_active: row.is_active,
    event_mode: row.event_mode ?? "offline",
    meeting_platform: row.meeting_platform ?? "",
    meeting_url: row.meeting_url ?? "",
    learnings: row.learnings ?? [],
    agenda: row.agenda ?? [],
  };
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-black/[0.12] text-[14.5px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60 transition-all placeholder:text-ink-5";

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-ink-3 uppercase tracking-[0.06em]">
        {label}
        {required && <span className="text-orange ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-ink-4 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Section({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-6 sm:p-8">
      <header className="mb-6 pb-5 border-b border-black/[0.06]">
        <h2 className="text-[18px] font-bold text-ink tracking-tight">{title}</h2>
        {subtitle && <p className="text-[13.5px] text-ink-4 mt-1">{subtitle}</p>}
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function EventForm({ eventId, initialData }: Props) {
  const router = useRouter();
  const isEdit = Boolean(eventId);

  const [form, setForm] = useState<EventFormPayload>(
    initialData ? fromRow(initialData) : emptyPayload(),
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-generate slug from title until user manually edits it
  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // Clear success toast after 2.5s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [success]);

  const set = <K extends keyof EventFormPayload>(k: K) =>
    (v: EventFormPayload[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Learnings: array of strings, one per row
  const updateLearning = (i: number, v: string) =>
    setForm((f) => ({ ...f, learnings: f.learnings.map((l, idx) => (idx === i ? v : l)) }));
  const addLearning = () =>
    setForm((f) => ({ ...f, learnings: [...f.learnings, ""] }));
  const removeLearning = (i: number) =>
    setForm((f) => ({ ...f, learnings: f.learnings.filter((_, idx) => idx !== i) }));

  // Agenda: array of {time, title, desc}
  const updateAgenda = (i: number, patch: Partial<AgendaItem>) =>
    setForm((f) => ({
      ...f,
      agenda: f.agenda.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  const addAgenda = () =>
    setForm((f) => ({ ...f, agenda: [...f.agenda, { time: "", title: "", desc: "" }] }));
  const removeAgenda = (i: number) =>
    setForm((f) => ({ ...f, agenda: f.agenda.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && eventId) {
          const res = await updateEvent(eventId, form);
          if (!res.ok) {
            setError(res.error || "Failed to save.");
            return;
          }
          setSuccess(true);
          router.refresh();
        } else {
          const res = await createEvent(form);
          if (res?.error) {
            setError(res.error);
            return;
          }
          // createEvent redirects on success → unreachable
        }
      } catch (err) {
        // Next.js redirect throws an error to terminate execution — that's OK
        if (err && typeof err === "object" && "digest" in err) return;
        console.error(err);
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const headingTitle = isEdit
    ? initialData?.title || "Edit event"
    : "Create new event";
  const headingSub = isEdit
    ? "Update event details, agenda, and registration settings."
    : "Set up the event so people can register for it.";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Sticky action bar */}
      <div className="sticky top-16 z-30 -mx-6 lg:-mx-10 px-6 lg:px-10 bg-cream-2/95 backdrop-blur-md border-b border-black/[0.06] py-4">
        <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/events"
              className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All events</span>
            </Link>
            <div className="h-5 w-px bg-black/10 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-[19px] sm:text-[22px] font-bold text-ink tracking-tight truncate">
                {headingTitle}
              </h1>
              <p className="hidden sm:block text-[12.5px] text-ink-4 truncate">{headingSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {success && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-black/[0.12] bg-white text-ink-2 text-[13.5px] font-semibold hover:border-black/[0.2] hover:bg-cream-2 active:scale-[0.98] transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.45)] hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] w-full mx-auto flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[14px] text-red-700">{error}</p>
          </div>
        )}

        {/* 1. Event Details */}
        <Section
          title="Event details"
          subtitle="Core information shown on the public event page."
        >
          <Field label="Title" required>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="A Framework for Aligning Strategy and Execution"
            />
          </Field>

          <Field label="Slug" required hint="URL: /events/your-slug — only lowercase letters, numbers and dashes.">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug")(slugify(e.target.value));
              }}
              placeholder="aligning-strategy-and-execution"
            />
          </Field>

          <Field label="Short description" hint="One line shown as the event subtitle.">
            <input
              className={inputCls}
              value={form.short_description}
              onChange={(e) => set("short_description")(e.target.value)}
              placeholder="A practical workshop focused on bridging strategy and execution…"
            />
          </Field>

          <Field label="Full description" hint="Detailed event description — appears under 'About this event'.">
            <textarea
              className={`${inputCls} min-h-[160px] resize-y leading-relaxed`}
              value={form.full_description}
              onChange={(e) => set("full_description")(e.target.value)}
              placeholder="Tell attendees what this session covers and why it matters…"
            />
          </Field>
        </Section>

        {/* 2. Schedule & Location */}
        <Section
          title="Schedule & location"
          subtitle="When and where the event takes place."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                className={inputCls}
                value={form.event_date}
                onChange={(e) => set("event_date")(e.target.value)}
              />
            </Field>
            <Field label="Start time" hint="e.g. 5:00 PM">
              <input
                className={inputCls}
                value={form.start_time}
                onChange={(e) => set("start_time")(e.target.value)}
                placeholder="5:00 PM"
              />
            </Field>
            <Field label="End time" hint="e.g. 6:00 PM">
              <input
                className={inputCls}
                value={form.end_time}
                onChange={(e) => set("end_time")(e.target.value)}
                placeholder="6:00 PM"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Timezone">
              <input
                className={inputCls}
                value={form.timezone}
                onChange={(e) => set("timezone")(e.target.value)}
                placeholder="Asia/Kolkata"
              />
            </Field>
            <Field label="Duration" hint="e.g. 1 hr">
              <input
                className={inputCls}
                value={form.duration}
                onChange={(e) => set("duration")(e.target.value)}
                placeholder="1 hr"
              />
            </Field>
            <Field label="Format">
              <select
                className={inputCls}
                value={form.format}
                onChange={(e) => set("format")(e.target.value)}
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Event mode" hint="Online events can include a meeting or livestream link.">
              <select
                className={inputCls}
                value={form.event_mode}
                onChange={(e) => set("event_mode")(e.target.value as "offline" | "online")}
              >
                <option value="offline">Offline (In-person)</option>
                <option value="online">Online</option>
              </select>
            </Field>
            {form.event_mode === "online" && (
              <div className="flex flex-col gap-4">
                <Field label="Platform" hint="Shown to attendees on the event page.">
                  <select
                    className={inputCls}
                    value={form.meeting_platform}
                    onChange={(e) => set("meeting_platform")(e.target.value)}
                  >
                    <option value="">Select platform</option>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                  </select>
                </Field>
                <Field label="Meeting link" hint="Sent privately to registered attendees via email only.">
                  <input
                    className={inputCls}
                    value={form.meeting_url}
                    onChange={(e) => set("meeting_url")(e.target.value)}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    type="url"
                  />
                </Field>
              </div>
            )}
          </div>

          <Field label="Venue" hint="Full venue address — for in-person events.">
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={form.venue}
              onChange={(e) => set("venue")(e.target.value)}
              placeholder="GrowQR Studio, 4th Floor, Wesource Building, Sector 125, Noida…"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City">
              <input
                className={inputCls}
                value={form.city}
                onChange={(e) => set("city")(e.target.value)}
                placeholder="Noida"
              />
            </Field>
            <Field label="Country">
              <input
                className={inputCls}
                value={form.country}
                onChange={(e) => set("country")(e.target.value)}
                placeholder="India"
              />
            </Field>
          </div>
        </Section>

        {/* 3. Speaker */}
        <Section
          title="Speaker"
          subtitle="Who's leading this session."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Speaker name">
              <input
                className={inputCls}
                value={form.speaker_name}
                onChange={(e) => set("speaker_name")(e.target.value)}
                placeholder="Kharanshu Sharma"
              />
            </Field>
            <Field label="Designation" hint={`${form.speaker_designation.length}/40`}>
              <input
                className={inputCls}
                value={form.speaker_designation}
                onChange={(e) => set("speaker_designation")(e.target.value.slice(0, 40))}
                placeholder="Senior Program Manager"
                maxLength={40}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company" hint={`${form.speaker_company.length}/30`}>
              <input
                className={inputCls}
                value={form.speaker_company}
                onChange={(e) => set("speaker_company")(e.target.value.slice(0, 30))}
                placeholder="NTT Data Inc."
                maxLength={30}
              />
            </Field>
            <ImageUploader
              label="Photo"
              value={form.speaker_image}
              onChange={set("speaker_image")}
              purpose="speakers"
              hint={form.speaker_name || "speaker"}
              aspect="square"
              compact
              cropTitle="Crop speaker photo"
            />
          </div>
          <Field label="Bio">
            <textarea
              className={`${inputCls} min-h-[110px] resize-y leading-relaxed`}
              value={form.speaker_bio}
              onChange={(e) => set("speaker_bio")(e.target.value)}
              placeholder="A short bio shown on the event page…"
            />
          </Field>
        </Section>

        {/* 4. Content */}
        <Section
          title="What attendees take away"
          subtitle="Optional content blocks shown on the event page."
        >
          <Field label="Key learnings" hint="One per line. Leave blank to hide this section.">
            <div className="flex flex-col gap-2">
              {form.learnings.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={l}
                    onChange={(e) => updateLearning(i, e.target.value)}
                    placeholder={`Learning ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLearning(i)}
                    className="shrink-0 w-10 h-10 rounded-lg border border-black/[0.1] text-ink-4 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center"
                    aria-label="Remove learning"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLearning}
                className="self-start inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-orange-deep hover:text-orange transition-colors"
              >
                <Plus className="w-4 h-4" /> Add learning
              </button>
            </div>
          </Field>

          <Field label="Agenda" hint="Time-blocked schedule shown on the event page.">
            <div className="flex flex-col gap-3">
              {form.agenda.map((a, i) => (
                <div
                  key={i}
                  className="bg-cream-2 rounded-xl border border-black/[0.06] p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                      <input
                        className={inputCls}
                        value={a.time}
                        onChange={(e) => updateAgenda(i, { time: e.target.value })}
                        placeholder="5:00 PM"
                      />
                      <input
                        className={inputCls}
                        value={a.title}
                        onChange={(e) => updateAgenda(i, { title: e.target.value })}
                        placeholder="Session title"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAgenda(i)}
                      className="shrink-0 w-10 h-10 rounded-lg border border-black/[0.1] text-ink-4 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    className={inputCls}
                    value={a.desc}
                    onChange={(e) => updateAgenda(i, { desc: e.target.value })}
                    placeholder="Short description of this segment"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addAgenda}
                className="self-start inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-orange-deep hover:text-orange transition-colors"
              >
                <Plus className="w-4 h-4" /> Add agenda item
              </button>
            </div>
          </Field>
        </Section>

        {/* 5. Settings */}
        <Section
          title="Settings"
          subtitle="Visibility, registration limits, and poster."
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <ImageUploader
              label="Event poster"
              value={form.poster_url}
              onChange={set("poster_url")}
              purpose="posters"
              hint={form.slug || form.title || "poster"}
              aspect="video"
              cropTitle="Crop event poster"
            />
            <Field label="Registration limit" hint="Leave blank for unlimited.">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.registration_limit}
                onChange={(e) => set("registration_limit")(e.target.value)}
                placeholder="e.g. 80"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Badge">
              <select
                className={inputCls}
                value={form.badge}
                onChange={(e) => set("badge")(e.target.value)}
              >
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
            </Field>
            <Field label="Price" hint="Only used if badge is Paid.">
              <input
                className={inputCls}
                value={form.price}
                onChange={(e) => set("price")(e.target.value)}
                placeholder="₹999"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-4 bg-cream-2 rounded-xl border border-black/[0.06] px-5 py-4">
            <div>
              <p className="text-[14.5px] font-semibold text-ink">Active</p>
              <p className="text-[12.5px] text-ink-4 mt-0.5">
                Active events are publicly visible and accept registrations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("is_active")(!form.is_active)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                form.is_active ? "bg-orange" : "bg-black/15"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                  form.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Section>

        {/* Bottom save shortcut */}
        <div className="flex items-center justify-end gap-2.5 pb-8">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-black/[0.12] text-ink-2 text-[14px] font-semibold hover:bg-white transition-all"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-black/[0.12] bg-white text-ink-2 text-[14px] font-semibold hover:border-black/[0.2] hover:bg-cream-2 active:scale-[0.98] transition-all"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.45)] hover:bg-orange-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </button>
        </div>
      </div>

      {/* ── Live preview modal ── */}
      <EventPreviewModal
        open={showPreview}
        form={form}
        onClose={() => setShowPreview(false)}
      />
    </form>
  );
}
