import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseConfigured } from "@/lib/portal/db";
import * as courses from "@/lib/market/courses";
import * as learning from "@/lib/market/learning";
import * as lessons from "@/lib/market/lessons";
import { currentViewer, MarketShell } from "@/components/market/shell";
import { quizAction } from "../actions";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");
const html = (s: string) => ({ __html: lessons.cleanHtml(s) });

export async function generateMetadata({ params }: { params: Promise<{ slug: string; step: string }> }): Promise<Metadata> {
  const p = await params;
  const slug = clean(p.slug);
  const nc = lessons.nativeCourse(slug);
  const at = nc ? lessons.stepFor(nc, clean(p.step)) : null;
  if (!nc || !at) return { title: "Lesson not found | GrowQR", robots: { index: false, follow: true } };
  const title = at.capstone ? nc.capstone.title : at.module!.title;
  const desc = at.capstone ? nc.capstone.summary : at.module!.summary;
  return {
    title: `${title} | ${nc.title}`.slice(0, 60) + " | GrowQR",
    description: Array.from(desc).slice(0, 155).join(""),
    alternates: { canonical: `${SITE_URL}/courses/${slug}/learn/${at.capstone ? "capstone" : at.module!.slug}` },
    robots: { index: true, follow: true },
  };
}

const card = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7";
const prose =
  "text-[16px] leading-relaxed text-ink-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-4 [&_h3]:mb-2 [&_code]:bg-cream-3 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-cream-3 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto [&_svg]:max-w-full [&_svg]:h-auto";
const btn = "inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg font-semibold text-[15px]";

