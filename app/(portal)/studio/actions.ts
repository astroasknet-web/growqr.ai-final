"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/portal/guard";
import * as access from "@/lib/studio/access";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";

/** Server Actions for the Resume Studio hub. Each one re-checks that the caller is a signed-in student. */
export async function savePrefsAction(fd: FormData): Promise<void> {
  const me = await requireUser("student");
  await store.savePrefs(me.id, { region: fd.get("region"), level: fd.get("level"), industry: fd.get("industry"), goal: fd.get("goal") });
  redirect("/studio?saved=1#recommended");
}

/** Start (or continue) the student's resume in the chosen template. A Pro template without Pro is refused here, not only in the browser. */
export async function useTemplateAction(fd: FormData): Promise<void> {
  const me = await requireUser("student");
  const tpl = templates.get(String(fd.get("t") ?? ""));
  if (tpl && (await access.canUseTemplate(me.id, tpl.id))) {
    const id = await store.ensureStarter(me.id, me, tpl.id);
    const r = await store.find(me.id, id);
    if (r) await store.saveDraft(me.id, id, tpl.id, r.data);
    redirect(`/studio/edit/${id}`);
  }
  redirect("/studio?locked=1");
}
