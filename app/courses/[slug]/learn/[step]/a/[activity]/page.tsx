import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseConfigured } from "@/lib/portal/db";
import * as lessons from "@/lib/market/lessons";
import { aiAvailable } from "@/lib/learn/assist";
import { cleanState, findActivity, initialState } from "@/lib/learn/activities";
import { nextActivity } from "@/lib/learn/next";
import * as results from "@/lib/learn/results";
import ActivityRunner from "@/components/learn/ActivityRunner";
import { currentViewer, MarketShell } from "@/components/market/shell";

export const dynamic = "force-dynamic";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string; step: string; activity: string }> }): Promise<Metadata> {
  const p = await params;
  const a = findActivity(clean(p.slug), p.activity);
  return { title: a ? `${a.title} | Practice | GrowQR` : "Activity not found | GrowQR", robots: { index: false, follow: true } };
}

export default async function ActivityPage({ params }: { params: Promise<{ slug: string; step: string; activity: string }> }) {
  const p = await params;
  const slug = clean(p.slug);
  const step = clean(p.step);
  const nc = lessons.nativeCourse(slug);
  const a = findActivity(slug, p.activity);
  if (!nc || !a || a.module !== step || !databaseConfigured()) notFound();
  const mod = nc.modules.find((m) => m.slug === step);
  const me = await currentViewer();
  const isStudent = me?.role === "student";
  let initial = initialState(a);
  if (isStudent) {
    const saved = await results.savedState(me!.id, slug, a.id);
    const cleaned = saved ? cleanState(a, saved) : null;
    if (cleaned) initial = cleaned;
  }
  const nxt = nextActivity(slug, step, a.id);
  const back = `/courses/${slug}/learn/${step}`;
  return (
    <MarketShell user={me} active="courses">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ink-3"><Link href="/courses" className="underline">Courses</Link> / <Link href={`/courses/${slug}/learn`} className="underline">{nc.title}</Link> / <Link href={back} className="underline">{mod?.title ?? nc.capstone.title}</Link> / Practice</nav>
      <ActivityRunner slug={slug} activity={a} initial={initial} signedIn={isStudent} aiEnabled={isStudent && aiAvailable()} backHref={back} nextHref={nxt ? `${back}/a/${nxt.id}` : `${back}#quiz`} nextLabel={nxt ? `Next: ${nxt.title}` : "On to the module quiz"} />
    </MarketShell>
  );
}
