import { databaseConfigured } from "@/lib/portal/db";
import { available, ensureKeyPublished, jwks } from "@/lib/portal/passport/credential";

export const dynamic = "force-dynamic";

/** Public keys as a JWK Set, for any JOSE library. Contains only PUBLIC keys. */
export async function GET() {
  if (!databaseConfigured()) return new Response("Not found", { status: 404 });
  try {
    if (available()) await ensureKeyPublished();
    return new Response(JSON.stringify(await jwks(), null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.error("[well-known] jwks:", (e as Error).message);
    return new Response("Unavailable", { status: 503 });
  }
}
