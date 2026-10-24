"use client";

import { useEffect, useState } from "react";
import { COUNTRIES, PASSPORT } from "./data";
import { QrArt } from "./shared";
import { AgentAvatar, ScoreDial } from "./ui";

const shell = "flex h-full flex-col gap-2.5 bg-cream px-3.5 pb-4 pt-9 text-ink";
const head = (t: string, sub?: string) => (
  <div>
    <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-orange-dark">{t}</p>
    {sub && <p className="font-serif text-[1.2rem] leading-tight">{sub}</p>}
  </div>
);

export function Scene1() {
  return (
    <div className={`${shell} ho-in`}>
      {head("QR Score · free", "Your resume, scored")}
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white p-2 text-[0.62rem] font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-[0.55rem] font-bold text-red-600">PDF</span>Sachin_Sharma_CV.pdf<span className="ml-auto text-emerald-600">✓ read</span>
      </div>
      <div className="flex justify-center py-1"><ScoreDial value={85} size={128} grade="Strong" /></div>
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-4">3 areas to lift</p>
      {["Education & Qualifications · 57%", "Impact & Presentation · 66%", "Projects & Portfolio · 73%"].map((t) => (
        <div key={t} className="flex items-center gap-2 rounded-xl border border-orange/20 bg-orange-lighter px-2.5 py-2 text-[0.64rem] font-semibold text-orange-deep"><span className="h-1.5 w-1.5 rounded-full bg-orange" />{t}</div>
      ))}
    </div>
  );
}

const CHAT = [
  ["mira", "Impact & Presentation is at 66%. Want me to add numbers to your bullets?"],
  ["me", "Yes, please."],
  ["mira", "Done. I used the figures already in your profile: 66,000+ questions, 40+ students."],
  ["sage", "Education is your lowest section. Your two Coursera certificates help; here's a plan to lift it."],
] as const;

export function Scene2() {
  const [n, setN] = useState(1);
  useEffect(() => {
    setN(1);
    const t = CHAT.map((_, i) => setTimeout(() => setN(i + 1), 500 + i * 1100));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className={`${shell} ho-in`}>
      {head("Agents", "Coached, not just scored")}
      <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden">
        {CHAT.slice(0, n).map(([who, text], i) =>
          who === "me" ? (
            <div key={i} className="ho-in ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-ink px-3 py-2 text-[0.66rem] text-white">{text}</div>
          ) : (
            <div key={i} className="ho-in flex items-end gap-2">
              <AgentAvatar k={who} size={26} ring={false} />
              <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[0.66rem] shadow-sm">{text}</div>
            </div>
          ),
        )}
      </div>
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[0.6rem] text-ink-4">Ask your agents anything…<span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-orange text-white">↑</span></div>
    </div>
  );
}

export function Scene3() {
  return (
    <div className={`${shell} ho-in`}>
      {head("Skill Passport", "Proof, not claims")}
      <div className="rounded-2xl bg-gradient-to-br from-ink to-[#3b1d0e] p-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-[64px] shrink-0 rounded-lg bg-white p-1"><QrArt seed={44} fg="#1A1A1A" /></div>
          <div><p className="font-serif text-[1.05rem] leading-none">Sachin Sharma</p><p className="mt-1 text-[0.55rem] text-white/60">EdTech Founder · Developer</p><p className="mt-1.5 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.55rem] font-bold text-emerald-300">● Verified</p></div>
        </div>
      </div>
      <div className="grid gap-1.5 rounded-2xl bg-white p-3">
        {PASSPORT.map((p) => (
          <div key={p.key} className="grid grid-cols-[58px,1fr,20px] items-center gap-1.5 text-[0.58rem] font-semibold text-ink-3">{p.key}<i className="h-1 overflow-hidden rounded-full bg-black/[0.07]"><i className="ho-bar block h-full rounded-full bg-gradient-to-r from-orange to-[#FFB020]" style={{ width: `${p.v}%` }} /></i><span className="text-right">{p.v}</span></div>
        ))}
      </div>
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[0.6rem] font-semibold text-emerald-800">5 sections scored by the QR Score engine</p>
    </div>
  );
}

const STEPS = ["Applied", "Shortlisted", "Interview", "Offer"];
export function Scene4() {
  const [k, setK] = useState(0);
  useEffect(() => {
    setK(0);
    const t = STEPS.map((_, i) => setTimeout(() => setK(i + 1), 600 + i * 900));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className={`${shell} ho-in`}>
      {head("Internships", "Example match, protected")}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7F77DD] font-bold text-white">S</span>
          <p className="text-[0.7rem] font-bold leading-tight">Backend Developer Intern<span className="block text-[0.58rem] font-normal text-ink-4">CodeForge Systems · Hyderabad · 16 weeks</span></p>
          <span className="ml-auto rounded-full bg-emerald-600 px-1.5 py-0.5 text-[0.55rem] font-bold text-white">Match</span>
        </div>
        <p className="mt-2 font-serif text-[1.5rem] leading-none">₹22,000<span className="font-sans text-[0.58rem] text-ink-4">/mo</span></p>
              </div>
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-4">Application tracker</p>
      <div className="grid gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[0.62rem] font-semibold transition-all duration-500 ${i < k ? "bg-emerald-50 text-emerald-800" : "bg-white text-ink-4"}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[0.5rem] ${i < k ? "bg-emerald-500 text-white" : "bg-black/10"}`}>{i < k ? "✓" : i + 1}</span>{s}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Scene5() {
  return (
    <div className={`${shell} ho-in`}>
      <div className="rounded-2xl bg-gradient-to-br from-orange to-[#FF9A5C] p-3.5 text-white">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white/80">🎉 Example: offer stage</p>
        <p className="font-serif text-[1.35rem] leading-tight">Welcome aboard</p>
        <p className="text-[0.6rem] text-white/85">Start date set</p>
      </div>
      {head("Next, if you want it", "Study abroad, mapped")}
      <div className="grid grid-cols-2 gap-1.5">
        {COUNTRIES.slice(0, 6).map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-white px-2.5 py-2 text-[0.62rem] font-semibold">{c.name}<span className="text-orange-dark">{c.count}</span></div>
        ))}
      </div>
      <p className="rounded-xl bg-white px-3 py-2 text-[0.6rem] text-ink-3"><strong className="text-ink">58 universities</strong> across 7 countries, matched to your passport.</p>
    </div>
  );
}

export const SCENES = [
  { k: "Score", t: "Drop in a resume. Get a score in seconds.", d: "PDF, Word or pasted text. A number out of 100, a grade, and three plain-language focus areas. No sign-up, no fee.", C: Scene1 },
  { k: "Coach", t: "Specialised agents fix what the score found.", d: "RQ-Mira rewrites the resume, RQ-Sage closes the skill gap, RQ-Lyra picks the course. Human experts stay in the loop.", C: Scene2 },
  { k: "Verify", t: "A passport that proves it.", d: "A proctored assessment and checked evidence turn claims into percentiles. One QR, and any employer can verify it.", C: Scene3 },
  { k: "Match", t: "Verified employers. Clear stages.", d: "Apply with no fees, watch every stage of the application.", C: Scene4 },
  { k: "Grow", t: "Keep climbing, wherever you're headed.", d: "Take the offer, add courses and micro-gigs, or map a route to one of 58 universities across seven countries.", C: Scene5 },
] as const;
