"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/portal/guard";
import { safeNext } from "@/lib/portal/security";
import * as courses from "@/lib/market/courses";
import * as learning from "@/lib/market/learning";

/** Enrol, leave, save progress or attach a certificate. Students only; the course is looked up here, never trusted from the form. */
export async function courseAction(fd: FormData): Promise<void> {
  const back = safeNext(String(fd.get("back") ?? ""), "/my-courses");
  const sep = back.includes("?") ? "&" : "?";
  const me = await currentUser();
  if (!me) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (me.role !== "student") redirect(back);
  const slug = String(fd.get("slug") ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const course = slug ? await courses.bySlug(slug) : null;
  if (!course) redirect(back);
  const act = String(fd.get("act") ?? "");
  let msg = "";
  let err = "";
  switch (act) {
    case "enrol":
      await learning.enrol(me.id, course.id);
      msg = "enrolled";
      break;
    case "unenrol":
      await learning.unenrol(me.id, course.id);
      msg = "left";
      break;
    case "save": {
      await learning.enrol(me.id, course.id); // saving progress implies enrolment
      const r = await learning.setDone(me.id, course, fd.getAll("done"));
      msg = r === null ? "locked" : r.status === "completed" ? "completed" : "saved";
      break;
    }
    case "certificate": {
      const e = await learning.attachCertificate(me.id, course, String(fd.get("cert_url") ?? ""), String(fd.get("cert_code") ?? ""));
      msg = e === null ? "cert_ok" : "cert_err";
      err = e ?? "";
      break;
    }
    default:
      redirect(back);
  }
  const anchor = act === "enrol" || act === "unenrol" ? "progress" : `c-${course.slug}`;
  redirect(`${back}${sep}c=${msg}${err ? "&e=" + encodeURIComponent(err) : ""}#${anchor}`);
}
