"use client";

import { useEffect, useId, useState } from "react";

const inputCls = "w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-ink outline-none transition placeholder:text-ink-4 min-h-[48px] focus:border-[#7857ff] focus:ring-4 focus:ring-[#7857ff]/15 sm:text-[15px]";
const key = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * College picker for signup: suggestions come from the approved directory as the student types (a native datalist, so it works with a
 * keyboard and screen readers). If what they typed is not in the directory they may choose a state, and the server files it for review.
 */
export function CollegeField({ defaultValue, error, states }: { defaultValue?: string; error?: string; states: string[] }) {
  const id = useId();
  const [text, setText] = useState(defaultValue ?? "");
  const [opts, setOpts] = useState<Array<{ name: string; place: string }>>([]);
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setOpts([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/colleges/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => (r.ok ? r.json() : [])).then((j) => setOpts(Array.isArray(j) ? j : [])).catch(() => undefined);
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [text]);
  const listed = opts.some((o) => key(o.name) === key(text));
  const unlisted = text.trim().length >= 4 && !listed && opts.length === 0;
  return (
    <div className="mb-4">
      <label htmlFor={`${id}-c`} className="mb-1.5 block text-[13.5px] font-semibold text-ink-2">College or university</label>
      <input id={`${id}-c`} name="college" list={`${id}-l`} value={text} onChange={(e) => setText(e.target.value)} required maxLength={160} autoComplete="off" spellCheck={false}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : `${id}-h`} className={`${inputCls} ${error ? "border-red-400" : "border-black/[0.12]"}`} />
      <datalist id={`${id}-l`}>{opts.map((o) => <option key={`${o.name}${o.place}`} value={o.name} label={o.place} />)}</datalist>
      {error ? <p id={`${id}-e`} className="text-[13px] text-red-700 mt-1.5">{error}</p> : <p id={`${id}-h`} className="text-[12px] text-ink-4 mt-1.5">Start typing to search 13,000+ Indian colleges. Not listed? Type the name in full.</p>}
      {unlisted ? (
        <div className="mt-3 rounded-lg border border-black/[0.1] bg-cream-2 p-3">
          <label htmlFor={`${id}-s`} className="block text-[13px] text-ink-3 mb-1.5">Not in our list? Choose its state and we will add it for review (optional).</label>
          <select id={`${id}-s`} name="college_state" defaultValue="" className="w-full px-3 py-2.5 rounded-lg border border-black/[0.12] bg-white text-[15px] min-h-[44px]">
            <option value="">Do not add it</option>{states.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      ) : null}
    </div>
  );
}
