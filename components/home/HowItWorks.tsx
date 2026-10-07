"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Volume2, VolumeX, Maximize, Play } from "lucide-react";
import { Eyebrow, SectionHeading } from "./SectionHeader";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The walkthrough film (16:9 / 1920×1080). Drop the exported Canva mp4 here. */
const VIDEO_SRC = "/growqr-demo.mp4";

/** How long the branded intro plane holds before it dissolves into the film. */
const INTRO_MS = 2400;

/** Tagline shown on the intro plane — animated word-by-word. */
const INTRO_WORDS = ["Your", "AI", "Career", "Team"];

type HowItWorksProps = {
  /** The film to play. Defaults to the individuals walkthrough. */
  videoSrc?: string;
  eyebrow?: string;
  heading?: ReactNode;
  /** Image displayed on the branded intro plane. */
  introLogoSrc?: string;
  /** Intro-plane tagline, animated word by word. Last word renders in orange. */
  introWords?: string[];
  /** Hold time before the intro dissolves into the video. */
  introDurationMs?: number;
  /** Show a calm logo-only intro without decorative effects or copy. */
  logoOnlyIntro?: boolean;
  /** Small persistent brand badge displayed over the recorded video. */
  cornerLogoSrc?: string;
  /** Landmark label, so multiple copies stay distinguishable to screen readers. */
  ariaLabel?: string;
};

const colVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/*  How It Works — a framed 1920×1080 walkthrough film. Autoplays muted */
/*  and loops (no chrome); on hover the frame reveals just the two      */
/*  actions that matter — unmute and fullscreen. Mirrors the            */
/*  VideoShowcase bezel + grid backdrop so it reads as part of the      */
/*  system.                                                             */
/* ------------------------------------------------------------------ */

