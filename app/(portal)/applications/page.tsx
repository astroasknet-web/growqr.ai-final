import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/portal/guard";
import * as apps from "@/lib/market/applications";
import * as saved from "@/lib/market/saved";
import * as jobs from "@/lib/market/jobs";
import { Card, PortalPage } from "@/components/portal/shell";

export const metadata: Metadata = { title: "My applications | GrowQR" };
export const dynamic = "force-dynamic";

const PILL: Record<string, string> = {
  Applied: "bg-cream-3 text-ink-2", Viewed: "bg-sky-50 text-sky-800", Shortlisted: "bg-indigo-50 text-indigo-800", Interview: "bg-violet-50 text-violet-800",
  Offered: "bg-emerald-50 text-emerald-800", Hired: "bg-emerald-100 text-emerald-900", Rejected: "bg-red-50 text-red-800",
};
const day = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function ApplicationsPage() {
  const me = await requireUser("student");
  const list = await apps.forStudent(me.id);
  const savedIds = await saved.ids(me.id);
  const savedJobs = (await jobs.live()).filter((j) => savedIds.includes(j.id));
  return (
    <PortalPage user={me} active="applications" title="My applications" subtitle="Every stage of every application, with the employer's reason if they say no." wide>
      <Card>
        {list.length ? (
          <ul className="divide-y divide-black/[0.07]">
            {list.map((a) => (
              <li key={a.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/internships/${a.slug}`} className="font-semibold text-ink hover:underline">{a.title}</Link>
                  <p className="text-[14px] text-ink-3">{a.company} &middot; applied {day(a.created_at)}{a.match_score !== null ? ` · ${Number(a.match_score)}% match` : ""}</p>
                  {a.last_note ? <p className="text-[14px] text-ink-2 mt-1">{a.last_note}</p> : null}
                </div>
                <span className={`px-3 py-1 rounded-full text-[13px] font-medium ${PILL[a.status] ?? PILL.Applied}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-3">You have not applied yet. <Link className="underline" href="/internships">Browse internships</Link>.</p>
        )}
      </Card>
      {savedJobs.length ? (
        <Card title="Saved internships">
          <ul className="divide-y divide-black/[0.07]">
            {savedJobs.map((j) => (
              <li key={j.id} className="py-3 flex justify-between gap-3"><Link className="font-medium text-ink hover:underline" href={`/internships/${j.slug}`}>{j.title}</Link><span className="text-[14px] text-ink-3">{j.company}</span></li>
            ))}
          </ul>
        </Card>
      ) : null}
    </PortalPage>
  );
}
