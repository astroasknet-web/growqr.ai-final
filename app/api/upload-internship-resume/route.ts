import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { hasMagicBytes } from "@/lib/file-signature";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "internship-resumes";

export async function POST(req: NextRequest) {
  // Unauthenticated route writing to storage with the service-role key,
  // limit before reading the body so a flood can't stream 10 MB per request.
  const limit = await rateLimit(req, { key: "upload-internship-resume", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  // Demo mode (no Supabase configured): no bucket to write to. Return a
  // placeholder so the apply form can proceed; nothing is stored.
  if (!isSupabaseConfigured()) return NextResponse.json({ path: "demo-preview", url: null });

  try {
    const formData = await req.formData();

    const token = formData.get("token");
    if (!(await verifyTurnstile(typeof token === "string" ? token : undefined, "upload-internship-resume"))) {
      return NextResponse.json(
        { error: "Security verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.type !== "application/pdf")
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: "File must be under 10 MB." }, { status: 400 });

    const bytes = await file.arrayBuffer();
    // Content-Type is client-supplied and spoofable; confirm the actual bytes
    // are a PDF before writing to storage.
    if (!hasMagicBytes(bytes, "pdf"))
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${timestamp}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    // Short-lived signed URL just for the applicant's own "uploaded" preview.
    // the DB stores `path`, not this URL, so admin views always resolve a
    // fresh signed URL instead of one that can eventually expire.
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60);

    return NextResponse.json({ path, url: signed?.signedUrl ?? null });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
