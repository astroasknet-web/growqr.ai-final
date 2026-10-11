"use client";

import { useEffect, useRef, useState } from "react";
import { FaFacebookF, FaLinkedinIn, FaPinterestP, FaRedditAlien, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { shareLinks, type ShareId } from "@/lib/blog/share";
import { trackShare } from "@/lib/analytics";

/**
 * Social sharing for one post. Ordinary links to each platform's documented share page (no SDKs, no external scripts), a native share
 * button where the browser has one, and copy-link with a spoken confirmation. Always shares the canonical URL passed in.
 */
const ICONS: Record<ShareId, React.ReactNode> = {
  whatsapp: <FaWhatsapp aria-hidden="true" />, facebook: <FaFacebookF aria-hidden="true" />, x: <FaXTwitter aria-hidden="true" />, linkedin: <FaLinkedinIn aria-hidden="true" />,
  telegram: <FaTelegram aria-hidden="true" />, pinterest: <FaPinterestP aria-hidden="true" />, reddit: <FaRedditAlien aria-hidden="true" />, email: <Mail aria-hidden="true" size={17} />,
};
const BRAND: Record<ShareId, string> = { whatsapp: "hover:bg-[#128C4A]", facebook: "hover:bg-[#1877F2]", x: "hover:bg-black", linkedin: "hover:bg-[#0A66C2]", telegram: "hover:bg-[#1B7FAE]", pinterest: "hover:bg-[#C8001F]", reddit: "hover:bg-[#C73A00]", email: "hover:bg-ink" };

interface Props { title: string; url: string; description?: string; image?: string | null; hashtag?: string; articleId: string; category?: string; placement: "top" | "end"; heading?: string }

export default function ShareBar({ title, url, description, image, hashtag, articleId, category, placement, heading }: Props) {
  const links = shareLinks({ title, url, description, image, hashtag });
  const [canNative, setCanNative] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const say = (m: string) => { setMsg(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(""), 3500); };
  const meta = { article: articleId, category, placement };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      say("Link copied to clipboard"); trackShare("copy", meta);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
      say(ok ? "Link copied to clipboard" : "Copy is blocked here. Copy the address from your browser bar instead.");
      if (ok) trackShare("copy", meta);
    }
  };
  const native = async () => {
    try { await navigator.share({ title, text: description, url }); trackShare("native", meta); } catch { /* the reader closed the share sheet */ }
  };

  const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";
  const btn = `inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.12] bg-white text-[17px] text-ink transition-colors hover:border-transparent hover:text-white motion-reduce:transition-none ${ring}`;
  const end = placement === "end";

  return (
    <section aria-label={heading ?? "Share this article"} className={end ? "rounded-2xl border border-black/[0.09] bg-cream-2 p-5 sm:p-6" : "mt-5"}>
      {end ? (
        <>
          <h2 className="text-[20px] font-bold text-ink">{heading ?? "Found this useful? Share it"}</h2>
          <p className="mt-1 text-[14.5px] text-ink-3">Send it to a friend, a classmate or your group chat.</p>
        </>
      ) : null}
      <div className={`flex min-h-[44px] flex-wrap items-center gap-2 ${end ? "mt-4" : ""}`}>
        {!end ? <span className="mr-1 text-[13px] font-semibold text-ink-3">Share</span> : null}
        {links.map((l) => (
          <a
            key={l.id}
            href={l.href}
            target={l.id === "email" ? undefined : "_blank"}
            rel={l.id === "email" ? undefined : "noopener noreferrer"}
            aria-label={l.id === "email" ? "Share by email" : `Share on ${l.label} (opens in a new tab)`}
            title={l.id === "email" ? "Share by email" : `Share on ${l.label}`}
            onClick={() => trackShare(l.id, meta)}
            className={`${btn} ${BRAND[l.id]}`}
          >
            {ICONS[l.id]}
          </a>
        ))}
        {canNative ? (
          <button type="button" onClick={native} aria-label="Share using your device" title="Share using your device" className={`${btn} hover:bg-ink`}>
            <Share2 aria-hidden="true" size={17} />
          </button>
        ) : null}
        <button type="button" onClick={copy} className={`inline-flex h-11 items-center gap-2 rounded-full border border-black/[0.12] bg-white px-4 text-[14px] font-semibold text-ink hover:bg-ink hover:text-white ${ring}`}>
          {msg.startsWith("Link copied") ? <Check aria-hidden="true" size={16} /> : <Link2 aria-hidden="true" size={16} />}
          Copy link
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-[20px] text-[13px] font-medium text-emerald-800">{msg}</p>
    </section>
  );
}
