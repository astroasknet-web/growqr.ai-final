import { databaseConfigured } from "@/lib/portal/db";
import { available, didDocument, ensureKeyPublished } from "@/lib/portal/passport/credential";

export const dynamic = "force-dynamic";

/** Public key document for passport verification (did:web). Contains only PUBLIC keys. */
export async function GET() {
  if (!databaseConfigured()) return new Response("Not found", { status: 404 });
  try {
    if (available()) await ensureKeyPublished();
    return new Response(JSON.stringify(await didDocument(), null, 2), {
      headers: { "Content-Type": "application/did+json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.error("[well-known] did:", (e as Error).message);
    return new Response("Unavailable", { status: 503 });
  }
}
