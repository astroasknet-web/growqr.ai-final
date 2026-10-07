export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Calendar, Users, Mail, Phone, Briefcase,
  CheckCircle2, Clock, Download, ExternalLink,
} from "lucide-react";
import {
  getEventAdmin,
  getEventRegistrations,
} from "@/features/events/services/adminEvents.service";

interface Props {
  params: Promise<{ eventId: string }>;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function RegistrationsPage({ params }: Props) {
  const { eventId } = await params;

  // Both reads start together: they are independent, and running them in
  // sequence cost a full extra round trip to the database on every visit.
  // A miss on the event just means the registrations query returns nothing,
  // which is cheap, and notFound() still short-circuits the render.
  const [event, registrations] = await Promise.all([
    getEventAdmin(eventId),
    getEventRegistrations(eventId),
  ]);
  if (!event) notFound();
  const confirmed = registrations.filter((r) => r.confirmation_sent).length;
  const limit = event.registration_limit;

  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> All events
            </Link>
            <h1 className="text-[28px] md:text-[32px] font-bold text-ink tracking-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[13.5px] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-4" />
                {formatDate(event.event_date)}
                {event.start_time ? ` · ${event.start_time}` : ""}
              </span>
              {event.speaker_name && (
                <span>
                  Speaker:{" "}
                  <span className="font-semibold text-ink-2">{event.speaker_name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/admin/events/${event.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/[0.12] text-ink-2 text-[13.5px] font-semibold hover:bg-white transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Edit event
            </Link>
            <a
              href={`/api/admin/registrations/${event.id}/export`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange text-white text-[13.5px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.45)] hover:bg-orange-dark transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total registrations", value: registrations.length, accent: "#1A1A1A" },
            { label: "Confirmation sent", value: confirmed, accent: "#FF6A2F" },
            { label: "Capacity", value: limit ? `${registrations.length}/${limit}` : "Unlimited", accent: "#0891B2" },
            { label: "Status", value: event.is_active ? "Active" : "Inactive", accent: event.is_active ? "#059669" : "#8A8A8A" },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-black/[0.08] shadow-card px-5 py-5"
            >
              <p
                className="text-[24px] sm:text-[28px] font-bold tracking-tight leading-none mb-1.5"
                style={{ color: c.accent }}
              >
                {c.value}
              </p>
              <p className="text-[11px] sm:text-[12px] font-semibold text-ink-3 uppercase tracking-widest">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        {registrations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-16 text-center">
            <Users className="w-10 h-10 text-ink-4 mx-auto mb-4 opacity-30" />
            <h3 className="text-[18px] font-bold text-ink mb-1">No registrations yet</h3>
            <p className="text-[14px] text-ink-4 max-w-[360px] mx-auto leading-relaxed">
              Registrations will appear here as soon as people sign up for this event.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-cream-2/50">
                    <th className="text-left px-5 py-3 text-[11.5px] font-semibold text-ink-3 uppercase tracking-widest">Name</th>
                    <th className="text-left px-5 py-3 text-[11.5px] font-semibold text-ink-3 uppercase tracking-widest">Contact</th>
                    <th className="text-left px-5 py-3 text-[11.5px] font-semibold text-ink-3 uppercase tracking-widest">Company</th>
                    <th className="text-left px-5 py-3 text-[11.5px] font-semibold text-ink-3 uppercase tracking-widest">Registered</th>
                    <th className="text-left px-5 py-3 text-[11.5px] font-semibold text-ink-3 uppercase tracking-widest">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className="border-t border-black/[0.05] hover:bg-cream-2/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-[14px] font-semibold text-ink">{r.full_name}</p>
                        {r.linkedin_url && (
                          <a
                            href={r.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-orange-deep hover:underline"
                          >
                            LinkedIn ↗
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5 text-[13.5px] text-ink-2">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-ink-4" /> {r.email}
                          </span>
                          {r.phone && (
                            <span className="inline-flex items-center gap-1.5 text-ink-3">
                              <Phone className="w-3 h-3 text-ink-4" /> {r.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13.5px] text-ink-2">{r.company || "—"}</p>
                        {r.designation && (
                          <p className="text-[12px] text-ink-4">{r.designation}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3">
                          <Clock className="w-3 h-3 text-ink-4" />
                          {formatDateTime(r.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.confirmation_sent ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-4 bg-black/[0.05] rounded-full px-2.5 py-0.5">
                            Not sent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-black/[0.06]">
              {registrations.map((r) => (
                <div key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-ink truncate">{r.full_name}</p>
                      <p className="text-[12.5px] text-ink-4">{formatDateTime(r.created_at)}</p>
                    </div>
                    {r.confirmation_sent ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-4 bg-black/[0.05] rounded-full px-2 py-0.5">
                        Not sent
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-[13px] text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-ink-4" /> {r.email}
                    </span>
                    {r.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-ink-4" /> {r.phone}
                      </span>
                    )}
                    {(r.company || r.designation) && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-ink-4" />
                        {[r.company, r.designation].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </main>
  );
}
