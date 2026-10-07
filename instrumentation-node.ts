import { runPortalMigrations } from "./lib/portal/migrate";
import { seedCatalogues } from "./lib/portal/seed";

/** Node-only start-up work (kept out of instrumentation.ts so the edge bundle never sees `pg`). */
export async function startup() {
  if (process.env.PORTAL_AUTO_MIGRATE !== "1" || !process.env.DATABASE_URL) return;
  try {
    const r = await runPortalMigrations(process.env.DATABASE_URL);
    console.log(`[portal] migrations: ${r.applied.length} applied now, ${r.all.length - r.applied.length} already in place`);
    console.log(`[portal] catalogues: ${(await seedCatalogues()).join("; ")}`);
  } catch (e) {
    console.error("[portal] migrations failed:", (e as Error).message); // keep serving; the error is in the log
  }
}
