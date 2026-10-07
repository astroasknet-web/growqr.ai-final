import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Mic,
  GraduationCap,
  Users,
  Route,
  Briefcase,
  FolderKanban,
  CalendarDays,
} from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa6";
import type { ComponentType } from "react";

/** Accent palette — every supporting feature uses a different colour so the
 *  eye can scan the section quickly. Orange stays the GrowQR primary. */
export type Accent = "purple" | "blue" | "green" | "orange" | "coral";

export const ACCENT_FG: Record<Accent, string> = {
  purple: "#7C3AED",
  blue: "#2563EB",
  green: "#16A34A",
  orange: "#FF6A2F",
  coral: "#FB5A5A",
};

type IconType = LucideIcon | ComponentType<{ className?: string }>;

export type Feature = {
  icon: IconType;
  title: string;
  desc: string;
  accent: Accent;
};

/** Left rail — guidance & skill-building, top → bottom. */
export const LEFT_FEATURES: Feature[] = [
  {
    icon: Bot,
    title: "AI Career Coach",
    desc: "Smart insights. Better decisions. Faster growth.",
    accent: "purple",
  },
  {
    icon: Mic,
    title: "Interview Coach",
    desc: "Speak with clarity. Connect with confidence. Lead with impact.",
    accent: "blue",
  },
  {
    icon: GraduationCap,
    title: "Skill Coach",
    desc: "Build in-demand skills. Solve real-world problems. Stay future ready.",
    accent: "green",
  },
];

/** Right rail — mentorship & visibility, top → bottom. */
export const RIGHT_FEATURES: Feature[] = [
  {
    icon: Users,
    title: "Expert Mentors",
    desc: "Learn from experts. Get guidance. Grow faster.",
    accent: "purple",
  },
  {
    icon: FaLinkedinIn,
    title: "LinkedIn Review",
    desc: "Stand out. Get noticed. Create impact.",
    accent: "blue",
  },
  {
    icon: Route,
    title: "Career Roadmap",
    desc: "Tailored for you. Adaptive for your goals.",
    accent: "orange",
  },
];

export type Opportunity = { icon: IconType; label: string; accent: Accent };

/** Bottom panel — icon + label only, no descriptions. */
export const OPPORTUNITIES: Opportunity[] = [
  { icon: Briefcase, label: "Jobs", accent: "coral" },
  { icon: FolderKanban, label: "Projects", accent: "purple" },
  { icon: Users, label: "Community", accent: "green" },
  { icon: CalendarDays, label: "Events", accent: "orange" },
];
