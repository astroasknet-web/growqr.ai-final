import "server-only";
import { createAdminClient } from "@/lib/supabase-server";

const BUCKET = "event-assets";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  url: string;
  path: string;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "bin";
  }
}

/**
 * Uploads a binary buffer to the event-assets bucket and returns the public URL.
 * `purpose` controls the folder ("posters" / "speakers" / "misc").
 */
export async function uploadEventAsset(opts: {
  buffer: Buffer | Uint8Array;
  contentType: string;
  purpose: "posters" | "speakers" | "misc";
  filenameHint?: string;
}): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(opts.contentType)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP or GIF.");
  }
  if (opts.buffer.byteLength > MAX_BYTES) {
    throw new Error("File is too large. Max size is 10 MB.");
  }

  const admin = createAdminClient();
  const ext = extFromMime(opts.contentType);
  const hint = (opts.filenameHint ?? "asset")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "asset";
  const path = `${opts.purpose}/${hint}-${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, opts.buffer, {
      contentType: opts.contentType,
      upsert: false,
    });
  if (error) {
    console.error("uploadEventAsset error:", error);
    throw new Error("Upload failed. Please try again.");
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Deletes an asset from the event-assets bucket given its public URL.
 * Returns true if deleted (or already gone). Silent no-op for paths outside the bucket.
 */
export async function deleteEventAssetByUrl(url: string): Promise<boolean> {
  if (!url) return false;
  // Extract path after `/storage/v1/object/public/event-assets/`
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return false;
  const path = url.slice(idx + marker.length).split("?")[0];
  if (!path) return false;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("deleteEventAssetByUrl error:", error);
    return false;
  }
  return true;
}
