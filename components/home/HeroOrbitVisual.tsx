"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import QRMark from "./QRMark";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { agents } from "@/lib/data";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useIsMobile } from "@/lib/useIsMobile";

const ease = [0.22, 1, 0.36, 1] as const;

// Individual: 8 slots evenly spaced at 45° (4 inner cardinal + 4 outer diagonal).
const innerOrbitAngles = [0, 90, 180, 270];
const outerOrbitAngles = [45, 135, 225, 315];

// Enterprise: 7 elements (6 agents + 1 human expert) evenly spaced at 360/7 ≈ 51.4°.
const ENT_STEP = 360 / 7;
const innerOrbitAnglesEnterprise = [0, 1, 2, 3].map((n) => n * ENT_STEP);
const outerOrbitAnglesEnterprise = [4, 5, 6].map((n) => n * ENT_STEP);

const aiLabelsIndividual = [
  "Job Finder",
  "LinkedIn Strategist",
  "Resume Expert",
  "Skill Coach",
] as const;

const outerLabelsIndividual = [
  "Interview Coach",
  "Learning Guide",
  "Practice Coach",
] as const;
const aiLabelsEnterprise = [
  "Recruiter",
  "Attrition Predictor",
  "Workforce Analyst",
  "Onboarding Co-pilot",
] as const;

// The one human expert shown on the individual orbit to complete the ecosystem
const HERO_EXPERT = {
  id: "expert-hero",
  name: "Career Expert",
  label: "Career Expert",
  image: "/coaches/coach2.png",
  isHuman: true,
} as const;

// The one human expert shown on the enterprise orbit — the rest of the ring is agents
const ENTERPRISE_EXPERT = {
  id: "expert-enterprise",
  name: "Human Expert",
  label: "Human Expert",
  image: "/coaches/coach1.png",
  isHuman: true,
} as const;

// Entry animation timing (seconds)
const T_QR          = 0.2;   // QR appears
const T_RINGS       = 0.55;  // orbit border rings
const T_INNER       = 1.0;   // first inner agent
const INNER_STAGGER = 0.28;  // gap between each agent  (one-by-one feel)
const INNER_DUR     = 0.6;   // each agent's animation duration
// Outer agents start only after the last (4th) inner agent finishes
const T_OUTER       = T_INNER + 3 * INNER_STAGGER + INNER_DUR + 0.05;
const OUTER_STAGGER = 0.22;  // outer-agent stagger
const OUTER_DUR     = 0.6;
// Live animations start after the last outer agent finishes
const T_LIVE        = T_OUTER + 3 * OUTER_STAGGER + OUTER_DUR + 0.1;

/**
 * The orbit-of-agents visual from the homepage hero (QR mark + inner/outer
 * agent chips + animated beams), extracted so it can be reused verbatim by
 * other hero layouts (e.g. /version2).
 */
