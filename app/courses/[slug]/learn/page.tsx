import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseConfigured } from "@/lib/portal/db";
import * as courses from "@/lib/market/courses";
import * as learning from "@/lib/market/learning";
import * as lessons from "@/lib/market/lessons";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { courseAction } from "../../actions";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = clean((await params).slug);
  const nc = lessons.nativeCourse(slug);
  if (!nc) return { title: "Course not found | GrowQR", robots: { index: false, follow: true } };
  return {
    title: `${nc.title}: Lessons | GrowQR`,
    description: Array.from(`${nc.tagline} ${nc.modules.length} modules with quizzes and a capstone project.`).slice(0, 155).join(""),
    alternates: { canonical: `${SITE_URL}/courses/${slug}/learn` },
    robots: { index: true, follow: true },
  };
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = clean((await params).slug);
  const nc = lessons.nativeCourse(slug);
  if (!nc || !databaseConfigured()) notFound();
  const course = await courses.bySlug(slug);
  if (!course) notFound();
  const me = await currentViewer();
  const enrol = me?.role === "student" ? await learning.find(me.id, course.id) : null;
  const done = new Set(enrol?.done ?? []);
  const next = nc.modules.findIndex((_, i) => !done.has(i));
  const nextKey = next < 0 ? (done.has(nc.modules.length) ? nc.modules[0].slug : "capstone") : nc.modules[next].slug;
  const btn = "inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg font-semibold text-[15px]";
  const tick = (ok: boolean, n: string, label: string) => (
    <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-full text-[14px] font-bold ${ok ? "bg-emerald-100 text-emerald-800" : "bg-cream-3 text-ink-2"}`}>
      {ok ? (<><span aria-hidden="true">&#10003;</span><span className="sr-only">Completed: {label}</span></>) : n}
    </span>
  );

  return (
    <MarketShell user={me} active="courses">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3 mb-4"><Link href="/courses" className="underline">Courses</Link> / <Link href={`/courses/${slug}`} className="underline">{nc.title}</Link> / Lessons</nav>
      <h1 className="text-[26px] sm:text-[32px] font-bold text-ink tracking-tight leading-tight">{nc.title}</h1>
      <p className="text-[16px] text-ink-3 mt-1 max-w-3xl">{nc.summary || nc.tagline}</p>
      {enrol ? <p className="mt-3 text-[14px] text-ink-2"><b>{enrol.progress}% complete.</b> Pass each module quiz to tick it off.</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/courses/${slug}/learn/${nextKey}`} className={`${btn} bg-orange-deep hover:bg-ink text-white`}>{enrol && enrol.done.length ? "Continue learning" : "Start module 1"}</Link>
        {me?.role === "student" && !enrol ? (
          <form action={courseAction}><input type="hidden" name="act" value="enrol" /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="back" value={`/courses/${slug}/learn`} /><button type="submit" className={`${btn} border border-black/[0.15] hover:bg-cream-2`}>Enrol and track progress</button></form>
        ) : null}
        {!me ? <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}/learn`)}`} className={`${btn} border border-black/[0.15] hover:bg-cream-2`}>Log in to save progress</Link> : null}
      </div>

      <ol className="mt-8 grid gap-3" aria-label="Modules">
        {nc.modules.map((m, i) => (
          <li key={m.slug} className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-4 sm:p-5">
            <Link href={`/courses/${slug}/learn/${m.slug}`} className="flex items-start gap-3 group">
              {tick(done.has(i), String(i + 1), m.title)}
              <span className="min-w-0">
                <b className="block text-[16px] text-ink group-hover:underline">{m.title}</b>
                <span className="block text-[14px] text-ink-3 mt-0.5">{m.summary}</span>
                <span className="block text-[12px] text-ink-3 mt-1">{m.hours} h &middot; {m.topics.length} lessons{m.quiz ? ` · ${m.quiz.questions.length}-question quiz` : ""}</span>
              </span>
            </Link>
          </li>
        ))}
        <li className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-4 sm:p-5">
          <Link href={`/courses/${slug}/learn/capstone`} className="flex items-start gap-3 group">
            {tick(done.has(nc.modules.length), "★", "capstone")}
            <span className="min-w-0"><b className="block text-[16px] text-ink group-hover:underline">{nc.capstone.title}</b><span className="block text-[14px] text-ink-3 mt-0.5">{nc.capstone.summary}</span></span>
          </Link>
        </li>
      </ol>
    </MarketShell>
  );
}
