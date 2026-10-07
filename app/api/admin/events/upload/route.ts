import { NextRequest, NextResponse } from "next/server";
import {
  uploadEventAsset,
  deleteEventAssetByUrl,
} from "@/features/events/services/eventAssets.service";
import { getAdminUser } from "@/lib/auth/admin";

async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const purposeRaw = (form.get("purpose") as string) || "misc";
    const hint = (form.get("hint") as string) || "asset";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const purpose: "posters" | "speakers" | "misc" =
      purposeRaw === "posters" || purposeRaw === "speakers"
        ? purposeRaw
        : "misc";

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadEventAsset({
      buffer,
      contentType: file.type,
      purpose,
      filenameHint: hint,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url." }, { status: 400 });
    }
    const ok = await deleteEventAssetByUrl(url);
    return NextResponse.json({ ok });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
