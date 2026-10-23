/**
 * Load lib/market/data/courses.json (the editable course catalogue) into the database. Safe to run repeatedly.
 *
 *   DATABASE_URL=mysql://user:password@host:3306/database npx tsx scripts/courses-sync.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { closePool, databaseConfigured } from "../lib/portal/db";
import { sync } from "../lib/market/courses";

async function main(): Promise<void> {
  if (!databaseConfigured()) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const file = path.resolve(__dirname, "../lib/market/data/courses.json");
  const n = await sync(JSON.parse(readFileSync(file, "utf8")));
  console.log(`Synced ${n} courses.`);
  await closePool();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
