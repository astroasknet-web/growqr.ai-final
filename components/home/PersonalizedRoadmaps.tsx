"use client";

import { useHomeMode } from "@/components/layout/HomeMode";
import SeekerRoadmaps from "./SeekerRoadmaps";
import BusinessRoadmaps from "./BusinessRoadmaps";

/** Switches between the seeker and business roadmap sections based on the
 *  Hero's Individual/Enterprise toggle — each mode now has its own dedicated
 *  component instead of one shared component branching internally. */
export default function PersonalizedRoadmaps() {
  const { mode } = useHomeMode();
  return mode === "enterprise" ? <BusinessRoadmaps /> : <SeekerRoadmaps />;
}
