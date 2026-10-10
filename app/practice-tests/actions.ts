"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/portal/guard";
import { databaseConfigured } from "@/lib/portal/db";
import * as attempts from "@/lib/tests/attempts";
import * as ielts from "@/lib/tests/ielts";

/** Grade a submitted IELTS test on the server, keep the attempt for a logged-in student, and send everyone to the same stateless result URL. */
export async function submitIelts(fd: FormData): Promise<void> {
  const exam = String(fd.get("exam") ?? "");
  const kind = exam.replace(/^ielts-/, "");
  const n = Math.trunc(Number(fd.get("n")));
  if (!exam.startsWith("ielts-") || !ielts.isKind(kind) || !ielts.validNumber(n)) redirect("/practice-tests");
  const test = ielts.load(kind, n);
  if (!test) redirect("/practice-tests");
  const answers: Record<string, string> = {};
  for (let q = 1; q <= ielts.QUESTIONS; q++) {
    const v = fd.get(`q${q}`);
    if (typeof v === "string" && v.trim() !== "") answers[String(q)] = v.trim().slice(0, 80);
  }
  const elapsed = Math.max(0, Math.min(86400, Math.trunc(Number(fd.get("elapsed")) || 0)));
  const res = ielts.grade(kind, test, answers);
  if (databaseConfigured()) {
    const me = await currentUser();
    if (me && me.role === "student") await attempts.save(me.id, { exam, testNo: n, raw: res.raw, total: res.total, band: res.band, answers, seconds: elapsed });
  }
  redirect(`/practice-tests/${exam}/${n}?a=${ielts.encodeAnswers(answers)}&t=${elapsed}#result`);
}
