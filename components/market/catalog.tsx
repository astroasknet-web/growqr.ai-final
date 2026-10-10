import Link from "next/link";
import glyphs from "@/lib/market/data/course-glyphs.json";
import type { Course } from "@/lib/market/courses";
import { isNative } from "@/lib/market/lessons";
import { thumbSpec, type ThumbSpec } from "@/lib/market/thumb";

/** A course's own cover: category colours, its subject glyph, and a pattern chosen from its slug (see lib/market/thumb.ts). Decorative: the title sits right next to it. */
export function CourseThumb({ course, className = "" }: { course: Pick<Course, "slug" | "icon" | "c1" | "c2">; className?: string }) {
  const s: ThumbSpec = thumbSpec(course.slug, course.icon, course.c1, course.c2);
  const gid = `g-${course.slug}`;
  const glyph = (glyphs as Record<string, string>)[course.icon] ?? (glyphs as Record<string, string>).sparkles;
  const gx = s.side === "left" ? 28 : 228;
  const stroke = "#fff";
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={`block w-full h-full ${className}`}>
      <defs>
        <linearGradient id={gid} gradientTransform={`rotate(${s.angle} .5 .5)`}>
          <stop offset="0" stopColor={s.from} />
          <stop offset="1" stopColor={s.to} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx={s.side === "left" ? "0.25" : "0.75"} cy="0.45" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${gid})`} />
      <g fill="none" stroke="#fff" strokeWidth="2">
        {s.pattern === "rings" ? s.shapes.map((p, i) => <circle key={i} cx={s.side === "left" ? 300 : 20} cy={150} r={40 + i * 34} strokeOpacity={0.2 - i * 0.04} />) : null}
        {s.pattern === "stripes" ? s.shapes.map((p, i) => <line key={i} x1={-20 + i * 62} y1={190} x2={80 + i * 62} y2={-10} strokeOpacity={p.o + 0.04} strokeWidth={6 + (i % 3) * 4} />) : null}
        {s.pattern === "waves" ? s.shapes.slice(0, 4).map((p, i) => <path key={i} d={`M-10 ${60 + i * 34} Q 80 ${20 + i * 34 + p.r / 2} 160 ${60 + i * 34} T 330 ${60 + i * 34}`} strokeOpacity={0.16 + i * 0.03} />) : null}
      </g>
      {s.pattern === "dots" ? <g fill="#fff">{Array.from({ length: 8 * 4 }, (_, i) => <circle key={i} cx={30 + (i % 8) * 38 + (s.shapes[0].x % 12)} cy={30 + Math.floor(i / 8) * 40 + (s.shapes[0].y % 10)} r="2.4" fillOpacity={0.28} />)}</g> : null}
      {s.pattern === "bubbles" ? <g fill="#fff">{s.shapes.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fillOpacity={p.o} />)}</g> : null}
      {s.pattern === "blocks" ? <g fill="#fff">{s.shapes.map((p, i) => <rect key={i} x={p.x - p.r} y={p.y - p.r} width={p.r * 1.6} height={p.r * 1.6} rx="8" transform={`rotate(${p.rot} ${p.x} ${p.y})`} fillOpacity={p.o} />)}</g> : null}
      <rect width="320" height="180" fill={`url(#${gid}-glow)`} />
      <g transform={`translate(${gx} 42)`}>
        <rect width="64" height="64" rx="16" fill="#fff" fillOpacity="0.16" stroke="#fff" strokeOpacity="0.35" />
        <g transform="translate(10 10) scale(1.83)" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: glyph }} />
      </g>
    </svg>
  );
}

export interface Progress { status: "enrolled" | "in_progress" | "completed"; progress: number }

/** The one action a card offers, from what the student has actually done in this course. */
export function ctaFor(course: Pick<Course, "slug">, p: Progress | undefined): { label: string; href: string; tone: "primary" | "quiet" } {
  if (!isNative(course.slug)) return { label: "Explore course", href: `/courses/${course.slug}`, tone: "quiet" };
  const learn = `/courses/${course.slug}/learn`;
  if (!p || (p.status === "enrolled" && p.progress === 0)) return { label: p ? "Start learning" : "Start learning", href: learn, tone: "primary" };
  if (p.status === "completed") return { label: "Review course", href: learn, tone: "quiet" };
  return { label: "Continue learning", href: learn, tone: "primary" };
}

const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

export function CatalogCard({ course, progress }: { course: Course; progress?: Progress }) {
  const here = isNative(course.slug);
  const cta = ctaFor(course, progress);
  const pct = progress ? Math.max(0, Math.min(100, progress.progress)) : 0;
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-shadow duration-200 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(16,24,40,0.28)] focus-within:shadow-[0_12px_28px_-12px_rgba(16,24,40,0.28)]">
      <Link href={`/courses/${course.slug}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/9] overflow-hidden">
        <CourseThumb course={course} className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold leading-none text-white backdrop-blur-sm">{course.cat_name}</span>
        {progress && progress.status === "completed" ? <span className="absolute right-3 top-3 rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold leading-none text-white">Completed</span> : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[12px] font-medium text-ink-3">{course.level_label}{course.badge ? <> &middot; {course.badge}</> : null}</p>
        <h3 className="mt-1 text-[16px] font-semibold leading-snug text-ink">
          <Link href={`/courses/${course.slug}`} className={`rounded hover:underline underline-offset-2 ${ring}`}>{course.title}</Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-3">{course.brief}</p>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-3" aria-label="Course details">
          <li>{course.hours}</li>
          <li>{course.modules} modules</li>
          {course.weeks ? <li>{course.weeks}</li> : null}
        </ul>
        {pct > 0 && progress?.status !== "completed" ? (
          <div className="mt-3" role="img" aria-label={`${pct} percent complete`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-cream-3"><span className="block h-full rounded-full bg-orange-deep" style={{ width: `${pct}%` }} /></div>
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
          <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${here ? "text-emerald-800" : "text-ink-3"}`}>
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${here ? "bg-emerald-600" : "bg-black/25"}`} />
            {here ? "Lessons available" : "Lessons coming soon"}
          </span>
          <Link
            href={cta.href}
            className={`inline-flex min-h-[40px] items-center rounded-lg px-4 text-[13.5px] font-semibold transition-colors ${ring} ${cta.tone === "primary" ? "bg-orange-deep text-white hover:bg-ink" : "border border-black/[0.18] text-ink hover:bg-cream-2"}`}
          >
            {cta.label}<span className="sr-only">: {course.title}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