export default async function StepPage({ params, searchParams }: { params: Promise<{ slug: string; step: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await params;
  const sp = await searchParams;
  const slug = clean(p.slug);
  const nc = lessons.nativeCourse(slug);
  const at = nc ? lessons.stepFor(nc, clean(p.step)) : null;
  if (!nc || !at || !databaseConfigured()) notFound();
  const course = await courses.bySlug(slug);
  if (!course) notFound();
  const me = await currentViewer();
  const enrol = me?.role === "student" ? await learning.find(me.id, course.id) : null;
  const m = at.module;
  const quiz = at.capstone ? nc.capstone.quiz : m?.quiz ?? null;
  const key = at.capstone ? "capstone" : m!.slug;
  const prev = at.index > 0 ? nc.modules[at.index - 1].slug : null;
  const next = at.capstone ? null : at.index + 1 < nc.modules.length ? nc.modules[at.index + 1].slug : "capstone";
  const picked = (sp.a ?? "").split(".").slice(0, 60).map((x) => (/^\d{1,2}$/.test(x) ? Number(x) : null));
  const result = quiz && sp.a ? lessons.gradeQuiz(quiz, picked) : null;
  const title = at.capstone ? nc.capstone.title : m!.title;
  const jsonld = { "@context": "https://schema.org", "@type": "LearningResource", name: title, isPartOf: { "@type": "Course", name: nc.title, url: `${SITE_URL}/courses/${slug}` }, inLanguage: "en", learningResourceType: at.capstone ? "Project" : "Lesson" };

  return (
    <MarketShell user={me} active="courses">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3 mb-4"><Link href="/courses" className="underline">Courses</Link> / <Link href={`/courses/${slug}/learn`} className="underline">{nc.title}</Link> / {at.capstone ? "Capstone" : `Module ${at.index + 1}`}</nav>
      <h1 className="text-[26px] sm:text-[32px] font-bold text-ink tracking-tight leading-tight">{title}</h1>
      <p className="text-[16px] text-ink-3 mt-1 max-w-3xl">{m ? m.outcome : nc.capstone.summary}</p>

      <div className="mt-6 grid gap-6 max-w-4xl">
        {m ? (
          <>
            {m.intro ? <article className={card}><div className={prose} dangerouslySetInnerHTML={html(m.intro)} /></article> : null}
            {m.topics.map((t, i) => (
              <article key={t.slug} className={card} id={t.slug}>
                <h2 className="text-[20px] font-bold text-ink mb-3">{i + 1}. {t.title}</h2>
                <div className={prose} dangerouslySetInnerHTML={html(t.html)} />
                {t.keyPoints.length ? (<><h3 className="text-[16px] font-semibold text-ink mt-4 mb-1">Key points</h3><ul className="list-disc pl-5 text-[15px] text-ink-2 space-y-1">{t.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul></>) : null}
              </article>
            ))}
            {m.practical ? (
              <article className={card}>
                <h2 className="text-[20px] font-bold text-ink mb-2">{m.practical.title}</h2>
                {m.practical.intro ? <p className="text-[15px] text-ink-2 mb-2">{m.practical.intro}</p> : null}
                <ol className="list-decimal pl-5 space-y-1 text-[15px] text-ink-2">{m.practical.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={html(s)} />)}</ol>
              </article>
            ) : null}
          </>
        ) : (
          <article className={card}>
            {nc.capstone.intro ? <div className={prose} dangerouslySetInnerHTML={html(nc.capstone.intro)} /> : null}
            {nc.capstone.projectTitle ? <h2 className="text-[20px] font-bold text-ink mt-4 mb-2">{nc.capstone.projectTitle}</h2> : null}
            <ol className="list-decimal pl-5 space-y-1 text-[15px] text-ink-2 mt-2">{nc.capstone.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={html(s)} />)}</ol>
          </article>
        )}

        {quiz ? (
          <section className={card} id="quiz" aria-labelledby="quiz-h">
            <h2 id="quiz-h" className="text-[20px] font-bold text-ink mb-1">{at.capstone ? "Final assessment" : "Module quiz"}</h2>
            <p className="text-[14px] text-ink-3 mb-4">{quiz.questions.length} questions. You need {quiz.pass}% to pass{me?.role === "student" ? " and tick this checkpoint" : ""}.</p>
            {result ? (
              <div id="result" role="status" className={`rounded-xl p-4 mb-5 ${result.passed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
                <b className="block text-[16px]">{result.passed ? "Passed" : "Not passed yet"}: {result.score} of {result.total} correct ({result.percent}%)</b>
                <span className="text-[14px]">
                  {result.passed
                    ? sp.s === "completed" ? "Course complete. Every checkpoint is ticked." : sp.s === "saved" ? "Checkpoint saved to your progress." : sp.s === "guest" ? "Log in as a student to save your progress." : ""
                    : `Review the answers below and try again. The pass mark is ${quiz.pass}%.`}
                </span>
              </div>
            ) : null}
            <form action={quizAction}>
              <input type="hidden" name="slug" value={slug} /><input type="hidden" name="step" value={key} />
              <ol className="space-y-6">
                {quiz.questions.map((q, i) => {
                  const r = result?.review[i];
                  return (
                    <li key={i}>
                      <fieldset>
                        <legend className="text-[15px] font-semibold text-ink mb-2"><span dangerouslySetInnerHTML={html(`${i + 1}. ${q.text}`)} /></legend>
                        <ul className="space-y-1">
                          {q.options.map((o, j) => (
                            <li key={j}>
                              <label className={`flex items-start gap-2.5 min-h-[44px] px-2 py-1.5 rounded-lg text-[15px] text-ink-2 ${r && j === r.correct ? "bg-emerald-50" : r && j === r.picked ? "bg-red-50" : ""}`}>
                                <input type="radio" name={`q${i}`} value={j} defaultChecked={r?.picked === j} className="mt-1" />
                                <span dangerouslySetInnerHTML={html(o)} />
                                {r && j === r.correct ? <span className="ml-auto text-[12px] font-semibold text-emerald-800">Correct answer</span> : r && j === r.picked ? <span className="ml-auto text-[12px] font-semibold text-red-800">Your answer</span> : null}
                              </label>
                            </li>
                          ))}
                        </ul>
                        {r && !r.right && r.explanation ? <p className="text-[14px] text-ink-3 mt-2" dangerouslySetInnerHTML={html(r.explanation)} /> : null}
                      </fieldset>
                    </li>
                  );
                })}
              </ol>
              <button type="submit" className={`${btn} bg-orange hover:bg-orange-dark text-white mt-6`}>{result ? "Submit again" : "Submit answers"}</button>
            </form>
          </section>
        ) : null}

        <nav aria-label="Lesson navigation" className="flex flex-wrap justify-between gap-3">
          {prev ? <Link href={`/courses/${slug}/learn/${prev}`} className={`${btn} border border-black/[0.15] hover:bg-cream-2`}>&larr; Previous module</Link> : <Link href={`/courses/${slug}/learn`} className={`${btn} border border-black/[0.15] hover:bg-cream-2`}>All modules</Link>}
          {next ? <Link href={`/courses/${slug}/learn/${next}`} className={`${btn} bg-orange hover:bg-orange-dark text-white`}>{next === "capstone" ? "Go to capstone" : "Next module"} &rarr;</Link> : <Link href={`/courses/${slug}`} className={`${btn} bg-orange hover:bg-orange-dark text-white`}>Back to course</Link>}
        </nav>
      </div>
    </MarketShell>
  );
}
