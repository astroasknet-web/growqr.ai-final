export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getExpertBySlug, sessionMinutes } from "@/features/experts/data/experts-data";
import { getWeeklyAvailability } from "@/features/experts/services/availability.service";
import { getBookedSlots } from "@/features/experts/services/bookings.service";
import { generateSlots } from "@/features/experts/services/slots";

const EXPERT_TZ = "Asia/Kolkata";

// GET /api/experts/[slug]/availability?startTime=ISO&endTime=ISO&timeZone=...
// Returns: { status: "success", slots: { "YYYY-MM-DD": [{ time: ISO }] } }
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!startTime || !endTime) {
    return NextResponse.json(
      { status: "error", error: "startTime and endTime are required" },
      { status: 400 },
    );
  }

  const expert = getExpertBySlug(slug);
  if (!expert) {
    return NextResponse.json({ status: "error", error: "Expert not found" }, { status: 404 });
  }

  try {
    const sessionMin = sessionMinutes(expert);

    // Slots are rule-based: the standard Mon–Fri working-day grid (with breaks)
    // from the expert's weekly availability rules, minus times already booked in
    // our own bookings table. No per-expert calendar connection or Google
    // free/busy lookup is involved.
    const [rules, bookedStarts] = await Promise.all([
      getWeeklyAvailability(slug),
      getBookedSlots(slug, startTime, endTime),
    ]);

    const slots = generateSlots({
      rules,
      sessionMin,
      rangeStart: startTime,
      rangeEnd: endTime,
      bookedStarts,
      timeZone: EXPERT_TZ,
    });

    return NextResponse.json({ status: "success", available: true, slots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load availability";
    console.error("[experts/availability]", message);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