export default function HowItWorks({
  videoSrc = VIDEO_SRC,
  eyebrow = "How It Works",
  heading = (
    <>
      See GrowQR in <span className="text-orange">Action</span>
    </>
  ),
  introLogoSrc = "/growqr-logo.png",
  introWords = INTRO_WORDS,
  introDurationMs = INTRO_MS,
  logoOnlyIntro = false,
  cornerLogoSrc,
  ariaLabel = "How GrowQR works",
}: HowItWorksProps = {}) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  // The branded intro plane plays once, the first time the frame approaches
  // the viewport, then dissolves to reveal the already-playing film.
  const [introDone, setIntroDone] = useState(false);
  const introTimerRef = useRef<number | null>(null);

  // A low threshold starts buffering early enough to survive a fast scroll,
  // while still avoiding a 16 MB video request during the initial page load.
  const inView = useInView(frameRef, { amount: 0.15 });

  useEffect(() => {
    if (!inView || introDone || introTimerRef.current !== null) return;
    if (reduce) {
      setIntroDone(true);
      return;
    }
    introTimerRef.current = window.setTimeout(() => {
      introTimerRef.current = null;
      setIntroDone(true);
    }, introDurationMs);
  }, [inView, introDone, introDurationMs, reduce]);

  useEffect(
    () => () => {
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Playback begins behind the intro so a moving frame is ready at reveal.
    if (inView) void v.play().catch(() => {});
    else v.pause();
  }, [inView, introDone]);

  // Click the film to toggle playback. State stays in sync via the video's own
  // play/pause events, so the center play badge is always accurate.
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    // a user gesture — safe to (re)start playback if autoplay was blocked
    void v.play().catch(() => {});
    setMuted(v.muted);
  };

  const enterFullscreen = () => {
    frameRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className="relative w-full overflow-hidden border-b border-black/5 bg-white px-6 py-20 md:px-14 md:py-28"
    >
      {/* site-standard faint grid backdrop */}
      <div
        aria-hidden
        className="grid-lines pointer-events-none absolute inset-0 z-0 opacity-[0.12]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1040px]">
        {/* Centered header */}
        <motion.div
          variants={reduce ? undefined : colVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto flex max-w-[760px] flex-col items-center text-center"
        >
          <motion.div variants={reduce ? undefined : itemVariants}>
            <Eyebrow center>{eyebrow}</Eyebrow>
          </motion.div>

          <motion.div variants={reduce ? undefined : itemVariants}>
            <SectionHeading className="sm:whitespace-nowrap">{heading}</SectionHeading>
          </motion.div>
        </motion.div>

        {/* Framed player */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, scale: 0.98 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="relative mx-auto mt-12 w-full max-w-[960px] md:mt-16"
        >
          {/* soft ambient shadow pooled under the frame */}
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-0 -z-10 h-16 translate-y-6 rounded-[50%] bg-black/25 blur-2xl"
          />

          {/* gradient ring wrapper → premium bezel */}
          <div className="rounded-[3px] bg-gradient-to-b from-black/[0.08] to-black/[0.03] p-[1.5px] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.5)]">
            <div
              ref={frameRef}
              className="group relative overflow-hidden rounded-[2px] bg-black ring-1 ring-white/10"
              style={{ aspectRatio: "16 / 9" }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                onClick={togglePlay}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                className="h-full w-full cursor-pointer object-cover"
                muted
                loop
                playsInline
                preload="metadata"
              />

              {/* Branded intro plane — a short cinematic title card: drifting
                  brand glows + a sheen sweep behind a blur-in logo and a
                  word-by-word tagline, then the whole plane zooms + dissolves
                  into the film. */}
              <AnimatePresence>
                {!introDone && (
                  <motion.div
                    key="intro"
                    aria-hidden
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.06 }}
                    transition={{ duration: logoOnlyIntro ? 0.35 : 0.7, ease: EASE }}
                    className={`absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden ${
                      logoOnlyIntro
                        ? "bg-white"
                        : "bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb]"
                    }`}
                  >
                    {logoOnlyIntro ? null : (
                      <>
                        {/* drifting brand glows */}
                        <motion.span
                          className="pointer-events-none absolute -left-16 top-2 h-56 w-56 rounded-full bg-orange/25 blur-3xl"
                          animate={{ x: [0, 30, 0], y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                        />
                        <motion.span
                          className="pointer-events-none absolute -right-12 bottom-2 h-52 w-52 rounded-full bg-[#7c6cf0]/20 blur-3xl"
                          animate={{ x: [0, -24, 0], y: [0, -16, 0], opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, delay: 0.6 }}
                        />

                        {/* diagonal sheen sweeping across once */}
                        <motion.span
                          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                          initial={{ x: "-160%" }}
                          animate={{ x: "320%" }}
                          transition={{ duration: 1.5, ease: EASE, delay: 0.55 }}
                        />

                        {/* on-brand QR scan line — glides top→bottom like a code
                            being scanned, echoing the "QR" in GrowQR */}
                        <motion.span
                          className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange to-transparent shadow-[0_0_18px_2px_rgba(255,106,47,0.75)]"
                          initial={{ top: "-4%", opacity: 0 }}
                          animate={{ top: ["-4%", "104%"], opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.7, ease: EASE, delay: 0.15 }}
                        />
                      </>
                    )}

                    <div className="relative flex flex-col items-center gap-6 px-6 text-center">
                      <motion.div
                        initial={
                          logoOnlyIntro
                            ? { opacity: 0, scale: 0.88 }
                            : { opacity: 0, y: 18, scale: 0.92, filter: "blur(10px)" }
                        }
                        animate={
                          logoOnlyIntro
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                        }
                        transition={
                          logoOnlyIntro
                            ? { duration: 0.28, ease: EASE }
                            : { type: "spring", stiffness: 120, damping: 16, delay: 0.15 }
                        }
                        className="relative grid place-items-center"
                      >
                        {logoOnlyIntro ? (
                          <>
                            <motion.span
                              className="pointer-events-none absolute -inset-3 rounded-full border border-orange/25 border-t-orange"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.85, ease: "linear", repeat: Infinity }}
                            />
                            <motion.span
                              className="pointer-events-none absolute -inset-6 rounded-full border border-orange/15"
                              animate={{ opacity: [0.2, 0.65, 0.2], scale: [0.94, 1.04, 0.94] }}
                              transition={{ duration: 1.05, ease: "easeInOut", repeat: Infinity }}
                            />
                          </>
                        ) : null}
                        <motion.div
                          animate={logoOnlyIntro ? { scale: [1, 1.025, 1] } : undefined}
                          transition={
                            logoOnlyIntro
                              ? { duration: 0.8, ease: "easeInOut", repeat: Infinity }
                              : undefined
                          }
                        >
                          <Image
                            src={introLogoSrc}
                            alt=""
                            width={logoOnlyIntro ? 320 : 400}
                            height={logoOnlyIntro ? 320 : 200}
                            priority
                            className={
                              logoOnlyIntro
                                ? "h-[116px] w-[116px] select-none rounded-full object-cover sm:h-[154px] sm:w-[154px]"
                                : "h-[42px] w-auto select-none sm:h-[54px]"
                            }
                          />
                        </motion.div>
                      </motion.div>

                      {logoOnlyIntro || introWords.length === 0 ? null : <motion.p
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
                        }}
                        className="flex flex-wrap items-center justify-center gap-x-2.5 text-[26px] font-medium tracking-[-0.03em] sm:text-[38px]"
                      >
                        {introWords.map((w, i) => (
                          <motion.span
                            key={w}
                            variants={{
                              hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
                              show: {
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                                transition: { duration: 0.55, ease: EASE },
                              },
                            }}
                            className={`bg-clip-text text-transparent ${
                              i === introWords.length - 1
                                ? "bg-gradient-to-b from-[#ff8a4c] to-[#f2560b]"
                                : "bg-gradient-to-b from-[#4a4a52] to-[#141416]"
                            }`}
                          >
                            {w}
                          </motion.span>
                        ))}
                      </motion.p>}

                      {logoOnlyIntro ? null : <div className="mt-2 h-[3px] w-44 overflow-hidden rounded-full bg-black/[0.08]">
                        <motion.div
                          className="h-full rounded-full bg-orange shadow-[0_0_12px_rgba(255,106,47,0.6)]"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: introDurationMs / 1000, ease: "linear" }}
                        />
                      </div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {cornerLogoSrc ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-3 z-[15] h-9 w-9 overflow-hidden rounded-full border border-white/80 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] sm:left-4 sm:top-4 sm:h-12 sm:w-12"
                >
                  <Image
                    src={cornerLogoSrc}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 48px, 36px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              {/* Center play badge — appears while the film is paused. It's
                  purely visual (pointer-events-none) so the click lands on the
                  video underneath and toggles playback. */}
              <AnimatePresence>
                {introDone && paused && (
                  <motion.div
                    key="paused"
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20"
                  >
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/60 bg-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md sm:h-[84px] sm:w-[84px]"
                    >
                      <Play className="ml-1 h-8 w-8 sm:h-9 sm:w-9" fill="#ffffff" strokeWidth={0} aria-hidden />
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls — always visible (a touch more opaque on hover) so
                  unmute + fullscreen are discoverable without hovering. */}
              <div className="pointer-events-none absolute bottom-0 right-0 flex items-center gap-2 p-3 opacity-80 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:p-4">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute video" : "Mute video"}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" aria-hidden />
                  ) : (
                    <Volume2 className="h-5 w-5" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={enterFullscreen}
                  aria-label="Enter fullscreen"
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Maximize className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
