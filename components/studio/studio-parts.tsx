import type { Template } from "@/lib/studio/templates";

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** Stylesheets for the Studio pages (React 19 hoists and de-duplicates these). */
/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet hoisting (precedence) is what we want here, not next/head */
export function StudioStyles() {
  return (
    <>
      <link rel="stylesheet" href="/studio/studio-base.css?v=1" precedence="default" />
      <link rel="stylesheet" href="/studio/studio-tpl.css?v=1" precedence="default" />
      <link rel="stylesheet" href="/studio/studio.css?v=1" precedence="default" />
    </>
  );
}
/* eslint-enable @next/next/no-css-tags */

export interface PlanInfo { priceInr: number; planLabel: string; cooldownHours: number; lifetime: boolean; payEnabled: boolean }

/** The "unlock Pro" dialog, opened by any [data-upgrade] button (see public/studio/studio.js). */
export function UpgradeDialog({ plan }: { plan: PlanInfo }) {
  return (
    <dialog id="upgrade-dlg" className="sh-dlg" aria-labelledby="up-h">
      <form method="dialog"><button className="sh-x" aria-label="Close">&times;</button></form>
      <h2 id="up-h">Resume Studio Pro</h2>
      <p className="sh-price">&#8377;{plan.priceInr} <small>{plan.planLabel}</small></p>
      <ul className="sh-perks">
        <li>All 45 templates, including every regional format</li>
        <li>Unlimited saved updates (free plan: one every {plan.cooldownHours} hours)</li>
        <li>Before / after comparison for every update</li>
        <li>{plan.lifetime ? "Pay once, keep it for good: no monthly fee, no renewal" : "No auto-renewal: you pay once for each period"}</li>
      </ul>
      {plan.payEnabled ? (
        <>
          <button className="btn btn-primary btn-lg btn-block" type="button" data-pay-start>Pay &#8377;{plan.priceInr} securely</button>
          <p className="muted sh-fine-print">Payment is handled by Razorpay (UPI, cards, netbanking). We never see your card details.</p>
          <p className="sh-msg" data-pay-msg role="status" hidden></p>
        </>
      ) : (
        <p className="notice notice-warn">Online payment is being switched on. Please check back shortly, or contact support to activate Pro for you.</p>
      )}
    </dialog>
  );
}

/** One template card: a scaled live thumbnail, its tags, and a use / unlock button. `useAction` is the server action for "use". */
export function TemplateCard({ t, open, thumbHtml, badge, useAction }: { t: Template; open: boolean; thumbHtml: string; badge?: string; useAction: (fd: FormData) => Promise<void> }) {
  return (
    <article className={`sh-card${open ? "" : " is-locked"}`}>
      <div className="sh-thumb" data-w={t.paper === "Letter" ? 816 : 794}>
        {open ? <div dangerouslySetInnerHTML={{ __html: thumbHtml }} /> : <div className="sh-ghost" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>}
        {!open ? <span className="sh-lock"><LockIcon /><b>Pro</b></span> : null}
      </div>
      <div className="sh-meta">
        {badge ? <span className="sh-badge">{badge}</span> : null}
        <h3>{t.format_name}</h3>
        <p>{t.style_name} &middot; {t.paper}</p>
        <ul className="sh-tags">
          <li className={t.ats === "safe" ? "ok" : "warn"}>{t.ats === "safe" ? "ATS-friendly" : "ATS caution"}</li>
          <li className={t.free ? "free" : "pro"}>{t.free ? "Free" : "Pro"}</li>
        </ul>
      </div>
      {open ? (
        <form action={useAction}>
          <input type="hidden" name="t" value={t.id} />
          <button className="btn btn-primary btn-block" type="submit">Use this template<span className="sr-only">: {t.name}</span></button>
        </form>
      ) : (
        <button className="btn btn-outline btn-block" type="button" data-upgrade><LockIcon /> Unlock with Pro<span className="sr-only">: {t.name}</span></button>
      )}
    </article>
  );
}
