"use server";

import { redirect } from "next/navigation";
import { isVerified } from "@/lib/portal/auth";
import { requireUser } from "@/lib/portal/guard";
import * as apps from "@/lib/market/applications";
import * as jobs from "@/lib/market/jobs";
import * as notify from "@/lib/market/notify";
import * as role from "@/lib/market/post-role";

/** Server Actions for employers. Each one re-checks the caller's role and that the posting belongs to them. */
export async function moveApplicantAction(fd: FormData): Promise<void> {
  const me = await requireUser("employer");
  const appId = parseInt(String(fd.get("app_id") ?? ""), 10) || 0;
  const stage = String(fd.get("status") ?? "");
  const note = Array.from(String(fd.get("note") ?? "").trim()).slice(0, 255).join("");
  const row = appId ? await apps.withOwner(appId) : null;
  if (!row || Number(row.owner_user_id) !== me.id) redirect("/employer?error=" + encodeURIComponent("You can only update applicants on your own roles."));
  const back = `/employer?r=${Number(row.internship_id)}`;
  if (stage === "Rejected" && note === "") redirect(back + "&error=" + encodeURIComponent("Add a short reason when rejecting. Students see it, and it keeps hiring honest."));
  if (!(await apps.move(appId, stage, note, me.id))) redirect(back + "&error=" + encodeURIComponent("That change is not allowed."));
  redirect(back + "&moved=1");
}

export interface PostState { done?: boolean; title?: string; escrow?: boolean; error?: string; errors?: role.RoleErrors; values?: role.RoleFields }

export async function postRoleAction(_prev: PostState, fd: FormData): Promise<PostState> {
  const me = await requireUser("employer");
  const values = role.readFields((k) => String(fd.get(k) ?? ""));
  const company = await jobs.companyOf(me.id);
  if (!company) return { error: "No company is linked to this account.", values };
  if (!isVerified(me)) return { error: "Please confirm your email address before posting a role.", values };
  const errors = role.validate(values);
  if (Object.keys(errors).length) return { errors, values };
  const { id } = await jobs.create(company.id, role.toNewJob(values, company.name));
  await notify.roleSubmitted(id);
  return { done: true, title: values.title, escrow: values.escrow !== "" };
}
