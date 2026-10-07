"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MdQrCode2 } from "react-icons/md";
import { WavyBackground } from "@/components/ui/wavy-background";
import { trackAppCta, trackAppCtaAndNavigate } from "@/lib/analytics";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";

// Same palette + settings as the Hero, rendered static (no animation).
const WAVE_COLORS = ["#D8BFA8", "#C7B8A9", "#D2C8BE", "#E6DED4", "#B8ADA3"];
const APP_SIGNUP_URL = "https://app.growqr.ai/signup";

// Four agent faces for the social-proof pill (drawn from the individual squad).
const AGENT_PFPS = [
  { src: "/agents/3.png", name: "RQ-Scout" },
  { src: "/agents/2.png", name: "RQ-Mira" },
  { src: "/agents/1.png", name: "RQ-Vera" },
  { src: "/agents/7.png", name: "RQ-Kai" },
];

// Four enterprise agent faces for the social-proof pill in Business mode.
const AGENT_PFPS_ENTERPRISE = [
  { src: "/agents/rita.png", name: "RQ-Rita" },
  { src: "/agents/rohan.png", name: "RQ-Rohan" },
  { src: "/agents/eva.png", name: "RQ-Eva" },
  { src: "/agents/finn.png", name: "RQ-Finn" },
];

export default function FinalCTA() {
  // Shares the EnterpriseContactModal instance mounted once at the page level
  // (see app/page.tsx / app/enterprise/page.tsx) so the Hero and FinalCTA
  // "Book a Call" CTAs open the same modal instead of separate instances.
  return <FinalCTAContent />;
}

function FinalCTAContent() {
  const reduce = useReducedMotion();
  const { mode } = useHomeMode();
  const brand = mode === "enterprise";
  const pfps = brand ? AGENT_PFPS_ENTERPRISE : AGENT_PFPS;
  const { openContact } = useEnterpriseContact();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // Non-live markets use one waitlist flow in both Individual and Business.
  const isWaitlist = !isLive;

  return (
    <section className="bg-white px-6 py-16 md:px-14 md:py-24">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[36px] border border-black/[0.06] bg-[#FAF8F4] px-6 py-16 text-center sm:py-20 md:px-14 md:py-28">
        {/* Static hero wave backdrop, clipped to the card */}
        <div className="absolute inset-0 z-0" aria-hidden>
          <WavyBackground
            static
            containerClassName="w-full h-full"
            className="w-full h-full"
            colors={WAVE_COLORS}
            waveWidth={44}
            blur={18}
            waveOpacity={0.32}
            waveYOffset={0.68}
            amplitude={92}
            backgroundFill="rgba(250,248,244,1)"
          />
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 22 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-[760px]"
        >
          {/* Agent social-proof pill */}
          <div className="inline-flex items-center gap-3 rounded-full border border-orange/20 bg-white/80 py-1.5 pl-2 pr-4 shadow-[0_6px_16px_-10px_rgba(140,62,21,0.35)] backdrop-blur-sm">
            <div className="flex items-center">
              {pfps.map((a, i) => (
                <div
                  key={a.name}
                  className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white"
                  style={{ marginLeft: i === 0 ? 0 : "-9px", zIndex: pfps.length - i }}
                >
                  <Image src={a.src} alt={a.name} fill sizes="28px" className="object-cover" />
                </div>
              ))}
            </div>
            <span className="hidden text-[13px] font-semibold tracking-tight text-ink-2 sm:inline md:text-sm">
              {brand ? "Your AI team for workforce growth" : "Your AI team for career growth"}
            </span>
          </div>

          {/* Readiness tagline */}
          <h2 className="mx-auto mt-8 max-w-[22ch] text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-ink sm:text-[38px] md:max-w-[26ch] md:text-[54px]">
            Everything you need to grow, in <span className="text-orange">one ecosystem</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-[46ch] text-pretty text-[16px] leading-[1.6] text-ink-3 sm:text-[17px] md:max-w-none md:text-[19px] lg:whitespace-nowrap">
            {brand
              ? "AI agents, workforce intelligence, and proof of your team's readiness."
              : "AI agents, expert guidance, and proof of your career readiness."}
          </p>

          {/* Non-live: waitlist in both modes. Live: mode-specific CTA. */}
          {isWaitlist ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({
                  ctaLabel: "Join the Waitlist",
                  ctaLocation: "landing_final_cta",
                  ctaAction: "waitlist",
                });
                openWaitlist("final-cta");
              }}
              className="group mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_18px_40px_-12px_rgba(255,106,47,0.55)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
            >
              Join the Waitlist
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          ) : brand ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({
                  ctaLabel: "Book a Call",
                  ctaLocation: "landing_final_cta",
                  ctaAction: "modal",
                });
                openContact();
              }}
              className="group mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_18px_40px_-12px_rgba(255,106,47,0.55)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
            >
              Book a Call
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                trackAppCtaAndNavigate({
                  ctaLabel: "Claim your QR",
                  ctaLocation: "landing_final_cta",
                  destinationUrl: APP_SIGNUP_URL,
                })
              }
              className="group mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_18px_40px_-12px_rgba(255,106,47,0.55)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
            >
              <MdQrCode2 className="h-[22px] w-[22px]" aria-hidden />
              Claim your QR
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
