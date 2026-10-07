"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, User, UserCog, ClipboardList, Info, Trash2 } from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, type AppStatus } from "@/components/admin/StatusBadge";

interface Log {
  id: string;
  admin_email: string;
  action_type: string;
  target_id: string;
  target_name: string;
  old_value: string;
  new_value: string;
  details: any;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin/logs");
        const json = await res.json();
        setLogs(json.data || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  function formatTime(iso: string) {
    const date = new Date(iso);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getActionLabel(log: Log) {
    switch (log.action_type) {
      case "status_change":
        return (
          <span>
            changed status of <span className="font-bold text-ink">{log.target_name}</span> from{" "}
            <span className="font-semibold text-ink-3 italic capitalize">{STATUS_CONFIG[log.old_value as AppStatus]?.label || log.old_value}</span> to{" "}
            <span className="font-bold text-orange capitalize">{STATUS_CONFIG[log.new_value as AppStatus]?.label || log.new_value}</span>
          </span>
        );
      case "manual_entry":
        return (
          <span>
            manually added a new entry for <span className="font-bold text-ink">{log.target_name}</span>
          </span>
        );
      case "note_updated":
        return (
          <span>
            updated internal notes for <span className="font-bold text-ink">{log.target_name}</span>
          </span>
        );
      case "application_deleted":
        return (
          <span>
            deleted the application of <span className="font-bold text-red-500">{log.target_name}</span>
          </span>
        );
      default:
        return <span>performed an action on {log.target_name}</span>;
    }
  }

  /**
   * Which dashboard a log entry belongs to. Routes stamp details.module;
   * ambassador ones predate the field, so an absent module still resolves to
   * ambassador and old rows keep working.
   */
  function moduleOf(log: Log): "ambassador" | "internship" | "events" {
    const m = log.details?.module;
    if (m === "internship") return "internship";
    if (m === "events") return "events";
    return "ambassador";
  }

  /**
   * An events row points at the event itself, not an application, so the link
   * text has to follow the module rather than saying "View Application" for a
   * record that is not one.
   */
  function linkLabel(log: Log): string {
    return moduleOf(log) === "events" ? "View Event" : "View Application";
  }

  function getActionIcon(type: string) {
    switch (type) {
      case "status_change": return <UserCog className="w-4 h-4 text-blue-500" />;
      case "manual_entry": return <User className="w-4 h-4 text-green-500" />;
      case "note_updated": return <ClipboardList className="w-4 h-4 text-amber-500" />;
      case "application_deleted": return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  }

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-8">
        <Link
          href="/admin/ambassador"
          className="inline-flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-ink tracking-tight">Audit Logs</h1>
          <p className="text-ink-3 mt-1 text-[16px]">Track all administrative actions and changes</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-cream-2 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-cream-2 rounded w-3/4" />
                    <div className="h-3 bg-cream-2 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center">
              <Clock className="w-12 h-12 text-ink-4 mx-auto mb-4 opacity-20" />
              <p className="text-ink-3">No activity logs found yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {logs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-cream/30 transition-colors flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center shrink-0 mt-0.5 border border-black/[0.05]">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <p className="text-[14px] text-ink-2">
                        <span className="font-bold text-ink">{log.admin_email}</span>{" "}
                        {getActionLabel(log)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-ink-4 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(log.created_at)}
                      </span>
                      {log.target_id && log.action_type !== "application_deleted" && (
                        <Link
                          href={`/admin/${moduleOf(log)}/${log.target_id}`}
                          className="text-[12px] text-orange hover:underline font-medium"
                        >
                          {linkLabel(log)}
                        </Link>
                      )}
                    </div>
                    {log.details && log.details.note_preview && (
                      <div className="mt-2 p-2.5 bg-cream-2 rounded-lg text-[13px] text-ink-3 border border-black/[0.03] italic">
                        &quot;{log.details.note_preview}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </main>
  );
}
