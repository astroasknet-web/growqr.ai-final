"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, ArrowRight, Check, Copy } from "lucide-react";
import type { Community } from "./community-data";

interface Props {
  community: Community;
  onClose: () => void;
}

export default function CommunityQRModal({ community, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll while open + close on Escape (mirrors EventRegisterModal).
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(community.joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-[420px] bg-white rounded-xl shadow-[0_32px_80px_-20px_rgba(0,0,0,0.22)] overflow-hidden"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-black/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-deep mb-0.5">
                {community.state}
              </p>
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink leading-snug">
                {community.communityName}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-ink-4 hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR */}
        <div className="px-6 py-6 flex flex-col items-center">
          <div className="relative w-[220px] h-[220px] rounded-2xl border border-black/[0.07] bg-cream/40 p-4 overflow-hidden">
            {/* Scan brackets around the QR */}
            {[
              "top-2 left-2 border-t-2 border-l-2",
              "top-2 right-2 border-t-2 border-r-2",
              "bottom-2 left-2 border-b-2 border-l-2",
              "bottom-2 right-2 border-b-2 border-r-2",
            ].map((cls) => (
              <span
                key={cls}
                aria-hidden
                className={`absolute w-4 h-4 border-orange ${cls}`}
              />
            ))}
            <Image
              src={community.qrCode}
              alt={`QR code for ${community.communityName}`}
              fill
              sizes="220px"
              className="object-contain p-5"
            />
          </div>
          <p className="mt-3 text-[12px] text-ink-4 text-center">
            Scan to join on WhatsApp
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <a
            href={community.joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_10px_28px_-10px_rgba(255,106,47,0.5)] hover:bg-orange-dark active:scale-[0.99] transition-all"
          >
            Join Community <ArrowRight className="w-4 h-4" />
          </a>
          <button
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-black/12 text-ink text-[14px] font-semibold transition hover:border-orange/40 hover:text-orange-deep active:scale-[0.99]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-orange" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Invite Link
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
