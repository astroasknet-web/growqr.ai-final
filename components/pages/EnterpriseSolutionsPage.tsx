"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { WavyBackground } from "@/components/ui/wavy-background";
import PartnerStrip from "@/components/home/PartnerStrip";
import BrandIntelligenceSection from "@/components/enterprise/BrandIntelligenceSection";
import { agents } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { handleActivateAgent } from "@/lib/handlers";
import Reveal from "@/components/ui/Reveal";
import CalButton from "@/components/ui/CalButton";
import { Eyebrow } from "@/components/home/SectionHeader";
import { useHomeMode } from "@/components/layout/HomeMode";

const ease = [0.22, 1, 0.36, 1] as const;
const ORANGE = "#FF6A2F";
const ORANGE_DEEP = "#9C3A11";
const INK = "#333333";
const INK_MUTED = "#525252";

/* ═══════════════════════════════════════════════════════════════════════════
   /solutions/enterprise — corporate-SaaS rebuild
   Six sections: Hero · Logos · Agents · Lifecycle · Stack · Final CTA
   ═══════════════════════════════════════════════════════════════════════════ */

export default function EnterpriseSolutionsPage() {
  const { setMode } = useHomeMode();

  useEffect(() => {
    setMode("enterprise");
  }, [setMode]);

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <Hero />
        <BrandIntelligenceSection />
        <AIAgents />
        <LifecycleWorkflow />
        <StatsBand />
        <FullStack />
        <PartnerStrip />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   1 — HERO  (centred, single column)
   ────────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 md:pt-40 pb-20 md:pb-24 px-6 md:px-14">
      {/* Wavy ribbon backdrop — same palette/config as the homepage hero */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <WavyBackground
          containerClassName="w-full h-full"
          className="w-full h-full"
          colors={["#D8BFA8", "#C7B8A9", "#D2C8BE", "#E6DED4", "#B8ADA3"]}
          waveWidth={44}
          blur={18}
          speed="slow"
          waveOpacity={0.32}
          waveYOffset={0.68}
          amplitude={92}
          backgroundFill="rgba(250,248,244,0)"
        />
      </div>

      {/* Soft grid wash (matches homepage hero) */}
      <div
        className="absolute inset-0 grid-lines opacity-[0.12] pointer-events-none z-[1]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1440px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <Eyebrow center>For Enterprises</Eyebrow>

          <h1
            className="mt-6 text-[36px] md:text-[56px] xl:text-[68px] font-medium leading-[1.0] tracking-[-0.04em] md:tracking-[-0.05em]"
            style={{ color: INK }}
          >
            <span className="block">
              Workforce <span className="text-orange">Intelligence.</span>
            </span>
            <span className="block mt-2 md:mt-3">
              AI Agents for Enterprises.
            </span>
          </h1>

          <div className="mt-10 md:mt-12 flex justify-center">
            <CalButton
              source="enterprise-hero"
              label="Book a demo"
              className="group inline-flex items-center gap-3 bg-orange text-white text-[16px] font-semibold px-8 py-3.5 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2 — AI AGENTS  (6 capability cards, functional names)
   ────────────────────────────────────────────────────────────────────────── */
interface AgentCard {
  name: string;
  tagline: string;
  image: string;
}

const agentCards: AgentCard[] = [
  {
    name: "AI Recruiter",
    tagline:
      "Sources, screens, and ranks candidates so your recruiters only meet people worth meeting.",
    image: "/agents/rita.png",
  },
  {
    name: "Attrition Predictor",
    tagline:
      "Reads team signals and flags disengagement before it becomes a resignation letter on your desk.",
    image: "/agents/11.png",
  },
  {
    name: "Workforce Intelligence",
    tagline:
      "Maps skills, gaps, and performance patterns across your entire workforce in real time.",
    image: "/agents/rohan.png",
  },
  {
    name: "Onboarding Co-pilot",
    tagline:
      "Cuts time-to-productivity by guiding every new hire through a structured, personalised onboarding journey.",
    image: "/agents/finn.png",
  },
  {
    name: "Capability Builder",
    tagline:
      "Identifies skill gaps at team level and delivers targeted learning paths that move measurable needles.",
    image: "/agents/eva.png",
  },
  {
    name: "Outsourcing Manager",
    tagline:
      "Sources, vets, and manages freelance contractors so your bench is always ready to deploy.",
    image: "/agents/maya.png",
  },
];

function AIAgents() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDraggedRef = useRef(false);

  const EDGE_BUFFER = 96;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    const speed = 0.5;

    const tick = () => {
      if (!isHoveringRef.current && !isDraggingRef.current) {
        const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
        if (maxScrollLeft > 0) {
          rail.scrollLeft += speed;
          if (rail.scrollLeft >= maxScrollLeft - 2) {
            rail.scrollLeft = 0;
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || isDraggingRef.current) return;

    const card = e.currentTarget.getBoundingClientRect();
    const view = rail.getBoundingClientRect();

    const rightOverflow = card.right - (view.right - EDGE_BUFFER);
    const leftOverflow = view.left + EDGE_BUFFER - card.left;

    if (rightOverflow > 0) {
      rail.scrollBy({ left: rightOverflow + 24, behavior: "smooth" });
    } else if (leftOverflow > 0) {
      rail.scrollBy({ left: -(leftOverflow + 24), behavior: "smooth" });
    }
  };

  const onRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    isDraggingRef.current = true;
    isHoveringRef.current = true;
    hasDraggedRef.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = rail.scrollLeft;
    rail.style.cursor = "grabbing";
    rail.style.scrollBehavior = "auto";

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = ev.clientX - dragStartX.current;
      if (Math.abs(delta) > 4) {
        hasDraggedRef.current = true;
        ev.preventDefault();
      }
      if (hasDraggedRef.current) {
        rail.scrollLeft = dragScrollLeft.current - delta;
      }
    };

    const onUp = () => {
      isDraggingRef.current = false;
      isHoveringRef.current = false;
      rail.style.cursor = "grab";
      rail.style.scrollBehavior = "smooth";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onRailClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  return (
    <section className="relative py-16 md:py-20 px-6 md:px-14 bg-white">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 md:mb-10 max-w-[900px]">
          <Reveal direction="left" offset={60}>
            <Eyebrow>AI Agents</Eyebrow>
            <h2
              className="mt-3 text-[28px] md:text-[40px] xl:text-[48px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em]"
              style={{ color: INK }}
            >
              Specialised Agents.{" "}
              <span className="md:whitespace-nowrap">
                One Workforce{" "}
                <span className="text-orange">
                  Platform
                </span>
                .
              </span>
            </h2>
          </Reveal>
        </div>

        <div className="-mx-6 md:-mx-14">
          <div
            ref={railRef}
            className="flex-1 overflow-x-auto select-none pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ cursor: "grab" }}
            onMouseDown={onRailMouseDown}
            onClickCapture={onRailClickCapture}
            onMouseEnter={() => { isHoveringRef.current = true; }}
            onMouseLeave={() => { if (!isDraggingRef.current) isHoveringRef.current = false; }}
            onTouchStart={() => { isHoveringRef.current = true; }}
            onTouchEnd={() => { isHoveringRef.current = false; }}
          >
            <div className="flex items-stretch gap-4 md:gap-5 min-w-max px-6 md:px-14 py-2">
              {agentCards.map((agent, i) => (
                <motion.article
                  key={agent.name}
                  onMouseEnter={handleCardHover}
                  className="group flex-shrink-0 w-[280px] md:w-[300px] h-[368px] sm:h-[388px] md:h-[420px] flex flex-col bg-white rounded-[14px] overflow-hidden border transition-all duration-300 hover:border-black/20 hover:-translate-y-1 hover:shadow-[0_22px_52px_-18px_rgba(17,24,39,0.22)]"
                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                >
                  <div className="relative w-full aspect-[5/4] overflow-hidden bg-gradient-to-b from-cream-2 to-cream/70 border-b border-black/5">
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      fill
                      sizes="(max-width: 768px) 280px, 300px"
                      priority={i < 3}
                      className="object-contain object-bottom scale-100 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="flex flex-col flex-1 p-[14px] md:p-5 gap-1.5 min-h-0">
                    <h3
                      className="text-[16px] md:text-[18px] font-extrabold tracking-[-0.02em] leading-tight truncate"
                      style={{ color: INK }}
                    >
                      {agent.name}
                    </h3>
                    <p
                      className="text-[12px] md:text-[13px] leading-[1.45] line-clamp-2 sm:line-clamp-3 md:line-clamp-3"
                      style={{ color: INK_MUTED }}
                    >
                      {agent.tagline}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleActivateAgent(agent.name)}
                      className="mt-2 inline-flex items-center gap-1.5 text-[12px] md:text-[13px] font-semibold self-start transition-transform"
                      style={{ color: ORANGE }}
                    >
                      Activate
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4 — LIFECYCLE WORKFLOW  (Hiring · Onboarding · Retention tabs)
   ────────────────────────────────────────────────────────────────────────── */
type LifecycleTab =
  | "hiring"
  | "onboarding"
  | "retention"
  | "upskill"
  | "outsourcing";

interface CapabilityAgent {
  name: string;
  role: string;
  action: string;
}

interface SubAgent {
  title: string;
  desc: string;
  href: string;
  illustration: (props: { size?: number }) => React.ReactElement;
  agents: CapabilityAgent[];
}

const lifecycleTabs: Record<
  LifecycleTab,
  { label: string; headline: string; cards: SubAgent[] }
> = {
  hiring: {
    label: "Hiring",
    headline: "From requisition to offer, compressed.",
    cards: [
      {
        title: "Multichannel Sourcing",
        desc: "Reach candidates instantly across job boards, referrals & social.",
        href: "/contact",
        illustration: StackIllustration,
        agents: [
          { name: "RQ-Rita", role: "AI Recruiter", action: "Crawls every public job board and LinkedIn in real time" },
          { name: "RQ-Scout", role: "Opportunity Finder", action: "Surfaces passive candidates from alumni + referral networks" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Writes JD copy tuned to rank in candidate search" },
          { name: "RQ-Nova", role: "Brand Voice", action: "Runs social outreach campaigns per role" },
        ],
      },
      {
        title: "Screening Agents",
        desc: "AI pre-screens applicants and surfaces only top-fit candidates.",
        href: "/contact",
        illustration: SearchIllustration,
        agents: [
          { name: "RQ-Rita", role: "AI Recruiter", action: "Ranks every applicant by RQ fit against the brief" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Benchmarks each candidate's skill stack" },
          { name: "RQ-Vera", role: "Interviewer", action: "Runs first-round AI interviews on the top fits" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Normalises resumes for apples-to-apples review" },
        ],
      },
      {
        title: "Assessment Agents",
        desc: "AI-led skill & behaviour tests ensure right-fit, transparent hiring.",
        href: "/contact",
        illustration: GaugeIllustration,
        agents: [
          { name: "RQ-Sage", role: "Skill Trainer", action: "Runs verified skill assessments at scale" },
          { name: "RQ-Kai", role: "Roleplay Coach", action: "Scenario tests for working-style and behavioural fit" },
          { name: "RQ-Vera", role: "Interviewer", action: "Moderates structured behavioural interviews" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Maps results to role requirement bands" },
        ],
      },
      {
        title: "Interview Management",
        desc: "End-to-end interview tracking from invites to selections.",
        href: "/contact",
        illustration: CalendarIllustration,
        agents: [
          { name: "RQ-Vera", role: "Interviewer", action: "Runs and records every structured interview" },
          { name: "RQ-Rita", role: "AI Recruiter", action: "Coordinates schedules across panels and candidates" },
          { name: "RQ-Kai", role: "Roleplay Coach", action: "Preps interviewers with role-specific prompts" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Routes selected candidates to the next stage" },
        ],
      },
    ],
  },
  onboarding: {
    label: "Onboarding",
    headline: "From day one to full productivity, guided.",
    cards: [
      {
        title: "Documentation Agents",
        desc: "Automate offers, LOIs & follow-ups to cut drop-offs.",
        href: "/contact",
        illustration: FolderIllustration,
        agents: [
          { name: "RQ-Finn", role: "Onboarding Co-pilot", action: "Generates offers and LOIs per role template" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Adapts documentation to each new hire's context" },
          { name: "RQ-Rita", role: "AI Recruiter", action: "Tracks acceptance and follow-up cadence" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Flags drop-off risks from pending docs" },
        ],
      },
      {
        title: "Verification Agents",
        desc: "AI handles instant document checks & compliance.",
        href: "/contact",
        illustration: ShieldIllustration,
        agents: [
          { name: "RQ-Finn", role: "Onboarding Co-pilot", action: "Runs KYC, education, and prior-role checks" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Cross-references verified data against claims" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Validates certifications against role requirements" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Confirms document authenticity and formatting" },
        ],
      },
      {
        title: "Pre-joining Engagement",
        desc: "Keep candidates engaged before day one and reduce drop-offs.",
        href: "/contact",
        illustration: ChatBubbleIllustration,
        agents: [
          { name: "RQ-Finn", role: "Onboarding Co-pilot", action: "Runs weekly check-ins with joining candidates" },
          { name: "RQ-Nova", role: "Brand Voice", action: "Publishes culture content tuned to new hires" },
          { name: "RQ-Drape", role: "Presence Coach", action: "Preps them for first-day presence and voice" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Shows the career path visible from day one" },
        ],
      },
      {
        title: "30-60-90 Plans",
        desc: "Structured journey for every new hire, personalised by role.",
        href: "/contact",
        illustration: TargetIllustration,
        agents: [
          { name: "RQ-Finn", role: "Onboarding Co-pilot", action: "Builds the 30-60-90 template per role" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Matches learning modules to each milestone" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Runs ramp-up skill assessments at each mark" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Maps the first promotion path at day 90" },
        ],
      },
      {
        title: "Bulk Upload",
        desc: "Upload a CSV. Launch a full onboarding journey. Onboard entire cohorts.",
        href: "/contact",
        illustration: BulkUploadIllustration,
        agents: [
          { name: "RQ-Finn", role: "Onboarding Co-pilot", action: "Parses the list and spins up a journey per new hire" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Normalises imported records to the company template" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Flags missing data, duplicates, and role mismatches" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Baselines skill profiles across the imported cohort" },
        ],
      },
    ],
  },
  retention: {
    label: "Retention",
    headline: "Flight risk, surfaced. Growth paths, mapped.",
    cards: [
      {
        title: "Training Agents",
        desc: "Personalised, multilingual learning paths that drive measurable progress.",
        href: "/contact",
        illustration: LightbulbIllustration,
        agents: [
          { name: "RQ-Lyra", role: "Learning Curator", action: "Curates the right course sequence per learner" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Delivers targeted skill paths at scale" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Measures skill growth through assessments" },
          { name: "RQ-Kai", role: "Roleplay Coach", action: "Runs soft-skill scenario practice" },
        ],
      },
      {
        title: "Employee Pulse",
        desc: "Instant feedback loops that spot attrition risks early.",
        href: "/contact",
        illustration: ClipboardIllustration,
        agents: [
          { name: "RQ-Theo", role: "Attrition Predictor", action: "Reads team health signals week-over-week" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Maps retention risk across teams" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Surfaces growth conversations to have now" },
          { name: "RQ-Nova", role: "Brand Voice", action: "Runs culture pulse surveys with real response" },
        ],
      },
      {
        title: "Internal Mobility",
        desc: "Map growth paths so high-performers see a future with you.",
        href: "/contact",
        illustration: BookIllustration,
        agents: [
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Maps next-role options per employee" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Cross-references skill fit for open roles" },
          { name: "RQ-Theo", role: "Attrition Predictor", action: "Prioritises flight-risk candidates for moves" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Closes the skill delta to the next role" },
        ],
      },
      {
        title: "Engagement Agents",
        desc: "Keep teams connected through voice and chat pulse check-ins.",
        href: "/contact",
        illustration: PulseIllustration,
        agents: [
          { name: "RQ-Theo", role: "Attrition Predictor", action: "Monitors engagement levels in real time" },
          { name: "RQ-Nova", role: "Brand Voice", action: "Crafts team-wide culture moments" },
          { name: "RQ-Drape", role: "Presence Coach", action: "Coaches leaders on team presence" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Connects career paths to the daily work" },
        ],
      },
    ],
  },
  upskill: {
    label: "Upskill",
    headline: "From current skills to future-ready, planned.",
    cards: [
      {
        title: "Skill Gap Analysis",
        desc: "Maps individual and team gaps against real role requirements.",
        href: "/contact",
        illustration: GaugeIllustration,
        agents: [
          { name: "RQ-Sage", role: "Skill Trainer", action: "Runs skill assessments across the team" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Benchmarks current skills vs role demands" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Prioritises which gaps to close first" },
          { name: "RQ-Lyra", role: "Learning Curator", action: "Maps market-hot skills not yet in-team" },
        ],
      },
      {
        title: "Learning Paths",
        desc: "Personalised journeys per role, career arc, and market trend.",
        href: "/contact",
        illustration: BookIllustration,
        agents: [
          { name: "RQ-Lyra", role: "Learning Curator", action: "Curates the right course sequence per learner" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Delivers multi-role learning programs" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Runs progress checks at every milestone" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Ties paths to promotion criteria" },
        ],
      },
      {
        title: "Certification Tracking",
        desc: "Validate completed skills and keep credentials current.",
        href: "/contact",
        illustration: ShieldIllustration,
        agents: [
          { name: "RQ-Sage", role: "Skill Trainer", action: "Validates completed skills against standards" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Tracks certification expiry across the team" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Schedules renewal learning paths" },
          { name: "RQ-Lyra", role: "Learning Curator", action: "Recommends cert paths per role growth" },
        ],
      },
      {
        title: "Role Readiness",
        desc: "Prepares employees for promotions and internal moves.",
        href: "/contact",
        illustration: TargetIllustration,
        agents: [
          { name: "RQ-Vera", role: "Interviewer", action: "Runs promotion-readiness interviews" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Maps required skills per target role" },
          { name: "RQ-Eva", role: "Capability Builder", action: "Closes ramp-up gaps ahead of the move" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Validates readiness via assessments" },
        ],
      },
    ],
  },
  outsourcing: {
    label: "Outsourcing",
    headline: "On-demand talent, vetted and deployed.",
    cards: [
      {
        title: "Contractor Sourcing",
        desc: "Vetted freelancers matched to the brief, ready to start.",
        href: "/contact",
        illustration: SearchIllustration,
        agents: [
          { name: "RQ-Maya", role: "Outsourcing Manager", action: "Sources from a curated freelancer pool" },
          { name: "RQ-Rita", role: "AI Recruiter", action: "Scores contractors on fit per project" },
          { name: "RQ-Scout", role: "Opportunity Finder", action: "Pulls the long tail of niche specialists" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Benchmarks rates and availability" },
        ],
      },
      {
        title: "Vendor Management",
        desc: "Track contracts, rates, and deliverables in one system.",
        href: "/contact",
        illustration: FolderIllustration,
        agents: [
          { name: "RQ-Maya", role: "Outsourcing Manager", action: "Manages contracts and rate cards" },
          { name: "RQ-Mira", role: "Resume Expert", action: "Formats SOWs and vendor documentation" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Tracks utilisation and spend per vendor" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Plans long-term vendor relationships" },
        ],
      },
      {
        title: "Project Matching",
        desc: "Right talent to the right project at the right time.",
        href: "/contact",
        illustration: CalendarIllustration,
        agents: [
          { name: "RQ-Maya", role: "Outsourcing Manager", action: "Matches freelancers to incoming briefs" },
          { name: "RQ-Atlas", role: "Pathway Guide", action: "Plans project sequencing and dependencies" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Flags skill gaps between brief and bench" },
          { name: "RQ-Rita", role: "AI Recruiter", action: "Surfaces new contractors when bench is thin" },
        ],
      },
      {
        title: "Quality Assurance",
        desc: "Track SLAs, review deliverables, close the loop.",
        href: "/contact",
        illustration: ClipboardIllustration,
        agents: [
          { name: "RQ-Maya", role: "Outsourcing Manager", action: "Tracks deliverable quality per vendor" },
          { name: "RQ-Vera", role: "Interviewer", action: "Runs vendor check-ins at project milestones" },
          { name: "RQ-Rohan", role: "Workforce Analyst", action: "Flags SLA breach patterns" },
          { name: "RQ-Sage", role: "Skill Trainer", action: "Validates output quality against rubric" },
        ],
      },
    ],
  },
};

function LifecycleWorkflow() {
  const [active, setActive] = useState<LifecycleTab>("hiring");
  const [capabilityIdx, setCapabilityIdx] = useState(0);
  const [workingIdx, setWorkingIdx] = useState(0);
  const current = lifecycleTabs[active];
  const capability = current.cards[capabilityIdx] ?? current.cards[0];
  const tabOrder: LifecycleTab[] = [
    "hiring",
    "onboarding",
    "retention",
    "upskill",
    "outsourcing",
  ];

  useEffect(() => {
    setCapabilityIdx(0);
  }, [active]);

  useEffect(() => {
    setWorkingIdx(0);
    const agentCount = capability.agents.length;
    if (!agentCount) return;
    const id = window.setInterval(() => {
      setWorkingIdx((p) => (p + 1) % agentCount);
    }, 2200);
    return () => window.clearInterval(id);
  }, [active, capabilityIdx, capability.agents.length]);

  const agentByName = Object.fromEntries(agents.map((a) => [a.name, a]));

  return (
    <section
      className="relative py-20 md:py-28 px-6 md:px-14"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 md:mb-14 max-w-[980px]">
          <Reveal direction="left" offset={60}>
            <Eyebrow>The Full Lifecycle</Eyebrow>
            <h2
              className="mt-3 text-[28px] md:text-[40px] xl:text-[48px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em] md:whitespace-nowrap"
              style={{ color: INK }}
            >
              One Platform. Every Stage of the{" "}
              <span className="text-orange">
                Workforce
              </span>{" "}
              Journey.
            </h2>
          </Reveal>
        </div>

        <div
          role="tablist"
          aria-label="Lifecycle phase"
          className="flex flex-nowrap md:flex-wrap gap-2 mb-5 overflow-x-auto no-scrollbar -mx-1 px-1 -my-1 py-1"
        >
          {tabOrder.map((key) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(key)}
                className={`flex-shrink-0 inline-flex items-center h-9 px-4 rounded-full border text-[12.5px] font-semibold tracking-[-0.005em] leading-none transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 ${isActive
                    ? "bg-orange/10 border-orange text-orange-deep shadow-[0_10px_20px_-16px_rgba(191,94,45,0.55)] hover:bg-orange/15 hover:border-orange/80"
                    : "bg-white border-black/10 text-ink-3 hover:bg-black/[0.03] hover:border-black/20 hover:text-ink"
                  }`}
              >
                {lifecycleTabs[key].label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-6 mb-6 border-b" style={{ borderColor: "rgba(51,51,51,0.08)" }}>
          <div
            className="flex gap-1 md:gap-5 overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="Capability"
          >
            {current.cards.map((card, i) => {
              const isActive = i === capabilityIdx;
              return (
                <button
                  key={card.title}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCapabilityIdx(i)}
                  className="relative flex-shrink-0 px-3 md:px-4 pt-1.5 pb-2.5 text-[13.5px] md:text-[14.5px] font-semibold whitespace-nowrap transition-colors"
                  style={{ color: isActive ? ORANGE : "#525252" }}
                >
                  {card.title}
                  {isActive && (
                    <motion.span
                      layoutId="capability-underline"
                      className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                      style={{ backgroundColor: ORANGE }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-[1.1fr,1fr] lg:grid-cols-[1fr,1.3fr] gap-12 lg:gap-14 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${active}-${capabilityIdx}-left`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-col max-w-[560px]"
            >
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulseDot" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-green-700">
                  {current.label} · Active
                </span>
              </div>

              <h3
                className="text-[28px] md:text-[34px] lg:text-[38px] font-extrabold tracking-[-0.03em] leading-[1.1]"
                style={{ color: INK }}
              >
                {capability.title}
              </h3>

              <p
                className="mt-4 text-[16px] md:text-[17px] leading-[1.6] max-w-[48ch]"
                style={{ color: INK_MUTED }}
              >
                {capability.desc}
              </p>

              <div className="mt-5 inline-flex flex-wrap items-center gap-3 text-[12.5px] text-ink-4 bg-white/70 border border-black/10 rounded-full px-4 py-2 w-fit">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-orange" />
                  {capability.agents.length} agents activated
                </span>
                <span className="w-px h-3 bg-black/15" />
                <span>Workflow ready in ~30s</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${active}-${capabilityIdx}-right`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {capability.agents.map((a, i) => (
                <CapabilityAgentCard
                  key={`${active}-${capabilityIdx}-${a.name}-${i}`}
                  recipeAgent={a}
                  rosterAgent={agentByName[a.name]}
                  working={i === workingIdx}
                  rowKey={`${active}-${capabilityIdx}`}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="https://app.growqr.ai/login"
            className="group inline-flex items-center gap-2 bg-white text-[#ba572a] text-[14px] font-semibold px-6 py-3 rounded-full border border-[#e5a982] shadow-[0_8px_18px_-14px_rgba(191,94,45,0.45)] transition-all duration-300 hover:bg-[#fff7f2] hover:border-[#da9366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/35 focus-visible:ring-offset-2"
          >
            Activate this workflow
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CapabilityAgentCard({
  recipeAgent,
  rosterAgent,
  working,
  rowKey,
  index,
}: {
  recipeAgent: CapabilityAgent;
  rosterAgent: (typeof agents)[number] | undefined;
  working: boolean;
  rowKey: string;
  index: number;
}) {
  const accent = rosterAgent?.color ?? ORANGE_DEEP;
  const portraitSrc = rosterAgent?.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: working ? 1.02 : 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.45,
        ease,
        scale: { type: "spring", stiffness: 260, damping: 24 },
      }}
      className={`group relative flex bg-white rounded-2xl overflow-hidden min-h-[140px] transition-all duration-300 ${working
          ? "ring-2 ring-[#d27b53]/75 shadow-[0_20px_40px_-20px_rgba(191,94,45,0.36)]"
          : "ring-1 ring-black/[0.09] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.08)] hover:ring-black/[0.16] hover:shadow-[0_14px_28px_-18px_rgba(15,23,42,0.22)]"
        }`}
    >
      <div
        className="relative w-[120px] self-stretch flex-shrink-0 overflow-hidden"
        style={{ background: accent }}
      >
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt={`${recipeAgent.name} — ${recipeAgent.role}`}
            fill
            sizes="120px"
            className={`object-cover object-center transition-all duration-500 ${working ? "scale-[1.04]" : "scale-100"}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-extrabold tracking-[-0.03em]">
            {(rosterAgent?.initials ?? recipeAgent.name.slice(0, 2)).toUpperCase()}
          </div>
        )}
      </div>

      <div className="relative flex-1 min-w-0 p-3.5 flex flex-col">
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {working && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange/70 opacity-70" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${working ? "bg-[#d27b53]" : "bg-black/20"}`}
            />
          </span>
          <span
            className={`text-[9.5px] font-bold uppercase tracking-[0.12em] ${working ? "text-[#a6522d]" : "text-ink-4"}`}
          >
            {working ? "Working" : "Queued"}
          </span>
        </div>

        <div className="pr-16">
          <div className="text-[15px] font-extrabold tracking-[-0.015em] leading-tight text-ink">
            <AgentName name={recipeAgent.name} />
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: accent }}>
            {recipeAgent.role}
          </div>
        </div>

        <p className="text-[12px] text-ink-3 mt-1.5 leading-snug">
          {recipeAgent.action}
        </p>

        <div className="mt-2 h-[3px] bg-black/8 rounded-full overflow-hidden">
          <motion.div
            key={`${rowKey}-${index}-${working}`}
            initial={{ width: "0%" }}
            animate={{ width: working ? "100%" : "0%" }}
            transition={{ duration: working ? 2.1 : 0.3, ease: "linear" }}
            className="h-full bg-[#d27b53] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Inline SVG illustrations ───────────────────────────────────────────── */
function IllustrationBase({ size = 72, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {children}
    </svg>
  );
}

function StackIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <ellipse cx="36" cy="52" rx="22" ry="6" fill="#FFEADB" />
      <rect x="14" y="36" width="44" height="10" rx="3" fill="#FF6A2F" />
      <rect x="14" y="24" width="44" height="10" rx="3" fill="#FFA577" />
      <rect x="14" y="12" width="44" height="10" rx="3" fill="#FFC9AB" />
    </IllustrationBase>
  );
}

function SearchIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="10" y="14" width="34" height="44" rx="3" fill="#FFEADB" />
      <rect x="16" y="22" width="22" height="2" rx="1" fill="#FFA577" />
      <rect x="16" y="28" width="18" height="2" rx="1" fill="#FFA577" />
      <rect x="16" y="34" width="20" height="2" rx="1" fill="#FFA577" />
      <circle cx="46" cy="44" r="12" stroke="#FF6A2F" strokeWidth="4" fill="white" />
      <line x1="55" y1="52" x2="62" y2="60" stroke="#FF6A2F" strokeWidth="4" strokeLinecap="round" />
    </IllustrationBase>
  );
}

function GaugeIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="8" y="14" width="56" height="40" rx="4" fill="#FFEADB" />
      <path d="M20 44 A16 16 0 0 1 52 44" stroke="#FFC9AB" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M20 44 A16 16 0 0 1 38 28" stroke="#FF6A2F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="44" r="3" fill="#9C3A11" />
      <line x1="36" y1="44" x2="44" y2="34" stroke="#9C3A11" strokeWidth="2" strokeLinecap="round" />
    </IllustrationBase>
  );
}

function CalendarIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="12" y="16" width="48" height="44" rx="4" fill="#FFEADB" />
      <rect x="12" y="16" width="48" height="12" rx="4" fill="#FF6A2F" />
      <rect x="20" y="10" width="4" height="12" rx="1" fill="#9C3A11" />
      <rect x="48" y="10" width="4" height="12" rx="1" fill="#9C3A11" />
      <circle cx="24" cy="38" r="2.5" fill="#FFA577" />
      <circle cx="36" cy="38" r="2.5" fill="#FFA577" />
      <circle cx="48" cy="38" r="2.5" fill="#FF6A2F" />
      <circle cx="24" cy="48" r="2.5" fill="#FFA577" />
      <circle cx="36" cy="48" r="2.5" fill="#FFA577" />
      <circle cx="48" cy="48" r="2.5" fill="#FFA577" />
    </IllustrationBase>
  );
}

function FolderIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path d="M8 22 L8 54 A4 4 0 0 0 12 58 L60 58 A4 4 0 0 0 64 54 L64 26 A4 4 0 0 0 60 22 L32 22 L28 16 L12 16 A4 4 0 0 0 8 20 Z" fill="#FFC9AB" />
      <rect x="16" y="30" width="40" height="22" rx="2" fill="white" />
      <rect x="22" y="36" width="20" height="2" rx="1" fill="#FF6A2F" />
      <rect x="22" y="42" width="28" height="2" rx="1" fill="#FFA577" />
    </IllustrationBase>
  );
}

function ShieldIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path d="M36 10 L56 18 L56 36 C56 48 46 56 36 62 C26 56 16 48 16 36 L16 18 Z" fill="#FFEADB" stroke="#FF6A2F" strokeWidth="2" />
      <path d="M26 36 L33 43 L46 28" stroke="#FF6A2F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </IllustrationBase>
  );
}

function ChatBubbleIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path d="M10 18 L52 18 A4 4 0 0 1 56 22 L56 44 A4 4 0 0 1 52 48 L28 48 L18 58 L18 48 L14 48 A4 4 0 0 1 10 44 Z" fill="#FFC9AB" />
      <circle cx="24" cy="33" r="2.5" fill="#9C3A11" />
      <circle cx="33" cy="33" r="2.5" fill="#9C3A11" />
      <circle cx="42" cy="33" r="2.5" fill="#9C3A11" />
    </IllustrationBase>
  );
}

function TargetIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <circle cx="36" cy="36" r="24" fill="#FFEADB" />
      <circle cx="36" cy="36" r="16" fill="#FFC9AB" />
      <circle cx="36" cy="36" r="8" fill="#FF6A2F" />
      <circle cx="36" cy="36" r="3" fill="white" />
    </IllustrationBase>
  );
}

function LightbulbIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path d="M36 10 C26 10 20 17 20 26 C20 32 24 37 27 41 L27 48 L45 48 L45 41 C48 37 52 32 52 26 C52 17 46 10 36 10 Z" fill="#FFEADB" stroke="#FF6A2F" strokeWidth="2" />
      <rect x="28" y="50" width="16" height="4" rx="1" fill="#FFA577" />
      <rect x="30" y="56" width="12" height="3" rx="1" fill="#FFA577" />
      <path d="M30 28 L36 34 L42 28" stroke="#FF6A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </IllustrationBase>
  );
}

function ClipboardIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="14" y="12" width="44" height="50" rx="4" fill="#FFEADB" />
      <rect x="24" y="8" width="24" height="10" rx="2" fill="#FF6A2F" />
      <rect x="22" y="26" width="4" height="4" rx="1" fill="#FFA577" />
      <rect x="30" y="27" width="20" height="2" rx="1" fill="#FFA577" />
      <rect x="22" y="36" width="4" height="4" rx="1" fill="#FFA577" />
      <rect x="30" y="37" width="20" height="2" rx="1" fill="#FFA577" />
      <rect x="22" y="46" width="4" height="4" rx="1" fill="#FF6A2F" />
      <rect x="30" y="47" width="20" height="2" rx="1" fill="#FFA577" />
    </IllustrationBase>
  );
}

function BookIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="10" y="14" width="52" height="42" rx="3" fill="#FFC9AB" />
      <rect x="16" y="20" width="18" height="30" rx="1" fill="white" />
      <rect x="38" y="20" width="18" height="30" rx="1" fill="white" />
      <rect x="20" y="26" width="10" height="1.5" fill="#FF6A2F" />
      <rect x="20" y="30" width="8" height="1.5" fill="#FFA577" />
      <rect x="42" y="26" width="10" height="1.5" fill="#FF6A2F" />
      <rect x="42" y="30" width="8" height="1.5" fill="#FFA577" />
    </IllustrationBase>
  );
}

function PulseIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="8" y="22" width="56" height="28" rx="4" fill="#FFEADB" />
      <path d="M12 36 L22 36 L26 26 L32 46 L38 30 L44 42 L50 36 L60 36" stroke="#FF6A2F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

function BulkUploadIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path d="M36 10 L36 26" stroke="#FF6A2F" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 18 L36 10 L44 18" stroke="#FF6A2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="14" y="34" width="44" height="8" rx="2" fill="#FFC9AB" />
      <rect x="14" y="44" width="44" height="8" rx="2" fill="#FFA577" />
      <rect x="14" y="54" width="44" height="8" rx="2" fill="#FF6A2F" />
      <circle cx="19" cy="38" r="1.2" fill="#9C3A11" />
      <circle cx="19" cy="48" r="1.2" fill="#9C3A11" />
      <circle cx="19" cy="58" r="1.2" fill="#FFEADB" />
    </IllustrationBase>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4.5 — STATS BAND
   ────────────────────────────────────────────────────────────────────────── */
function StatsBand() {
  const stats = [
    {
      value: "50%",
      label: "Faster hiring",
      description: "Sourcing and screening compressed from weeks to days across every role.",
    },
    {
      value: "4×",
      label: "Faster lead engagement",
      description: "Candidates hear back within minutes instead of sitting in silent pipelines.",
    },
    {
      value: "24 Hours",
      label: "Onboarding TAT",
      description: "Offer to day-one readiness in a single working day, every new hire.",
    },
  ];

  return (
    <section className="relative py-16 md:py-20 px-6 md:px-14 bg-white">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 md:mb-12 max-w-[980px]">
          <Reveal direction="left" offset={60}>
            <Eyebrow>By the Numbers</Eyebrow>
            <h2
              className="mt-3 text-[28px] md:text-[40px] xl:text-[48px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em] md:whitespace-nowrap"
              style={{ color: INK }}
            >
              Outcomes enterprises actually{" "}
              <span className="text-orange">
                measure
              </span>
              .
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/[0.06] border border-black/[0.06] rounded-[6px] overflow-hidden">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="relative flex flex-col bg-white px-7 py-8 md:px-8 md:py-9"
            >
              <p className="text-[52px] md:text-[58px] font-medium tracking-[-0.05em] leading-none text-[#1a1a1a]">
                {s.value}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-[1px] flex-shrink-0 bg-black/20" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ORANGE_DEEP }}>
                  {s.label}
                </p>
              </div>
              <div className="mt-3 mb-3 w-full h-px bg-black/[0.06]" />
              <p className="text-[13.5px] text-ink-3 leading-[1.55]">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   5 — THE FULL STACK
   ────────────────────────────────────────────────────────────────────────── */
function FullStack() {
  const capabilities = [
    {
      name: "Voice AI",
      icon: <VoiceIcon />,
      description:
        "Agents run conversations in Hindi, English, and 10+ languages. Candidate screening, exit interviews, and engagement pulses. All by voice.",
    },
    {
      name: "WhatsApp-First",
      icon: <ChatIcon />,
      description:
        "Every workflow runs where your workforce already is. No new app to download. No training to deploy. Just WhatsApp.",
    },
    {
      name: "System Integrations",
      icon: <PlugIcon />,
      description:
        "Plugs into your CRM, ATS, HRIS, and LMS. Your workflows. Your data. Your systems. No migration. No disruption.",
    },
  ];

  return (
    <section
      className="relative py-16 md:py-20 px-6 md:px-14"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 md:mb-12 max-w-[760px]">
          <Reveal direction="left" offset={60}>
            <Eyebrow>The Full Stack</Eyebrow>
            <h2
              className="mt-3 text-[28px] md:text-[40px] xl:text-[48px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em]"
              style={{ color: INK }}
            >
              Agents don&apos;t work in{" "}
              <span className="text-orange">
                silos
              </span>
              .
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {capabilities.map((c, i) => (
            <motion.article
              key={c.name}
              className="group relative flex flex-col bg-white rounded-[14px] p-6 md:p-7 border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-14px_rgba(0,0,0,0.12)]"
              style={{ borderColor: "rgba(51,51,51,0.08)" }}
            >
              <div className="relative mb-5">{c.icon}</div>
              <h3
                className="relative text-[19px] md:text-[20px] font-bold leading-[1.25]"
                style={{ color: INK }}
              >
                {c.name}
              </h3>
              <p
                className="relative mt-2.5 text-[14px] leading-[1.55]"
                style={{ color: INK_MUTED }}
              >
                {c.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   6 — FINAL CTA
   ────────────────────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-14 border-t"
      style={{ backgroundColor: "#F5F5F2", borderColor: "rgba(51,51,51,0.08)" }}
    >
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal direction="left" offset={60}>
          <Eyebrow center>Get Started</Eyebrow>
          <h2
            className="mt-5 text-[32px] md:text-[44px] xl:text-[52px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em]"
            style={{ color: INK }}
          >
            See your workforce.{" "}
            <span className="text-orange">
              Intelligently
            </span>
            .
          </h2>
          <p
            className="mt-5 text-[16px] md:text-[17px] leading-[1.55] max-w-[600px] mx-auto"
            style={{ color: INK_MUTED }}
          >
            Book a 15-minute demo. We&apos;ll walk through your first workflow (hiring, onboarding, or retention) mapped to your org&apos;s specific scale.
          </p>
        </Reveal>
        <div className="mt-10 flex flex-col items-center gap-5">
          <CalButton
            source="enterprise-final-cta"
            label="Book a demo"
            className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-orange text-white text-[15px] md:text-[16px] font-semibold transition-all duration-300 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Full Stack icon tiles ──────────────────────────────────────────────── */
function TileBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="6" fill="#FFF5EE" stroke={ORANGE} strokeWidth="1.4" strokeOpacity="0.35" />
      {children}
    </svg>
  );
}

function VoiceIcon() {
  const bars = [
    { x: 8, h: 10 },
    { x: 13, h: 18 },
    { x: 18, h: 24 },
    { x: 23, h: 18 },
    { x: 28, h: 10 },
  ];
  return (
    <TileBase>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={(40 - b.h) / 2} width="3.2" height={b.h} rx="1.6" fill={ORANGE} />
      ))}
    </TileBase>
  );
}

function ChatIcon() {
  return (
    <TileBase>
      <path d="M10 10 L30 10 A3 3 0 0 1 33 13 L33 23 A3 3 0 0 1 30 26 L17 26 L12 30 L13 26 L10 26 A3 3 0 0 1 7 23 L7 13 A3 3 0 0 1 10 10 Z" fill={ORANGE} />
      <circle cx="14" cy="18" r="1.5" fill="#FFF5EE" />
      <circle cx="20" cy="18" r="1.5" fill="#FFF5EE" />
      <circle cx="26" cy="18" r="1.5" fill="#FFF5EE" />
    </TileBase>
  );
}

function PlugIcon() {
  return (
    <TileBase>
      <line x1="11" y1="13" x2="20" y2="26" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="29" y1="13" x2="20" y2="26" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="13" x2="29" y2="13" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11" cy="13" r="3.5" fill={ORANGE} />
      <circle cx="29" cy="13" r="3.5" fill={ORANGE} />
      <circle cx="20" cy="26" r="3.5" fill={ORANGE} />
      <circle cx="11" cy="13" r="1.2" fill="#FFF5EE" />
      <circle cx="29" cy="13" r="1.2" fill="#FFF5EE" />
      <circle cx="20" cy="26" r="1.2" fill="#FFF5EE" />
    </TileBase>
  );
}
