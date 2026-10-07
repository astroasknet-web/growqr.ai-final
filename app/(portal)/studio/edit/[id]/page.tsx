import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/portal/guard";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import * as access from "@/lib/studio/access";
import * as pay from "@/lib/studio/pay";
import * as store from "@/lib/studio/store";
import * as templates from "@/lib/studio/templates";
import { PortalPage } from "@/components/portal/shell";
import { StudioScripts } from "@/components/studio/studio-ui";
import { StudioStyles, UpgradeDialog } from "@/components/studio/studio-parts";

export const metadata: Metadata = { title: "Edit your resume | GrowQR" };
export const dynamic = "force-dynamic";

/** JSON for a <script type="application/json"> element: nothing in it can close the tag or start a comment. */
const safeJson = (v: unknown): string =>
  JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser("student");
  if (!databaseConfigured()) notFound();
  const { id: rawId } = await params;
  const id = /^\d{1,9}$/.test(rawId) ? Number(rawId) : 0;
  const resume = id ? await store.find(me.id, id) : null;
  if (!resume) redirect("/studio");
  const uid = me.id;
  const csrf = (await getSession())?.csrf ?? "";
  const pro = await access.isPro(uid);
  const tplId = (await access.canUseTemplate(uid, resume.template, pro)) ? resume.template : "chrono-classic"; // Pro lapsed: fall back to a free template
  const versions = await store.versions(uid, resume.id);
  const oldest = versions.length ? versions[versions.length - 1] : null;

  const tpls = Object.values(templates.all()).map((t) => ({
    id: t.id, name: t.name, format: t.format, format_name: t.format_name, style: t.style_name, paper: t.paper, structure: t.structure,
    personal: t.personal, ats: t.ats, free: t.free, locked: !(t.free || pro),
  }));
  const boot = {
    csrf, id: resume.id, template: tplId, data: resume.data, templates: tpls, pro,
    wait: await access.secondsUntilNextSave(uid, pro), cooldownHours: access.cooldownHours(), price: access.priceInr(), payEnabled: pay.enabled(),
    docx: true,
    versions: versions.map((v) => ({ id: v.id, kind: v.kind, score: v.score !== null ? Number(v.score) : null, grade: v.grade, when: v.created_at, template: v.template })),
    baseline: oldest ? oldest.id : null,
  };
  const plan = { priceInr: access.priceInr(), planLabel: access.planLabel(), cooldownHours: access.cooldownHours(), lifetime: access.isLifetime(), payEnabled: pay.enabled() };

  return (
    <PortalPage user={me} active="studio" title="Edit your resume" subtitle="Your score updates as you type. Nothing is lost: your draft saves itself." wide="full">
      <StudioStyles />
      <script type="application/json" id="se-boot" dangerouslySetInnerHTML={{ __html: safeJson(boot) }} />
      <div className="studio-root se sh" id="studio" data-csrf={csrf} data-pay={pay.enabled() ? "1" : "0"}>
        <p className="se-back"><Link className="btn btn-outline btn-sm" href="/studio">All templates</Link></p>
        <div className="se-bar">
          <div className="se-tplpick">
            <label htmlFor="se-tpl">Template</label>
            <select id="se-tpl"></select>
          </div>
          <p className="se-status" id="se-status" role="status">Loading...</p>
          <div className="se-actions">
            <button className="btn btn-primary" type="button" id="se-save">Save update</button>
            <details className="se-dl" id="se-dl">
              <summary className="btn btn-outline">Download</summary>
              <div className="se-dl-menu" id="se-dl-menu"><p className="muted">Save an update first.</p></div>
            </details>
          </div>
        </div>
        <p className="se-hint" id="se-savehint"></p>

        <div className="se-tabs" role="tablist" aria-label="Editor sections">
          <button role="tab" id="t-edit" aria-controls="pane-edit" aria-selected="true" data-tab="edit" className="se-tab-edit">Edit</button>
          <button role="tab" id="t-preview" aria-controls="pane-preview" aria-selected="false" data-tab="preview">Preview</button>
          <button role="tab" id="t-score" aria-controls="pane-score" aria-selected="false" data-tab="score">Score <span className="se-pill" id="se-pill">--</span></button>
          <button role="tab" id="t-job" aria-controls="pane-job" aria-selected="false" data-tab="job">Tailor to a job</button>
          <button role="tab" id="t-compare" aria-controls="pane-compare" aria-selected="false" data-tab="compare">Before / after</button>
        </div>

        <div className="se-grid">
          <section className="se-pane se-edit" id="pane-edit" role="tabpanel" aria-labelledby="t-edit"><div id="se-form"></div></section>
          <div className="se-right">
            <section className="se-pane" id="pane-preview" role="tabpanel" aria-labelledby="t-preview" hidden>
              <div className="se-ats" id="se-ats"></div>
              <div className="se-paperwrap" id="se-paperwrap"><div className="se-paper" id="se-paper" aria-live="polite"></div></div>
              <p className="muted se-fine" id="se-pages"></p>
            </section>
            <section className="se-pane" id="pane-score" role="tabpanel" aria-labelledby="t-score" hidden>
              <div className="se-scorecard">
                <div className="ring ring-lg ring-onlight" id="se-ring" style={{ "--v": 0 } as React.CSSProperties} role="img" aria-label="RQ Score"><b id="se-ringnum">--</b></div>
                <div><b className="big" id="se-grade">&nbsp;</b><p className="muted" id="se-delta">RQ Score, out of 100</p><p className="muted" id="se-msg"></p></div>
              </div>
              <h3>By section</h3><ul className="se-bars" id="se-sections"></ul>
              <h3>What to work on first</h3><ol className="se-tips" id="se-tips"></ol>
              <p className="muted se-fine">The score uses the same engine as your Skill Passport, on the exact text you will download. It is rule-based: the same resume always gets the same score.</p>
            </section>
            <section className="se-pane" id="pane-job" role="tabpanel" aria-labelledby="t-job" hidden>
              <label htmlFor="se-jd"><b>Paste a job description</b></label>
              <textarea id="se-jd" rows={7} maxLength={8000} placeholder="Paste the full job post here, including the requirements."></textarea>
              <p className="muted se-fine">We compare it with your resume and show what the job asks for that you have not mentioned. We never add anything for you: only add skills you genuinely have.</p>
              <div id="se-jdout"></div>
            </section>
            <section className="se-pane" id="pane-compare" role="tabpanel" aria-labelledby="t-compare" hidden>
              <div className="se-cmpbar"><div className="fld"><label htmlFor="se-ca">Before</label><select id="se-ca"></select></div><div className="fld"><label htmlFor="se-cb">After</label><select id="se-cb"></select></div></div>
              <div id="se-cmpout"><p className="muted">Save an update to compare it with where you started.</p></div>
              <p><button className="btn btn-outline" type="button" id="se-apply" hidden>Use the &ldquo;After&rdquo; version as my Skill Passport resume</button></p>
            </section>
          </div>
        </div>

        <UpgradeDialog plan={plan} />
      </div>
      <StudioScripts srcs={[...(!pro && pay.enabled() ? ["https://checkout.razorpay.com/v1/checkout.js"] : []), "/studio/studio.js?v=1", "/studio/studio-edit.js?v=1"]} />
    </PortalPage>
  );
}
