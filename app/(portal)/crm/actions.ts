"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { run } from "@/lib/portal/db";
import { putSessionData } from "@/lib/portal/session";
import * as AC from "@/lib/crm/access";
import * as DC from "@/lib/crm/docs";
import { gate } from "@/lib/crm/gate";
import * as LD from "@/lib/crm/leads";
import * as MN from "@/lib/crm/money";
import * as PT from "@/lib/crm/path";
import * as VF from "@/lib/crm/verify";

/** Server Actions for the Overseas CRM. Every one passes the staff gate first; lead actions also check who may see or edit that lead. */
const flash = (kind: "ok" | "err", text: string) => putSessionData({ crm_flash: [kind, text] });
const s = (fd: FormData, k: string): string => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string): number => parseInt(s(fd, k), 10) || 0;
const obj = (fd: FormData): Record<string, unknown> => Object.fromEntries(fd.entries());

export async function claimAction(fd: FormData): Promise<void> {
  const { me } = await gate();
  const lead = await LD.find(n(fd, "id"));
  if (lead && lead.counsellor_id === null) {
    await LD.assign(lead.id, me.id, me.id);
    await flash("ok", "Lead claimed. It is now yours.");
  } else await flash("err", "That lead already has an owner.");
  redirect(s(fd, "back") === "lead" && lead ? `/crm/leads/${lead.id}` : "/crm");
}

export async function taskDoneAction(fd: FormData): Promise<void> {
  const { me } = await gate();
  await LD.completeTask(n(fd, "id"), me);
  await flash("ok", "Task marked done.");
  redirect("/crm");
}

export interface NewLeadState { error?: string; duplicate?: { id: number; name: string }; values?: Record<string, string> }

export async function createLeadAction(_prev: NewLeadState, fd: FormData): Promise<NewLeadState> {
  const { me } = await gate(false, "/crm/leads");
  const values = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
  const [id, error, duplicate] = await LD.create(obj(fd), me.id);
  if (id === null) return { error: error ?? "Could not create the lead.", duplicate: duplicate ?? undefined, values };
  await flash("ok", "Lead added.");
  redirect(`/crm/leads/${id}`);
}

/** One endpoint for everything on the lead page, chosen by the hidden "act" field (as in the PHP page). */
export async function leadAction(fd: FormData): Promise<void> {
  const { me, manager } = await gate();
  const id = n(fd, "id");
  const lead = id ? await LD.find(id) : null;
  if (!lead || !(await LD.canView(me, lead))) redirect("/crm/leads");
  const self = `/crm/leads/${id}`;
  const edit = await LD.canEdit(me, lead);
  const act = s(fd, "act");
  let err: string | null = null;
  let msg = "Saved.";
  let anchor = "";

  if (act === "claim") {
    if (lead.counsellor_id === null) {
      await LD.assign(id, me.id, me.id);
      msg = "Lead claimed. It is now yours.";
    } else err = "That lead already has an owner.";
  } else if (!edit) {
    err = "This lead is assigned to someone else. Claim it or ask a manager.";
  } else {
    switch (act) {
      case "profile":
        await LD.update(id, obj(fd), me.id);
        break;
      case "move": {
        const to = s(fd, "stage");
        err = await LD.move(id, to, me.id, to === "lost" ? s(fd, "lost_reason") : s(fd, "note"));
        msg = "Stage updated.";
        break;
      }
      case "assign":
        if (manager) {
          await LD.assign(id, n(fd, "counsellor_id") || null, me.id);
          msg = "Owner updated.";
        } else err = "Only a manager can reassign leads.";
        break;
      case "log": {
        const kind = LD.KINDS[s(fd, "kind")] ? s(fd, "kind") : "note";
        if (s(fd, "body") === "") {
          err = "Write what happened.";
          break;
        }
        await LD.log(id, me.id, kind, s(fd, "body"));
        if (s(fd, "next") !== "") await LD.setFollowup(id, s(fd, "next"));
        msg = "Logged.";
        anchor = "#timeline";
        break;
      }
      case "followup":
        await LD.setFollowup(id, s(fd, "next") || null);
        msg = "Follow-up saved.";
        break;
      case "task_add":
        if (s(fd, "title") === "") {
          err = "Give the task a title.";
          break;
        }
        await LD.addTask(id, n(fd, "assignee") || me.id, s(fd, "title"), s(fd, "due"));
        msg = "Task added.";
        break;
      case "task_done":
        await LD.completeTask(n(fd, "task"), me);
        msg = "Task done.";
        break;
      case "app_add":
        err = await LD.addApplication(id, obj(fd), me.id);
        msg = "Application added.";
        anchor = "#apps";
        break;
      case "app_set":
        err = await LD.setApplication(n(fd, "app"), s(fd, "status"), s(fd, "offer_type"), me.id);
        msg = "Application updated.";
        anchor = "#apps";
        break;
      case "ms":
        err = await PT.save(id, s(fd, "kind"), obj(fd), me.id);
        msg = "Step saved.";
        anchor = "#path";
        break;
      case "doc_upload": {
        const file = fd.get("file");
        if (!(file instanceof File) || file.size === 0) err = "Choose a file to upload.";
        else {
          const r = await DC.upload(id, s(fd, "doc_type"), { name: file.name, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) }, me.id);
          err = typeof r === "string" ? r : null;
        }
        msg = "Document uploaded.";
        anchor = "#docs";
        break;
      }
      case "doc_delete": {
        const d = await DC.find(n(fd, "doc"));
        if (d && d.lead_id === id) await DC.remove(d.id);
        msg = "Document removed.";
        anchor = "#docs";
        break;
      }
      case "verify_request":
        [, err] = await VF.request(id, fd.getAll("docs").map((x) => parseInt(String(x), 10) || 0), "staff", me.id);
        msg = "Verification opened. The student must pay the fee before it goes to the partner.";
        anchor = "#verify";
        break;
      case "verify_cancel":
        err = await VF.cancel(n(fd, "v"), me.id);
        msg = "Verification cancelled.";
        anchor = "#verify";
        break;
      case "verify_case":
        await VF.setCase(n(fd, "v"), s(fd, "provider"), s(fd, "reference"));
        msg = "Case details saved.";
        anchor = "#verify";
        break;
      case "verify_result":
        err = await VF.recordResult(n(fd, "item"), s(fd, "result"), s(fd, "note"), me.id);
        msg = "Result recorded.";
        anchor = "#verify";
        break;
      case "pay_add":
        err = manager ? await MN.add(id, s(fd, "kind"), parseInt(s(fd, "amount").replace(/\D/g, ""), 10) || 0, s(fd, "status"), s(fd, "due_on") || null, s(fd, "method"), s(fd, "reference"), s(fd, "note"), me.id) : "Only a manager can record fees.";
        msg = "Fee recorded.";
        anchor = "#money";
        break;
      case "pay_receive":
        err = manager ? await MN.receive(n(fd, "pay"), s(fd, "method"), s(fd, "reference"), me.id) : "Only a manager can record payments.";
        msg = "Payment recorded.";
        anchor = "#money";
        break;
      case "new_link":
        await run("UPDATE crm_leads SET access_token = $1 WHERE id = $2", [randomBytes(16).toString("hex"), id]);
        await LD.log(id, me.id, "system", "Student file link regenerated (old link no longer works).");
        msg = "New link created. The old one has stopped working.";
        break;
      case "erase":
        if (manager && s(fd, "confirm") === "DELETE") {
          await LD.erase(id, me.id);
          await flash("ok", "Lead and all its documents were deleted.");
          redirect("/crm/leads");
        }
        err = "Type DELETE to confirm (managers only).";
        break;
      default:
        err = "Unknown action.";
    }
  }
  await flash(err ? "err" : "ok", err ?? msg);
  redirect(self + anchor);
}

