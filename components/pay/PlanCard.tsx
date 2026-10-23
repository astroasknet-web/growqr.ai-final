import Link from "next/link";
import { Card } from "@/components/portal/shell";
import { PLAN_COURSE_QUOTA, planCourses } from "@/lib/pay/plans";
import { pool, rows } from "@/lib/pay/db";

const day = (s: string | null): string => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/** The student's plan on their dashboard: what they hold, until when, and the courses it includes. */
export default async function PlanCard({ userId }: { userId: number }) {
  const s = await planCourses(userId);
  const titles = s.picked.length ? await rows<{ slug: string; title: string }>(pool, "SELECT slug, title FROM courses WHERE slug IN ($1)", [s.picked]) : [];
  const title = (slug: string): string => titles.find((t) => t.slug === slug)?.title ?? slug;

  if (!s.plan) {
    return (
      <Card title="Your plan">
        <p className="text-[15px] text-ink-2"><b>Free</b>. You can read what is in every course. A paid plan includes courses and more: Pro {PLAN_COURSE_QUOTA.pro} course, Silver {PLAN_COURSE_QUOTA.silver}, Gold {PLAN_COURSE_QUOTA.gold}, plus the full Vedic Mathematics course.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/pricing" className="inline-flex min-h-[48px] items-center rounded-lg bg-orange px-5 text-[15px] font-semibold text-white hover:bg-orange-dark">See plans</Link>
          <Link href="/courses" className="inline-flex min-h-[48px] items-center rounded-lg border border-black/[0.15] px-5 text-[15px] font-semibold text-ink hover:bg-cream-2">Browse courses</Link>
        </div>
      </Card>
    );
  }
  return (
    <Card title="Your plan">
      <p className="text-[15px] text-ink-2"><b>{s.plan.name}</b>{s.plan.expiresAt ? <> · active until {day(s.plan.expiresAt)}</> : null}</p>
      <h3 className="mt-4 text-[14px] font-semibold text-ink">Courses included ({s.picked.length} of {s.plan.courseQuota} chosen)</h3>
      <ul className="mt-2 space-y-1.5 text-[15px]">
        {s.picked.map((slug, i) => (
          <li key={slug} className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/courses/${slug}`} className="font-medium text-ink underline underline-offset-2">{title(slug)}</Link>
            <span className={`text-[13px] ${i < s.plan!.courseQuota ? "text-emerald-700" : "text-amber-700"}`}>{i < s.plan!.courseQuota ? "Open" : "Not in your current plan"}</span>
          </li>
        ))}
        {!s.picked.length ? <li className="text-ink-3">None chosen yet.</li> : null}
      </ul>
      {s.left > 0 ? (
        <p className="mt-3 text-[14px] text-ink-2">You can still choose <b>{s.left}</b> {s.left === 1 ? "course" : "courses"}. Open a course and press &ldquo;Use my plan&rdquo;. <Link href={`/courses?available=1`} className="font-semibold underline">Courses you can start now</Link></p>
      ) : <p className="mt-3 text-[14px] text-ink-3">You have chosen all the courses your plan includes.</p>}
      <div className="mt-4 flex flex-wrap gap-3 text-[14px]">
        <Link href="/my-courses" className="inline-flex min-h-[44px] items-center rounded-lg bg-ink px-4 font-semibold text-white">My courses and progress</Link>
        <Link href="/vedic-math" className="inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] px-4 font-semibold text-ink hover:bg-cream-2">Vedic Mathematics (all 30 modules)</Link>
        <Link href="/billing" className="inline-flex min-h-[44px] items-center rounded-lg border border-black/[0.15] px-4 font-semibold text-ink hover:bg-cream-2">Billing</Link>
      </div>
    </Card>
  );
}
