import type { LucideIcon } from "lucide-react";
import { Users, Megaphone, Mic2, PenLine, Sprout, Radio, Trophy, Medal, Star } from "lucide-react";

export const APPLICATIONS_OPEN = true;

export const SEATS_TOTAL = 100;
export const SEATS_TAKEN = 13;
export const SEATS_REMAINING = SEATS_TOTAL - SEATS_TAKEN;

export type WhyCard = { num: string; title: string; copy: string; stat: string };
export type RoleCard = { num: string; icon: LucideIcon; title: string; copy: string };
export type RewardCard = { badge: string; title: string; copy: string; icon: LucideIcon };
export type LeaderboardRow = { rank: number; name: string; college: string; tier: string };
export type BadgeTier = { icon: LucideIcon; title: string; range: string; tier: string };
export type EligibilityItem = { label: string; title: string; copy: string };

export const whyCards: WhyCard[] = [
  {
    num: "01",
    title: "Real World Exposure",
    copy: "Organize events, run campaigns & solve problems without just promoting a brand.",
    stat: "12 events organized",
  },
  {
    num: "02",
    title: "AI Powered Growth",
    copy: "Early access to GrowQR's agentic AI, career analytics, and personalized insights before anyone else.",
    stat: "+18 RQ points · 90 days",
  },
  {
    num: "03",
    title: "Leadership Experience",
    copy: "Lead your campus community, drive initiatives, and put meaningful experience on your resume.",
    stat: "400+ peers reached",
  },
  {
    num: "04",
    title: "Elite Networking",
    copy: "Connect with ambitious students and gain access to industry professionals and startup founders.",
    stat: "5+ countries · 100 ambassadors",
  },
];

export const roleCards: RoleCard[] = [
  { num: "01 Community", icon: Users, title: "Build Community", copy: "Build an engaged student network on campus." },
  { num: "02 Awareness", icon: Megaphone, title: "Drive Awareness", copy: "Drive campus visibility through strategic engagement." },
  { num: "03 Leadership", icon: Mic2, title: "Lead Initiatives", copy: "Own campus events, campaigns, and ideas." },
  { num: "04 Content", icon: PenLine, title: "Create Content", copy: "Share stories and experiences on social." },
  { num: "05 Growth", icon: Sprout, title: "Enable Growth", copy: "Help peers discover and grow with GrowQR." },
  { num: "06 Voice", icon: Radio, title: "Be the Voice", copy: "Share campus insights and feedback with us." },
];

export const rewardCards: RewardCard[] = [
  { icon: Sprout, badge: "Getting Started", title: "GrowQR Swag Kit", copy: "T-shirts, laptop bag, notebook, cool cap, sipper & stickers." },
  { icon: Radio, badge: "Active Ambassadors", title: "Public Recognition", copy: "Get featured on GrowQR's website and social platforms." },
  { icon: Users, badge: "Based on Engagement", title: "Exclusive Events", copy: "Access invite-only mixers, global conferences & meetups." },
  { icon: Trophy, badge: "High Performers", title: "Monetary Rewards", copy: "Performance-based incentives for top contributors." },
  { icon: Mic2, badge: "Proactive Ambassadors", title: "Event Sponsorship", copy: "Get support and backing to host impactful events." },
  { icon: Medal, badge: "Program Completion", title: "Certificate + LoR", copy: "Official recognition from an AI-powered career platform." },
];

export const leaderboard: LeaderboardRow[] = [
  { rank: 1, name: "Ananya Sharma", college: "BIT Mesra", tier: "Gold" },
  { rank: 2, name: "Riya Verma", college: "IPU Delhi", tier: "Silver" },
  { rank: 3, name: "Arjun Mehta", college: "DTU", tier: "Bronze" },
  { rank: 4, name: "Geeta Iyer", college: "Delhi University", tier: "Rising" },
  { rank: 5, name: "Karan Singh", college: "VIT Vellore", tier: "Rising" },
];

export const badgeTiers: BadgeTier[] = [
  { icon: Trophy, title: "Gold Performer", range: "Top 1–3 ambassadors", tier: "Tier 1" },
  { icon: Medal, title: "Silver Performer", range: "Top 4–10 ambassadors", tier: "Tier 2" },
  { icon: Medal, title: "Bronze Performer", range: "Top 10–20 ambassadors", tier: "Tier 3" },
  { icon: Star, title: "Rising Star", range: "New joiners on the up", tier: "Newcomer" },
];

export const eligibility: EligibilityItem[] = [
  { label: "18+", title: "Ready to own your impact", copy: "You're 18 or older and serious about taking ownership of what you build on campus." },
  { label: "Enrolled", title: "Currently studying", copy: "Enrolled at any college or university — undergrad, postgrad, any stream." },
  { label: "Campus active", title: "Plugged into clubs & events", copy: "You're active in clubs, events, or your campus peer network." },
  { label: "Growth driven", title: "Enthusiast for growth", copy: "Driven by career growth, leadership, and community building." },
  { label: "Online", title: "Strong hold on LinkedIn and Instagram is a bonus", copy: "A strong hold on LinkedIn and Instagram is a bonus." },
];

export const marqueeItems = [
  "From Learning to Earning",
  "Powered by an AI-Led Community",
  "Building AI-Ready Talent",
  "Campus by Campus",
  "Join · Engage · Grow",
];

export const heroStats = [
  { num: "100", lbl: "Cohort 02 seats" },
  { num: "48hr", lbl: "First task" },
  { num: "∞", lbl: "Career upside" },
];
