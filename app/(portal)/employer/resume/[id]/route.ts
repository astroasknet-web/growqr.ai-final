import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import * as apps from "@/lib/market/applications";
import * as storage from "@/lib/market/storage";

export const dynamic = "force-dynamic";

const plain = (body: string, status: number) => new NextResponse(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });

// Only the applicant, the employer who owns the posting, or an admin may open a resume.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!databaseConfigured()) return plain("Not available.", 503);
  const me = (await getSession())?.user;
  if (!me) return plain("Not found.", 404);
  const { id } = await params;
  const app = /^\d{1,9}$/.test(id) ? await apps.withOwner(Number(id)) : null;
  const allowed = app && (me.role === "admin" || (me.role === "student" && Number(app.student_id) === me.id) || (me.role === "employer" && Number(app.owner_user_id) === me.id));
  if (!app || !allowed) return plain("Not found.", 404);
  if (me.role === "employer") await apps.markViewed(Number(app.id), me.id);

  const base = { "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" };
  const file = app.resume_file ? String(app.resume_file).replace(/^.*[\\/]/, "") : "";
  if (file) {
    const bytes = await storage.get("resumes", file);
    if (!bytes) return plain("File is no longer available.", 404);
    const ext = (file.split(".").pop() ?? "").toLowerCase();
    const type = ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const dl = String(app.resume_name || "resume." + ext).replace(/[^\w.\-]+/g, "_");
    return new NextResponse(new Uint8Array(bytes), { headers: { ...base, "Content-Type": type, "Content-Disposition": `attachment; filename="${dl}"`, "Content-Length": String(bytes.length) } });
  }
  // Passport resume snapshot: served as plain text so it can never run as HTML.
  return new NextResponse(String(app.resume_text ?? ""), { headers: { ...base, "Content-Type": "text/plain; charset=utf-8" } });
}
