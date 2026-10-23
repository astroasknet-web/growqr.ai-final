export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Phone, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/data/server";
import StatusDropdown from "@/components/admin/StatusDropdown";
import NotesEditor from "@/components/admin/NotesEditor";
import StatusBadgeServer from "@/components/admin/StatusBadgeServer";
import ApplicationAnswers from "@/components/admin/ApplicationAnswers";

const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
};

async function getApplication(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ambassador_applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

async function getResumeUrl(path: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("resumes")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const resumeUrl = app.resume ? await getResumeUrl(app.resume) : null;

  function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
      <div>
        <p className="text-[12px] font-semibold text-ink-3 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[15px] text-ink-2">{value}</p>
      </div>
    );
  }

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link
          href="/admin/ambassador"
          className="inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] text-ink-3 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Identity card */}
            <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h1 className="text-[22px] md:text-[24px] lg:text-[26px] font-bold text-ink tracking-tightest">{app.full_name}</h1>
                  <p className="text-[14px] md:text-[15px] text-ink-3 mt-0.5">{app.email}</p>
                </div>
                <StatusBadgeServer status={app.status} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="College" value={app.college} />
                <Field label="Campus Location" value={app.college_location} />
                <Field label="Course" value={app.course} />
                <Field label="Passing Year" value={app.passing_year} />
                <Field label="Student ID" value={app.student_id} />
                <Field label="Gender" value={GENDER_LABEL[app.gender ?? ""] ?? app.gender} />
                <Field label="Aadhaar Number" value={app.aadhaar_number} />
                <Field label="Home Town" value={app.home_town} />
                <Field label="Current Address" value={app.current_address} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {app.phone && (
                  <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-orange transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {app.phone}
                  </a>
                )}
                {app.whatsapp && (
                  <a href={`https://wa.me/${app.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-orange transition-colors">
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {app.email && (
                  <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-orange transition-colors">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </div>
            </div>

            {/* Online presence */}
            <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-ink mb-4">Online Presence</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">LinkedIn</p>
                  {app.linkedin ? (
                    <a href={app.linkedin} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[14px] hover:bg-blue-100 transition-colors">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 min-w-0">
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Instagram</p>
                  {app.instagram ? (
                    <a 
                      href={app.instagram.includes("http") ? app.instagram : `https://instagram.com/${app.instagram.replace("@", "")}`} 
                      target="_blank" 
                      rel="noopener" 
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-700 text-[14px] hover:bg-pink-100 transition-colors overflow-hidden"
                    >
                      <span className="truncate">
                        {app.instagram.includes("http") ? "View" : `@${app.instagram.replace("@", "")}`}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">YouTube</p>
                  {app.youtube ? (
                    <a href={app.youtube} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[14px] hover:bg-red-100 transition-colors">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Resume</p>
                  {resumeUrl ? (
                    <a href={resumeUrl} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-orange-lighter text-orange text-[14px] hover:bg-orange-light transition-colors">
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> View</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-[13px] border border-dashed border-gray-200">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Essay answers */}
            <ApplicationAnswers
              why_join={app.why_join}
              why_fit={app.why_fit}
              led_something={app.led_something}
              experience={app.experience}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Status management */}
            <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
              <h2 className="text-[15px] md:text-[16px] font-semibold text-ink mb-3">Status</h2>
              <StatusDropdown applicationId={app.id} currentStatus={app.status} />
              {app.created_at && (
                <p className="text-[12px] md:text-[13px] text-ink-4 mt-3">
                  Applied {new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
              <NotesEditor applicationId={app.id} initialNotes={app.internal_notes} />
            </div>
          </div>
        </div>
    </main>
  );
}
