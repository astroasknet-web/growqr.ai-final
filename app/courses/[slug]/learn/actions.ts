"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/portal/guard";
import * as courses from "@/lib/market/courses";
import * as learning from "@/lib/market/learning";
import * as lessons from "@/lib/market/lessons";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

/**
 * Grade a module (or capstone) quiz on the server. Passing ticks that checkpoint for a student (enrolling them if needed); the picked
 * answers go back in the URL so the page can show the review without storing anything. Anyone can take a quiz, only students keep progress.
 */
export async function quizAction(fd: FormData): Promise<void> {
  const slug = clean(String(fd.get("slug") ?? ""));
  const step = clean(String(fd.get("step") ?? ""));
  const nc = lessons.nativeCourse(slug);
  const at = nc ? lessons.stepFor(nc, step) : null;
  if (!nc || !at) redirect("/courses");
  const quiz = at.capstone ? nc.capstone.quiz : at.module?.quiz;
  const here = `/courses/${slug}/learn/${step}`;
  if (!quiz) redirect(here);
  const picked = quiz.questions.map((_, i) => {
    const v = fd.get(`q${i}`);
    return v === null || v === "" ? null : Math.trunc(Number(v));
  });
  const res = lessons.gradeQuiz(quiz, picked);
  let saved = "";
  if (res.passed) {
    const me = await currentUser();
    const course = await courses.bySlug(slug);
    if (me && me.role === "student" && course) {
      await learning.enrol(me.id, course.id);
      const e = await learning.find(me.id, course.id);
      if (e && !e.verified) {
        const r = await learning.setDone(me.id, course, [...e.done, at.index]);
        saved = r?.status === "completed" ? "completed" : "saved";
      }
    } else saved = "guest";
  }
  const a = picked.map((p) => (p === null ? "x" : String(p))).join(".");
  redirect(`${here}?a=${a}${saved ? "&s=" + saved : ""}#result`);
}