export default function HeroOrbitVisual() {
  const { mode } = useHomeMode();
  const isEnterprise = mode === "enterprise";
  const isMobile = useIsMobile(1024);
  const animateOrbitEntry = !isMobile;

  // Responsive QR card size — drives real pixel layout, not CSS scale
  const [qrSize, setQrSize] = useState(110);
  useEffect(() => {
    const update = () => setQrSize(window.innerWidth >= 640 ? 141 : 83);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const aiLabels = isEnterprise ? aiLabelsEnterprise : aiLabelsIndividual;
  const innerAngles = isEnterprise ? innerOrbitAnglesEnterprise : innerOrbitAngles;
  const outerAngles = isEnterprise ? outerOrbitAnglesEnterprise : outerOrbitAngles;

  // Both modes mirror the same shape: agents fill the ring, plus one human
  // expert in the golden ring to complete the ecosystem.
  //   Individual: 7 featured agents + 1 human expert.
  //   Enterprise: all 6 enterprise agents + 1 human expert.
  const FEATURED_INDIVIDUAL_IDS = ["01", "02", "03", "04", "05", "06", "07"];
  const allIndividualAgents = agents.filter((a) => a.type === "individual");
  const agentById = Object.fromEntries(allIndividualAgents.map((a) => [a.id, a]));
  const enterpriseAgents = agents.filter((a) => a.type === "enterprise");

  const heroAgents = isEnterprise
    ? enterpriseAgents.slice(0, 4)
    : FEATURED_INDIVIDUAL_IDS.map((id) => agentById[id]).filter(Boolean).slice(0, 4);

  const innerAgents = heroAgents.map((agent, index) => ({
    ...agent,
    label: aiLabels[index] ?? agent.name,
  }));

  const outerAgents = isEnterprise
    ? [
        ...enterpriseAgents.slice(4).map((a) => {
          const role = a.role.replace(/^The\s+/, "");
          return { id: a.id, image: a.image ?? "", label: role, name: role, isHuman: false };
        }),
        { id: ENTERPRISE_EXPERT.id, image: ENTERPRISE_EXPERT.image, label: ENTERPRISE_EXPERT.label, name: ENTERPRISE_EXPERT.name, isHuman: true },
      ]
    : [
        ...FEATURED_INDIVIDUAL_IDS.slice(4).map((id, i) => {
          const a = agentById[id];
          const label = outerLabelsIndividual[i] ?? a.name;
          return { id: a.id, image: a.image ?? "", label, name: label, isHuman: false };
        }),
        { id: HERO_EXPERT.id, image: HERO_EXPERT.image, label: HERO_EXPERT.label, name: HERO_EXPERT.name, isHuman: true },
      ];
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const outerRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const heroVisualInView = useInView(heroVisualRef, { once: true, margin: "-80px" });
  const [loadedVisuals, setLoadedVisuals] = useState(0);
  const mobileVisualReady = animateOrbitEntry || (heroVisualInView && loadedVisuals >= outerAgents.length + innerAgents.length);
  const onVisualLoaded = () => setLoadedVisuals((count) => count + 1);
  const setHeroVisualContainer = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    heroVisualRef.current = node;
  };

  return (
    <div key={mode} className="relative flex flex-col items-center min-w-0">
      <div
        ref={setHeroVisualContainer}
        className="relative flex items-center justify-center w-full h-[400px] sm:h-[460px] md:h-[540px]"
      >
        <div
          ref={centerRef}
          className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 opacity-0"
          aria-hidden
        />

        {/* Inner orbit ring border */}
        <motion.div
          initial={animateOrbitEntry ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            duration: animateOrbitEntry ? 1.0 : 0,
            delay: animateOrbitEntry ? T_RINGS : 0,
            ease,
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div className="relative w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] lg:w-[410px] lg:h-[410px] xl:w-[432px] xl:h-[432px]">
            <div className="absolute inset-0 rounded-full border border-black/[0.04]" />
          </div>
        </motion.div>

        {/* Signal rings — keep the ambient background pulse on all devices */}
        {mobileVisualReady && (
          <>
            <div
              className="signal-ring signal-ring-outer"
              style={{ animationDelay: `${animateOrbitEntry ? T_LIVE : 0}s` }}
              aria-hidden
            />
            <div
              className="signal-ring signal-ring-outer"
              style={{ animationDelay: `${animateOrbitEntry ? T_LIVE + 7 : 2}s` }}
              aria-hidden
            />
            {/* Two extra rings only on desktop — reduces CSS animation budget on mobile */}
            {!isMobile && (
              <>
                <div
                  className="signal-ring signal-ring-outer"
                  style={{ animationDelay: `${animateOrbitEntry ? T_LIVE + 14 : 4}s` }}
                  aria-hidden
                />
                <div
                  className="signal-ring signal-ring-outer"
                  style={{ animationDelay: `${animateOrbitEntry ? T_LIVE + 21 : 6}s` }}
                  aria-hidden
                />
              </>
            )}
          </>
        )}

        {/* Beams — fire after entry (one per rendered outer chip) */}
        {animateOrbitEntry &&
          outerAgents.map((_, index) => (
            <AnimatedBeam
              key={`beam-${index}`}
              className="z-[4]"
              containerRef={containerRef}
              fromRef={centerRef}
              toRef={outerRefs[index]}
              pathColor="rgba(255,106,47,0.28)"
              pathWidth={1.6}
              pathOpacity={0.45}
              gradientStartColor="#FF6A2F"
              gradientStopColor="#FFD0B5"
              duration={1.6}
              delay={T_LIVE + index * 0.08}
              repeat={Infinity}
              repeatDelay={0.6}
            />
          ))}

        {/* Inner orbit — AI agents: emerge radially from behind the QR */}
        {innerAgents.map((agent, i) => {
          const angle = innerAngles[i];
          const rad = (angle * Math.PI) / 180;
          // Initial offset points from orbit position toward QR center.
          // As it animates to x:0 y:0, the chip slides outward from QR.
          const fromX = -Math.sin(rad) * 40;
          const fromY =  Math.cos(rad) * 40;
          return (
            <div
              key={agent.id}
              className="orbit-chip orbit-inner absolute left-1/2 top-1/2 z-20"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, var(--orbit-r)) rotate(${-angle}deg)`,
              }}
            >
              <motion.div
                className="group flex flex-col items-center gap-2"
                initial={
                  animateOrbitEntry
                    ? { opacity: 0, scale: 0, x: fromX, y: fromY }
                    : false
                }
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{
                  duration: INNER_DUR,
                  delay: animateOrbitEntry ? T_INNER + i * INNER_STAGGER : 0,
                  ease,
                }}
              >
                <div className="relative w-[46px] h-[46px] sm:w-[58px] sm:h-[58px] md:w-[70px] md:h-[70px] lg:w-[76px] lg:h-[76px] xl:w-[82px] xl:h-[82px] rounded-full overflow-hidden border border-orange/60 ring-2 ring-orange/25 shadow-[0_12px_28px_-14px_rgba(255,106,47,0.35)] transition-all duration-300 group-hover:scale-[1.06] group-hover:ring-orange/40 group-hover:shadow-[0_16px_34px_-14px_rgba(255,106,47,0.5)]">
                  {agent.image ? (
                    <Image
                      src={agent.image}
                      alt={agent.label}
                      fill
                      sizes="(min-width: 1280px) 82px, (min-width: 1024px) 76px, 70px"
                      className="object-cover object-center"
                      priority={isMobile}
                      onLoadingComplete={isMobile ? onVisualLoaded : undefined}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-ink text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-semibold tracking-wide">
                      {agent.label}
                    </div>
                  )}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold text-ink-2 leading-none text-center">
                  {agent.label}
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Outer orbit — 3 more agents + 1 human expert */}
        {outerAgents.map((agent, i) => {
          const angle = outerAngles[i];
          const rad = (angle * Math.PI) / 180;
          const fromX = Math.sin(rad) * 22;
          const fromY = -Math.cos(rad) * 22;
          return (
            <div
              key={agent.id}
              className="orbit-chip orbit-inner absolute left-1/2 top-1/2 z-10"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, var(--orbit-r)) rotate(${-angle}deg)`,
              }}
            >
              <motion.div
                className="group flex flex-col items-center gap-2"
                initial={
                  animateOrbitEntry
                    ? { opacity: 0, scale: 0.55, x: fromX, y: fromY }
                    : false
                }
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{
                  duration: OUTER_DUR,
                  delay: animateOrbitEntry ? T_OUTER + i * OUTER_STAGGER : 0,
                  ease,
                }}
              >
                <div
                  ref={outerRefs[i]}
                  className={`relative w-[36px] h-[36px] sm:w-[53px] sm:h-[53px] md:w-[62px] md:h-[62px] lg:w-[68px] lg:h-[68px] xl:w-[74px] xl:h-[74px] rounded-full overflow-hidden bg-white transition-all duration-300 group-hover:scale-[1.05] ${
                    agent.isHuman
                      ? "border-2 border-amber-400/70 ring-2 ring-amber-300/30 shadow-[0_10px_20px_-14px_rgba(251,191,36,0.35)] group-hover:ring-amber-400/50"
                      : "border border-orange/45 ring-2 ring-orange/20 shadow-[0_10px_20px_-14px_rgba(255,106,47,0.22)] group-hover:ring-orange/30"
                  }`}
                >
                  {agent.image ? (
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      fill
                      sizes="(min-width: 1280px) 74px, (min-width: 1024px) 68px, 62px"
                      className="object-cover object-center"
                      priority={isMobile}
                      onLoadingComplete={isMobile ? onVisualLoaded : undefined}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-ink text-[9px] sm:text-[11px] md:text-[13px] font-semibold tracking-wide">
                      {agent.name.replace(/^RQ-/, "")}
                    </div>
                  )}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-semibold text-ink-2 leading-none text-center">
                  {agent.name.replace(/^RQ-/, "")}
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* QR — first thing to appear */}
        <motion.div
          className="relative z-10"
          initial={mobileVisualReady ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: mobileVisualReady ? 0.9 : 0,
            delay: mobileVisualReady ? (animateOrbitEntry ? T_QR : 0) : 0,
            ease,
          }}
        >
          <QRMark
            size={qrSize}
            scores={[65, 71, 78, 84, 91]}
            animate={false}
            animateSparkline={mobileVisualReady}
            label={isEnterprise ? "Enterprise QR" : "Your QR"}
          />
        </motion.div>
      </div>
    </div>
  );
}
