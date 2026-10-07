"use server";

import { extractFile, ExtractError } from "@/lib/qrscore/extract";
import { adviceFromResult, gateMessage, isScored, scoreExtraction, scoreText } from "@/lib/qrscore";
import { courseIdeas, saveSubmission } from "@/lib/portal/free-score";
import { recordRejection } from "@/lib/portal/passport/resumes";
import { clientIp, fails, recordFail } from "@/lib/portal/security";
import { putSessionData } from "@/lib/portal/session";
import { headers } from "next/headers";

/** The public "free resume score": upload or paste, get a score and three focus areas, nothing stored against a person. */
export interface FreeScoreState {
  error?: string;
  result?: { score: number; grade: string; verdict: string; advice: Array<{ title: string; text: string }>; courses: Array<{ title: string; cat: string; url: string }> };
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function freeScoreAction(_prev: FreeScoreState, fd: FormData): Promise<FreeScoreState> {
  const ip = await clientIp();
  const bucket = `freescore:${ip}`;
  if ((await fails(bucket, 10)) >= 12) return { error: "That is a lot of checks in a short time. Please wait a few minutes and try again." };
  await recordFail(bucket);

  const pasted = String(fd.get("resume_text") ?? "").trim();
  const file = fd.get("resume");
  const hasFile = file instanceof File && file.size > 0;
  let name: string | null = null;
  try {
    let res;
    if (hasFile) {
      if (file.size > MAX_BYTES) return { error: "File too large. Maximum size is 5 MB." };
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext)) return { error: "Upload a .pdf, .docx or .txt file, or paste the text." };
      name = file.name.replace(/[^\p{L}\p{N}_ .\-()]+/gu, "_").slice(0, 160);
      res = pasted !== "" ? scoreText(pasted) : scoreExtraction(await extractFile(new Uint8Array(await file.arrayBuffer()), name));
    } else if (pasted !== "") {
      res = scoreText(pasted.slice(0, 400000));
    } else return { error: "Upload your resume or paste its text." };

    if (!isScored(res)) { // refuse anything that is not a resume before any score exists
      await recordRejection(null, name ?? "", res.gate, hasFile ? "file" : "pasted", ip);
      return { error: gateMessage(res.gate) };
    }
    if (res.extraction.text_length < 80) return { error: "We could not read enough text from this file. It may be a scanned or image-only PDF. Paste the text instead, or upload a DOCX or text-based PDF." };
    await saveSubmission(res, { filename: name, ip, userAgent: (await headers()).get("user-agent") ?? "" });
    // So signing up straight after this check keeps the result: the Skill Passport imports it on first visit.
    await putSessionData({ pending_resume: { text: res.extraction.text.slice(0, 200000), t: Math.floor(Date.now() / 1000) } });
    const score = Math.round(Number(res.overall.score));
    const verdict = score >= 75 ? "A strong resume. A few tweaks could make it stand out even more."
      : score >= 60 ? "A solid base. Fixing the areas below can move you up a grade."
      : score >= 40 ? "There is real room to improve, and the fixes are quick."
      : "Your resume needs work before it will get past most screens. The good news is that the fixes are clear.";
    return { result: { score, grade: res.grade, verdict, advice: adviceFromResult(res, 3).map((a) => ({ title: a.title, text: a.text })), courses: courseIdeas(res) } };
  } catch (e) {
    if (e instanceof ExtractError) return { error: e.message };
    console.error("[resume-score]", (e as Error).message);
    return { error: "Something went wrong while scoring. Please try again." };
  }
}
