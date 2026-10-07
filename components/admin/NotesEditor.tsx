"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";

interface Props {
  applicationId: string;
  initialNotes: string | null;
}

export default function NotesEditor({ applicationId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (value: string) => {
    setSaving(true);
    try {
      await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, internal_notes: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [applicationId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-3 uppercase tracking-widest">
          Internal Notes
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        placeholder="Add internal notes about this applicant…"
        rows={4}
        className="w-full px-3.5 py-3 rounded-xl border border-black/12 text-[14px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all resize-none placeholder:text-ink-4 leading-relaxed"
      />
      <button
        onClick={() => save(notes)}
        disabled={saving}
        className="text-[13px] font-semibold text-orange hover:text-orange-dark transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}
