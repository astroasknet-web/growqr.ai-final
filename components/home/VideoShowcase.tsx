"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Play } from "lucide-react";
import { Eyebrow, SectionHeading } from "./SectionHeader";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The intro film shown in the framed player. */
const VIDEO_SRC = "/Web-Seeker-Intro-Vdo-1.mp4";

/* ------------------------------------------------------------------ */
/*  Motion                                                            */
/* ------------------------------------------------------------------ */

const colVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/*  Section — premium framed intro video (SaaS "watch it in action")   */
/*  Standalone + self-contained so it can be toggled on/off in one     */
/*  line from the page. Sits on the same grid-lines + glow backdrop    */
/*  used across the site so it reads as part of the system.            */
/* ------------------------------------------------------------------ */

export default function VideoShowcase() {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    // let React swap in controls, then start playback
    requestAnimationFrame(() => videoRef.current?.play());
  };

  return (
    <section
      role="region"
      aria-label="Watch GrowQR in action"
      className="relative w-full overflow-hidden border-b border-black/5 bg-white px-6 py-20 md:px-14 md:py-28"
    >
      {/* site-standard backdrop: the same faint grid used across the site,
          nothing else — the frame carries the section on its own. */}
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
          className="mx-auto flex max-w-[720px] flex-col items-center text-center"
        >
          <motion.div variants={reduce ? undefined : itemVariants}>
            <Eyebrow center>One QR, Infinite Possibilities</Eyebrow>
          </motion.div>

          <motion.div variants={reduce ? undefined : itemVariants}>
            <SectionHeading className="sm:whitespace-nowrap">
              Meet <span className="text-orange">GrowQR</span>
            </SectionHeading>
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
          <div className="rounded-[16px] bg-gradient-to-b from-black/[0.08] to-black/[0.03] p-[1.5px] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.5)]">
            <div
              className="relative overflow-hidden rounded-[14px] bg-black ring-1 ring-white/10"
              style={{ aspectRatio: "16 / 9" }}
            >
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                className="h-full w-full object-cover"
                controls={playing}
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onEnded={() => setPlaying(false)}
              />

              {/* Poster overlay — hidden once playback starts */}
              {!playing && (
                <button
                  type="button"
                  onClick={play}
                  aria-label="Play the GrowQR intro video"
                  className="group absolute inset-0 flex items-center justify-center"
                >
                  {/* darkening scrim for contrast + depth */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20 transition-opacity duration-300 group-hover:opacity-90"
                  />

                  {/* glass play button */}
                  <span className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full sm:h-[92px] sm:w-[92px]">
                    {!reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-white/50"
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                        transition={{
                          duration: 2.4,
                          ease: "easeOut",
                          repeat: Infinity,
                          repeatDelay: 0.4,
                        }}
                      />
                    )}
                    <span
                      className="relative flex h-full w-full items-center justify-center rounded-full border border-white/60 bg-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/30"
                      style={{ WebkitBackdropFilter: "blur(10px)" }}
                    >
                      <Play
                        className="ml-1 h-7 w-7 sm:h-9 sm:w-9"
                        fill="#ffffff"
                        strokeWidth={0}
                        aria-hidden
                      />
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
