import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { validateIntake, type IntakeForm } from "@/features/experts/intake/config";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
// Drop empty repeated rows so the saved JSON is clean.
const cleanStrings = (arr: unknown) =>
  Array.isArray(arr) ? arr.map((x) => s(x)).filter(Boolean) : [];

// Session duration, price, and supported AI agents are defined by GrowQR when a
// submission is promoted to a live profile — they are NOT collected on the form.
// These placeholders only satisfy the table's NOT NULL constraints.
const GROWQR_SESSION_DURATION = "30 min";
const GROWQR_SESSION_PRICE = "₹2,000";

export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "expert-intake", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  try {
    const data: Partial<IntakeForm> & { token?: string } = await req.json();

    // Demo mode (no Supabase configured): accept without verifying/persisting.
    if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

    // Bot gate, before the insert and before any validation work. Same
    // fail-closed contract as every other public form (lib/turnstile.ts): a
    // missing secret or a rejected token is a 403, never a silent pass.
    if (!(await verifyTurnstile(data.token, "expert-intake"))) {
      return NextResponse.json(
        { error: "Security verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    // Validate required fields + every hard character limit + count ranges.
    const errors = validateIntake(data);
    if (errors.length) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("expert_submissions")
      .insert({
        name: s(data.name),
        display_name: s(data.displayName) || null,
        email: s(data.email).toLowerCase(),
        role: s(data.role),
        tag: s(data.tag),
        country: s(data.country),
        location: s(data.location) || null,
        persona: s(data.persona) || null,
        years_experience: Number(data.yearsExperience) || 0,
        session_duration: GROWQR_SESSION_DURATION,
        price: GROWQR_SESSION_PRICE,
        headline: s(data.headline),
        bio: s(data.bio),
        intro: s(data.intro),
        about: s(data.about),
        image_url: s(data.image),
        trusted_by_label: s(data.trustedByLabel) || null,
        expertise: cleanStrings(data.expertise),
        skills: cleanStrings(data.skills),
        industries: cleanStrings(data.industries),
        languages: cleanStrings(data.languages),
        certifications: cleanStrings(data.certifications),
        awards: cleanStrings(data.awards),
        trusted_by: cleanStrings(data.trustedBy),
        work_experience: (data.workExperience ?? [])
          .filter((w) => s(w.company) || s(w.position))
          .map((w) => ({
            company: s(w.company),
            position: s(w.position),
            duration: s(w.duration),
          })),
        education: (data.education ?? [])
          .filter((e) => s(e.degree) || s(e.school))
          .map((e) => ({ degree: s(e.degree), school: s(e.school), year: s(e.year) })),
        what_you_get: (data.whatYouGet ?? [])
          .filter((w) => s(w.title) || s(w.description))
          .map((w) => ({ title: s(w.title), description: s(w.description) })),
        stats: (data.stats ?? [])
          .filter((st) => s(st.value) || s(st.label))
          .map((st) => ({ value: s(st.value), label: s(st.label) })),
        reviews: (data.reviews ?? [])
          .filter((r) => s(r.name) || s(r.text))
          .map((r) => ({
            name: s(r.name),
            role: s(r.role),
            rating: Number(r.rating) || 5,
            text: s(r.text),
            image: s(r.image) || null,
          })),
        faq: (data.faq ?? [])
          .filter((f) => s(f.q) || s(f.a))
          .map((f) => ({ q: s(f.q), a: s(f.a) })),
        // Only LinkedIn is collected; stored in the shared socials shape.
        socials: s(data.linkedinUrl)
          ? [{ label: "LinkedIn", href: s(data.linkedinUrl), icon: "linkedin" }]
          : [],
      })
      .select("id")
      .single();

    if (error) {
      console.error("Expert submission insert error:", error);
      return NextResponse.json(
        { error: "Failed to save your submission. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: row?.id });
  } catch (error: unknown) {
    console.error("Expert intake submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 },
    );
  }
}
