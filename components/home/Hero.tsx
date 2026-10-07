"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import HeroOrbitVisual from "@/components/home/HeroOrbitVisual";
import { WavyBackground } from "@/components/ui/wavy-background";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import { trackAppCta, trackAppCtaAndNavigate } from "@/lib/analytics";

const APP_SIGNUP_URL = "https://app.growqr.ai/signup";

const WAVE_COLORS = ["#D8BFA8", "#C7B8A9", "#D2C8BE", "#E6DED4", "#B8ADA3"];

const COPY = {
  individual: {
    line1: "Your",
    words: ["Career Co-pilot", "Talent Twin", "Opportunity Finder", "Growth Squad"],
  },
  enterprise: {
    line1: "Enterprise",
    words: ["Autonomous HR", "Workforce Intelligence", "Outsourcing Partner", "Culture Architect"],
  },
};

const TYPE_SPEED = 60;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 300;

export default function Version2Hero() {
  const { mode, setMode } = useHomeMode();
  const isEnterprise = mode === "enterprise";
  const copy = isEnterprise ? COPY.enterprise : COPY.individual;
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  const { openContact } = useEnterpriseContact();
  // In every market where subscriptions are not live, both Individual and
  // Business use the same waitlist modal (with the Cal.com option inside).
  const isWaitlist = !isLive;

  const [displayed, setDisplayed] = useState(copy.words[0]);
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(copy.words[0].length);
  const [deleting, setDeleting] = useState(false);
  const prevModeRef = useRef(mode);

  // Reset to first word instantly when mode switches
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      const first = COPY[mode as "individual" | "enterprise"].words[0];
      setWordIdx(0);
      setCharIdx(first.length);
      setDisplayed(first);
      setDeleting(false);
    }
  }, [mode]);

  useEffect(() => {
    const words = copy.words;
    const current = words[wordIdx];

    if (!deleting && charIdx === current.length) {
      // Fully typed — pause then start deleting
      const t = setTimeout(() => setDeleting(true), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx === 0) {
      // Fully deleted — pause then move to next word
      const next = (wordIdx + 1) % words.length;
      const t = setTimeout(() => {
        setWordIdx(next);
        setDeleting(false);
      }, PAUSE_AFTER_DELETE);
      return () => clearTimeout(t);
    }

    const t = setTimeout(
      () => {
        const next = deleting ? charIdx - 1 : charIdx + 1;
        setCharIdx(next);
        setDisplayed(current.slice(0, next));
      },
      deleting ? DELETE_SPEED : TYPE_SPEED,
    );
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, copy.words]);

  return (
    <section className="relative overflow-hidden">
      {/* Wavy canvas backdrop */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <WavyBackground
          containerClassName="w-full h-full"
          className="w-full h-full"
          colors={WAVE_COLORS}
          waveWidth={44}
          blur={18}
          speed="slow"
          waveOpacity={0.32}
          waveYOffset={0.68}
          amplitude={92}
          backgroundFill="rgba(250,248,244,0)"
        />
      </div>
      {/* Soft grid wash */}
      <div
        className="absolute inset-0 grid-lines opacity-[0.12] pointer-events-none z-[1]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-[1440px] grid-cols-1 items-center px-6 pb-14 pt-32 md:px-14 md:pb-20 md:pt-36 lg:grid-cols-[minmax(0,1.18fr),minmax(0,0.82fr)] lg:gap-8 lg:pb-24 lg:pt-40">
        {/* Left column */}
        <div className="w-full">
          {/* Individual / Enterprise toggle */}
          <div
            className="jt-up -mt-6 inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/70 p-2 text-[14px] md:text-[15px] font-semibold shadow-sm backdrop-blur"
            style={{ animationDelay: "0.05s" }}
          >
            <button
              type="button"
              aria-pressed={!isEnterprise}
              onClick={() => setMode("individual")}
              className={`px-5 py-2 rounded-full transition ${
                !isEnterprise
                  ? "bg-orange-light text-orange-deep shadow-[0_8px_18px_-12px_rgba(255,176,128,0.7)]"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              aria-pressed={isEnterprise}
              onClick={() => setMode("enterprise")}
              className={`px-5 py-2 rounded-full transition ${
                isEnterprise
                  ? "bg-orange-light text-orange-deep shadow-[0_8px_18px_-12px_rgba(255,176,128,0.7)]"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              Business
            </button>
          </div>

          {/* Heading with typewriter rotating word */}
          <h1
            className="jt-up mt-10 text-[40px] sm:text-[54px] md:text-[68px] lg:text-[clamp(38px,4vw,68px)] font-extrabold leading-[1.05] tracking-[-0.03em] sm:mt-12 sm:leading-[1.1] sm:tracking-[-0.02em]"
            style={{ animationDelay: "0.13s" }}
          >
            <span className="block text-[#111111]">{copy.line1}</span>
            <span className="block text-[#FF6A2F]">
              {displayed}
              <span
                className="ml-1 inline-block w-[3px] translate-y-[0.06em] rounded-sm bg-[#FF6A2F] align-middle animate-pulse"
                style={{ height: "0.85em" }}
              />
            </span>
          </h1>

          {/* CTA */}
          <div
            className="jt-up mt-9 sm:mt-12"
            style={{ animationDelay: "0.21s" }}
          >
            <button
              type="button"
              onClick={
                isWaitlist
                  ? () => {
                      trackAppCta({
                        ctaLabel: "Join the Waitlist",
                        ctaLocation: "landing_hero",
                        ctaAction: "waitlist",
                      });
                      openWaitlist("homepage-hero");
                    }
                  : isEnterprise
                  ? () => {
                      trackAppCta({
                        ctaLabel: "Book a Call",
                        ctaLocation: "landing_hero",
                        ctaAction: "modal",
                      });
                      openContact();
                    }
                  : () =>
                      trackAppCtaAndNavigate({
                        ctaLabel: "Claim your QR",
                        ctaLocation: "landing_hero",
                        destinationUrl: APP_SIGNUP_URL,
                      })
              }
              className="cta-shine group inline-flex items-center gap-2 rounded-full bg-[#FF6A2F] px-8 py-4 text-[17px] font-bold tracking-tight text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.5)] transition-all duration-200 hover:bg-[#E85B22] hover:scale-[1.015] hover:shadow-[0_18px_40px_-12px_rgba(255,106,47,0.62)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A2F]/50 focus-visible:ring-offset-2"
            >
                {isWaitlist ? "Join the Waitlist" : isEnterprise ? "Book a Call" : "Claim your QR"}
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Right column — orbit visual. Revealed on all screens; on mobile it
            stacks below the CTA (single grid column) with breathing room. */}
        <div className="mt-8 flex items-center justify-center sm:mt-10 lg:mt-0">
          <div className="w-full max-w-[680px]">
            <HeroOrbitVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
