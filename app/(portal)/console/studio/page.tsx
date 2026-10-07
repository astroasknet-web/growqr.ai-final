import type { Metadata } from "next";
import { all, val } from "@/lib/portal/db";
import * as SA from "@/lib/studio/access";
import * as PAY from "@/lib/studio/pay";
import { btnDark, box, ConsolePage, field, Stats } from "@/components/admin/console-page";
import { adminGate } from "../gate";
import { studioPlanAction } from "../actions";

export const metadata: Metadata = { title: "Resume Studio plans | GrowQR", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const th = "py-2 pr-3 text-left font-medium text-ink-4";
const day = (ts: string, withTime = false) => new Date(ts.replace(" ", "T") + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : { year: "numeric" }), timeZone: "UTC" });

export default async function StudioPlans() {
  const me = await adminGate("/console/studio");
  const active = await all<{ id: number; ends_at: string; source: string; name: string; email: string }>("SELECT s.id, s.ends_at, s.source, u.name, u.email FROM studio_subscriptions s JOIN users u ON u.id = s.user_id WHERE s.starts_at <= LOCALTIMESTAMP(0) AND s.ends_at > LOCALTIMESTAMP(0) ORDER BY s.ends_at DESC LIMIT 100");
  const pays = await all<{ created_at: string; amount_paise: number; status: string; order_id: string; email: string }>("SELECT p.created_at, p.amount_paise, p.status, p.order_id, u.email FROM studio_payments p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT 30");
  const rev = Number(await val("SELECT COALESCE(SUM(amount_paise), 0) FROM studio_payments WHERE status = 'paid'"));
  const on = PAY.enabled();
  return (
    <ConsolePage me={me} tab="studio" title="Resume Studio plans" subtitle="Who has Pro, and recent payments. Use this to activate Pro after a manual or UPI payment.">
      <Stats items={[["Active Pro members", active.length], ["Price", `₹${SA.priceInr()}`, SA.isLifetime() ? "one-time, lifetime" : `${SA.periodDays()} days`], ["Online payments", on ? "On" : "Off", on ? "Razorpay connected" : "add RAZORPAY keys to .env"], ["Collected", `₹${Math.round(rev / 100).toLocaleString("en-IN")}`, "all time"]]} />
      <section className={box} aria-labelledby="g-h"><h2 id="g-h" className="text-[18px] font-semibold text-ink mb-3">Grant or end Pro</h2>
        <form action={studioPlanAction} className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="g-email" className="block text-[13px] text-ink-3 mb-1">Student email</label><input id="g-email" name="email" type="email" required className={field} /></div>
          <div><label htmlFor="g-days" className="block text-[13px] text-ink-3 mb-1">Days (blank = lifetime)</label><input id="g-days" name="days" type="number" min={1} max={366} placeholder="lifetime" className={`${field} w-32`} /></div>
          <div><label htmlFor="g-act" className="block text-[13px] text-ink-3 mb-1">Action</label><select id="g-act" name="act" className={field}><option value="grant">Grant Pro</option><option value="revoke">End Pro now</option></select></div>
          <button className={btnDark} type="submit">Apply</button>
        </form>
      </section>
      <section className={box} aria-labelledby="a-h"><h2 id="a-h" className="text-[18px] font-semibold text-ink mb-3">Active members ({active.length})</h2>
        {!active.length ? <p className="text-[14px] text-ink-3">No active Pro members yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-[14px] min-w-[32rem]"><thead><tr><th scope="col" className={th}>Student</th><th scope="col" className={th}>Email</th><th scope="col" className={th}>Until</th><th scope="col" className={th}>How</th></tr></thead>
            <tbody>{active.map((a) => <tr key={a.id} className="border-t border-black/[0.07]"><th scope="row" className="py-2 pr-3 text-left font-medium">{a.name}</th><td className="pr-3">{a.email}</td><td className="pr-3">{day(a.ends_at)}</td><td>{a.source}</td></tr>)}</tbody></table></div>)}
      </section>
      <section className={box} aria-labelledby="p-h"><h2 id="p-h" className="text-[18px] font-semibold text-ink mb-3">Recent payments</h2>
        {!pays.length ? <p className="text-[14px] text-ink-3">No payment attempts yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-[14px] min-w-[36rem]"><thead><tr><th scope="col" className={th}>When</th><th scope="col" className={th}>Student</th><th scope="col" className={th}>Amount</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Order</th></tr></thead>
            <tbody>{pays.map((p) => <tr key={p.order_id} className="border-t border-black/[0.07]"><td className="py-2 pr-3">{day(p.created_at, true)}</td><td className="pr-3">{p.email}</td><td className="pr-3">&#8377;{Math.round(p.amount_paise / 100).toLocaleString("en-IN")}</td><td className="pr-3">{p.status}</td><td><code>{p.order_id}</code></td></tr>)}</tbody></table></div>)}
        <p className="text-[13px] text-ink-4 mt-3">GST: if your business is GST-registered, the price may need to include GST and each payment needs a tax invoice. Ask your accountant; invoicing is not built yet.</p>
      </section>
    </ConsolePage>
  );
}