/** Team access (administrators only). */
export async function grantAction(fd: FormData): Promise<void> {
  const { me } = await gate(true, "/crm/team");
  if (me.role !== "admin") redirect("/crm/denied");
  const err = await AC.grant(n(fd, "user"), s(fd, "level"), me.id);
  await flash(err ? "err" : "ok", err ?? "Access updated.");
  redirect("/crm/team");
}

export async function revokeAction(fd: FormData): Promise<void> {
  const { me } = await gate(true, "/crm/team");
  if (me.role !== "admin") redirect("/crm/denied");
  await AC.revoke(n(fd, "user"), me.id);
  await flash("ok", "Access removed. Their leads went back to the pool.");
  redirect("/crm/team");
}

export async function createStaffAction(fd: FormData): Promise<void> {
  const { me } = await gate(true, "/crm/team");
  if (me.role !== "admin") redirect("/crm/denied");
  const err = await AC.createStaff(s(fd, "name"), s(fd, "email"), String(fd.get("password") ?? ""), s(fd, "level"), me.id);
  await flash(err ? "err" : "ok", err ?? "Staff login created. Give them the password in person; they will be asked to set up two-step login.");
  redirect("/crm/team");
}

/** Parse CSV text (quoted fields, doubled quotes, CRLF) into rows. */
async function parseCsv(text: string): Promise<string[][]> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/** Managers import up to 500 leads from a CSV into the unassigned pool. */
export async function importLeadsAction(fd: FormData): Promise<void> {
  const { me, manager } = await gate(false, "/crm/leads");
  const f = fd.get("csv");
  if (!manager) await flash("err", "Only a manager can import leads.");
  else if (!(f instanceof File) || f.size === 0 || f.size > 1048576 || !f.name.toLowerCase().endsWith(".csv")) await flash("err", "Choose a .csv file under 1 MB.");
  else {
    const rows = await parseCsv((await f.text()).replace(/^﻿/, ""));
    const head = (rows.shift() ?? []).map((x) => x.trim().toLowerCase());
    const map: Record<string, string> = { name: "name", phone: "phone", mobile: "phone", email: "email", city: "city", country: "pref_country", "preferred country": "pref_country", course: "pref_course", "preferred course": "pref_course", qualification: "qualification", source: "source", intake: "intake" };
    const bySource = Object.fromEntries(Object.entries(LD.SOURCES).map(([k, v]) => [v.toLowerCase(), k]));
    let ok = 0;
    let skip = 0;
    for (const row of rows.slice(0, 500)) {
      const d: Record<string, string> = {};
      head.forEach((col, i) => { if (map[col]) d[map[col]] = (row[i] ?? "").trim(); });
      d.source = bySource[(d.source ?? "").toLowerCase()] ?? "other";
      const [id] = await LD.create(d, me.id, false);
      if (id) ok++;
      else skip++;
    }
    await flash("ok", `${ok} lead(s) imported into the unassigned pool; ${skip} skipped (duplicates or missing contact details).`);
  }
  redirect("/crm/leads");
}
