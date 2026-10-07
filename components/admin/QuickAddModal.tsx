import { useState } from "react";
import { X, Loader2, Plus, User, GraduationCap, Globe, MessageSquare } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

type Tab = "core" | "academic" | "social" | "answers";

export default function QuickAddModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("core");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    college: "",
    course: "",
    phone: "",
    whatsapp: "",
    passing_year: "",
    student_id: "",
    linkedin: "",
    instagram: "",
    youtube: "",
    resume: "",
    why_join: "",
    why_fit: "",
    led_something: "",
    experience: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add entry");
      }

      setOpen(false);
      resetForm();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      full_name: "", email: "", college: "", course: "", phone: "", whatsapp: "",
      passing_year: "", student_id: "", linkedin: "", instagram: "", youtube: "",
      resume: "", why_join: "", why_fit: "", led_something: "", experience: ""
    });
    setActiveTab("core");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-lg text-[14px] font-semibold hover:bg-orange-600 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Quick Add
      </button>
    );
  }

  const tabClass = (tab: Tab) => `flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all border-b-2 ${
    activeTab === tab ? "border-orange text-orange bg-orange/5" : "border-transparent text-ink-3 hover:text-ink hover:bg-black/5"
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-black/[0.1] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-[height] ease-in-out">
        <div className="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-ink">Quick Add Application</h3>
          <button onClick={() => { setOpen(false); resetForm(); }} className="text-ink-4 hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-black/[0.05] bg-cream/30">
          <button onClick={() => setActiveTab("core")} className={tabClass("core")}>
            <User className="w-4 h-4" /> Core Info
          </button>
          <button onClick={() => setActiveTab("academic")} className={tabClass("academic")}>
            <GraduationCap className="w-4 h-4" /> Academic
          </button>
          <button onClick={() => setActiveTab("social")} className={tabClass("social")}>
            <Globe className="w-4 h-4" /> Online Presence
          </button>
          <button onClick={() => setActiveTab("answers")} className={tabClass("answers")}>
            <MessageSquare className="w-4 h-4" /> Answers
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] flex-1 custom-scrollbar">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg">
                {error}
              </div>
            )}

            {activeTab === "core" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={formData.full_name} required placeholder="John Doe" onChange={v => setFormData({...formData, full_name: v})} />
                  <Input label="Email Address" type="email" value={formData.email} required placeholder="john@example.com" onChange={v => setFormData({...formData, email: v})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={formData.phone} required placeholder="+91..." onChange={v => setFormData({...formData, phone: v})} />
                  <Input label="WhatsApp" value={formData.whatsapp} required placeholder="+91..." onChange={v => setFormData({...formData, whatsapp: v})} />
                </div>
                <Input label="College" value={formData.college} required placeholder="University Name" onChange={v => setFormData({...formData, college: v})} />
              </div>
            )}

            {activeTab === "academic" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Input label="Course" value={formData.course} required placeholder="B.Tech, BBA etc" onChange={v => setFormData({...formData, course: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Passing Year" value={formData.passing_year} required placeholder="2025" onChange={v => setFormData({...formData, passing_year: v})} />
                  <Input label="Student ID" value={formData.student_id} required placeholder="ID Number" onChange={v => setFormData({...formData, student_id: v})} />
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Input label="LinkedIn URL" value={formData.linkedin} required placeholder="https://linkedin.com/in/..." onChange={v => setFormData({...formData, linkedin: v})} />
                <Input label="Instagram Handle" value={formData.instagram} placeholder="@username" onChange={v => setFormData({...formData, instagram: v})} />
                <Input label="YouTube Channel" value={formData.youtube} placeholder="URL" onChange={v => setFormData({...formData, youtube: v})} />
                <Input label="Resume Link" value={formData.resume} required placeholder="https://drive.google.com/..." onChange={v => setFormData({...formData, resume: v})} />
              </div>
            )}

            {activeTab === "answers" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <TextArea label="Why do you want to join? (min 20 characters)" value={formData.why_join} onChange={v => setFormData({...formData, why_join: v})} />
                <TextArea label="Why are you a good fit? (min 20 characters)" value={formData.why_fit} onChange={v => setFormData({...formData, why_fit: v})} />
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">
                    Have you led or organized something? <span className="text-orange">*</span>
                  </label>
                  <select
                    value={formData.led_something}
                    required
                    onChange={(e) => setFormData({ ...formData, led_something: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-black/[0.1] text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/40 transition-all"
                  >
                    <option value="">Select…</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <TextArea label="Previous Experience" value={formData.experience} onChange={v => setFormData({...formData, experience: v})} />
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-cream/30 border-t border-black/[0.05] flex gap-3">
            <button
              type="button"
              onClick={() => { setOpen(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 border border-black/[0.1] text-ink-2 font-semibold rounded-lg hover:bg-white transition-colors text-[14px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-ink text-white font-semibold rounded-lg hover:bg-ink/90 transition-colors text-[14px] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Entry"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}

function Input({ label, value, onChange, required, type = "text", placeholder }: InputProps) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[11px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 rounded-lg border border-black/[0.08] text-[14px] outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/50 transition-all placeholder:text-ink-5 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function TextArea({ label, value, onChange }: TextAreaProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 rounded-lg border border-black/[0.08] text-[14px] outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/50 transition-all bg-white resize-none"
      />
    </div>
  );
}
