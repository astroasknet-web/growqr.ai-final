"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { INTERNSHIP_VIDEO } from "./internship-data";

/**
 * Safety net only. The skeleton normally clears on the iframe's own `load`,
 * which is as fast as the viewer's connection and device allow; this exists so
 * a blocked or dead embed can't leave the skeleton running forever.
 */
const CANVA_LOAD_TIMEOUT_MS = 8000;

function CanvaEmbed() {
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setReady(true), CANVA_LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /**
   * Swap on the next painted frame after `load` rather than after a fixed
   * wait: a quick device clears the skeleton in milliseconds, a slow one holds
   * it exactly as long as it needs.
   */
  const reveal = () => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setReady(true));
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-0 -z-10 h-16 translate-y-5 rounded-[50%] bg-black/20 blur-2xl"
      />

      <div className="rounded-[22px] bg-gradient-to-b from-black/[0.08] to-black/[0.03] p-[1.5px] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.5)]">
        {/* Cream rather than black: the design sits on a light background, so
            any leftover letterbox band disappears into the frame. */}
        <div
          className="relative overflow-hidden rounded-[20px] bg-cream ring-1 ring-black/[0.06]"
          style={{ aspectRatio: INTERNSHIP_VIDEO.embedAspect }}
        >
          <iframe
            src={INTERNSHIP_VIDEO.embedUrl}
            title="GrowQR internship program intro"
            onLoad={reveal}
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            allow="fullscreen"
            allowFullScreen
          />

          {/* Same shimmer the image slots use site-wide, shaped to the frame. */}
          <div
            aria-hidden
            className={`img-skeleton pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              ready ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[12.5px] text-ink-4">
        Programme walkthrough · {INTERNSHIP_VIDEO.duration}
      </p>
    </div>
  );
}

export default function InternshipVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    // Let React swap the controls in before playback starts.
    requestAnimationFrame(() => videoRef.current?.play());
  };

  // Canva brings its own player, so the frame is all this component adds.
  if (INTERNSHIP_VIDEO.mode === "canva") return <CanvaEmbed />;

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px]">
      {/* Soft shadow pooled under the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-0 -z-10 h-16 translate-y-5 rounded-[50%] bg-black/20 blur-2xl"
      />

      <div className="rounded-[22px] bg-gradient-to-b from-black/[0.08] to-black/[0.03] p-[1.5px] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.5)]">
        <div
          className="relative overflow-hidden rounded-[20px] bg-black ring-1 ring-white/10"
          style={{ aspectRatio: `${INTERNSHIP_VIDEO.width} / ${INTERNSHIP_VIDEO.height}` }}
        >
          <video
            ref={videoRef}
            src={INTERNSHIP_VIDEO.src}
            poster={INTERNSHIP_VIDEO.poster}
            className="h-full w-full object-cover"
            controls={playing}
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onEnded={() => setPlaying(false)}
          />

          {!playing && (
            <button
              type="button"
              onClick={play}
              aria-label={`Play the internship intro video, ${INTERNSHIP_VIDEO.duration} long`}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25 transition-opacity duration-300 group-hover:opacity-90"
              />

              <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full">
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-white/40 motion-reduce:animate-none"
                />
                <span
                  className="relative flex h-full w-full items-center justify-center rounded-full border border-white/60 bg-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/30"
                  style={{ WebkitBackdropFilter: "blur(10px)" }}
                >
                  <Play className="ml-1 h-7 w-7" fill="#ffffff" strokeWidth={0} aria-hidden />
                </span>
              </span>

              <span className="relative text-[13px] font-semibold tracking-[-0.01em] text-white/95">
                Watch the intro · {INTERNSHIP_VIDEO.duration}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
