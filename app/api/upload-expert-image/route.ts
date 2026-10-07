import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { hasMagicBytes, imageKindFromMime } from "@/lib/file-signature";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const BUCKET = "expert-media";

export async function POST(req: NextRequest) {
  // Unauthenticated route writing to storage with the service-role key —
  // limit before reading the body so a flood can't stream 5 MB per request.
  const limit = await rateLimit(req, { key: "upload-expert-image", limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  // Demo mode (no Supabase configured): no bucket to write to. Return a
  // placeholder so the intake form can proceed; nothing is stored.
  if (!isSupabaseConfigured()) return NextResponse.json({ path: "demo-preview", url: null });

  try {
    const formData = await req.formData();

    // Bot gate, before the file is touched. Same reasoning as upload-resume:
    // this writes to storage with the service-role key and the per-instance
    // rate limit leaks across serverless cold starts.
    const token = formData.get("token");
    if (!(await verifyTurnstile(typeof token === "string" ? token : undefined, "upload-expert-image"))) {
      return NextResponse.json(
        { error: "Security verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const file = formData.get("file") as File | null;
    // Optional sub-folder so portraits and reviewer avatars stay tidy.
    const kind = (formData.get("kind") as string | null)?.replace(/[^a-z0-9-]/gi, "") || "misc";

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: "Only PNG, JPG, or WebP images are accepted." }, { status: 400 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });

    const bytes = await file.arrayBuffer();
    // Content-Type is client-supplied and spoofable; confirm the actual bytes
    // match the declared image type before writing to storage.
    const sigKind = imageKindFromMime(file.type);
    if (!sigKind || !hasMagicBytes(bytes, sigKind))
      return NextResponse.json({ error: "Only PNG, JPG, or WebP images are accepted." }, { status: 400 });

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${kind}/${timestamp}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Supabase image upload error:", error);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    // Signed URL valid for 1 year — used for previews and in the saved submission.
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    // Return null (not an unsigned public URL) if signing fails; `path` is the
    // stored source of truth and the caller falls back to it.
    if (!signed?.signedUrl) console.warn("upload-expert-image: signed URL creation failed for", path);
    const url = signed?.signedUrl ?? null;

    return NextResponse.json({ path, url });
  } catch (err) {
    console.error("Expert image upload route error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
