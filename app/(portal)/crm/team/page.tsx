import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { all } from "@/lib/portal/db";
import { gate } from "@/lib/crm/gate";
import * as AC from "@/lib/crm/access";
import { CrmPage, fieldCls, when } from "@/components/crm/crm-page";
import { createStaffAction, grantAction, revokeAction } from "../actions";

export const metadata: Metadata = { title: "Team access | Overseas CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const box = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 mb-5";
const lab = "block text-[13px] font-medium text-ink-2 mb-1";
const btn = "min-h-[44px] px-4 rounded-lg bg-ink text-white text-[14px] font-semibold";

export default async function Team() {
  const { me, manager } = await gate(true, "/crm/team");
  if (me.role !== "admin") redirect("/crm/denied");
  const members = await AC.members();
  const granted = new Set(members.map((m) => Number(m.id)));
  const candidates = (await all<{ id: number; name: string; email: string; role: string }>("SELECT id, name, email, role FROM users WHERE role IN ('admin','counselor') ORDER BY name")).filter((u) => !granted.has(u.id));

  return (
    <CrmPage me={me} manager={manager} tab="team" title="Team access" subtitle="Only people listed here can open the CRM. Staff must use two-step login.">
      <section className={box} aria-labelledby="mb-h"><h2 id="mb-h" className="text-[18px] font-semibold text-ink mb-3">Who has access</h2>
        <div className="overflow-x-auto"><table className="w-full text-[14px] min-w-[40rem]">
          <thead><tr className="text-left text-ink-4"><th scope="col" className="py-2 pr-3">Name</th><th scope="col" className="pr-3">Level</th><th scope="col" className="pr-3">Two-step login</th><th scope="col" className="pr-3">Last login</th><th scope="col">Change</th></tr></thead>
          <tbody>{members.map((m) => {
            const isAdmin = m.role === "admin";
            return (
              <tr key={String(m.id)} className="border-t border-black/[0.07] align-top">
                <th scope="row" className="py-2.5 pr-3 text-left font-medium">{String(m.name)}<br /><small className="text-ink-4 font-normal">{String(m.email)}</small></th>
                <td className="pr-3">{isAdmin ? "Administrator" : AC.LEVELS[String(m.level)] ?? String(m.level)}</td>
                <td className="pr-3">{m.mfa_enabled_at ? "On" : "Not set up"}</td>
                <td className="pr-3">{m.last_login_at ? when(String(m.last_login_at)) : "Never"}</td>
                <td>{isAdmin ? <small className="text-ink-4">Always full access</small> : (
                  <div className="flex flex-wrap gap-2">
                    <form action={grantAction} className="flex gap-2"><input type="hidden" name="user" value={String(m.id)} />
                      <select name="level" defaultValue={String(m.level)} aria-label={`Level for ${m.name}`} className={`${fieldCls} !w-auto`}>{Object.entries(AC.LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                      <button className="min-h-[44px] px-3 rounded-lg border border-black/[0.15] text-[14px]" type="submit">Save</button></form>
                    <form action={revokeAction}><input type="hidden" name="user" value={String(m.id)} /><button className="min-h-[44px] px-3 rounded-lg border border-red-300 text-red-700 text-[14px]" type="submit">Remove</button></form>
                  </div>)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </section>

      <div className="grid xl:grid-cols-2 gap-x-6">
        <section className={box} aria-labelledby="gr-h"><h2 id="gr-h" className="text-[18px] font-semibold text-ink mb-3">Give an existing staff login access</h2>
          {!candidates.length ? <p className="text-[14px] text-ink-3">Every staff login already has access.</p> : (
            <form action={grantAction} className="grid gap-3">
              <div><label className={lab} htmlFor="g-user">Person</label><select id="g-user" name="user" className={fieldCls}>{candidates.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select></div>
              <div><label className={lab} htmlFor="g-level">Level</label><select id="g-level" name="level" className={fieldCls}>{Object.entries(AC.LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><button className={btn} type="submit">Give access</button></div>
            </form>)}
        </section>
        <section className={box} aria-labelledby="ns-h"><h2 id="ns-h" className="text-[18px] font-semibold text-ink mb-3">Create a new staff login</h2>
          <form action={createStaffAction} className="grid gap-3">
            <div><label className={lab} htmlFor="s-name">Name</label><input id="s-name" name="name" required maxLength={120} className={fieldCls} /></div>
            <div><label className={lab} htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" required maxLength={190} className={fieldCls} /></div>
            <div><label className={lab} htmlFor="s-pw">Starting password (12+ characters)</label><input id="s-pw" name="password" type="password" required minLength={12} autoComplete="new-password" className={fieldCls} /></div>
            <div><label className={lab} htmlFor="s-level">Level</label><select id="s-level" name="level" className={fieldCls}>{Object.entries(AC.LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><button className={btn} type="submit">Create login</button></div>
          </form>
        </section>
      </div>
    </CrmPage>
  );
}
