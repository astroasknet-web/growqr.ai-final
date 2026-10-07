/**
 * Applies the portal's database migrations (supabase/migrations/2026*.sql) that this database has not seen yet, in order, each in its own
 * transaction, and records them in schema_meta as "migration:<file>" (the same bookkeeping the PHP app used, so both apps agree).
 * The marketing site's own migrations (0001-0045) are managed with the Supabase CLI and are not touched here.
 *
 *   DATABASE_URL=postgres://... npx tsx scripts/portal-migrate.ts            apply what is pending
 *   DATABASE_URL=postgres://... npx tsx scripts/portal-migrate.ts --status   only list applied / pending
 *
 * Every portal migration is idempotent (CREATE ... IF NOT EXISTS), so running it against a database the PHP app already migrated is safe.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const statusOnly = process.argv.includes("--status");
  const dir = path.resolve(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => /^2026\d+_.+\.sql$/.test(f)).sort();
  const c = new Client({ connectionString: url, ssl: /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined });
  await c.connect();
  try {
    await c.query("CREATE TABLE IF NOT EXISTS schema_meta (k varchar(120) NOT NULL PRIMARY KEY, v varchar(255) NOT NULL)");
    const done = new Set((await c.query("SELECT k FROM schema_meta WHERE k LIKE 'migration:%'")).rows.map((r) => String(r.k).slice(10)));
    const pending = files.filter((f) => !done.has(f));
    console.log(`${files.length - pending.length} applied, ${pending.length} pending`);
    for (const f of files) console.log(`${done.has(f) ? "  applied " : "  PENDING "}${f}`);
    if (statusOnly) return;
    for (const f of pending) {
      const sql = fs.readFileSync(path.join(dir, f), "utf8");
      await c.query("BEGIN");
      try {
        await c.query(sql);
        await c.query("INSERT INTO schema_meta (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [`migration:${f}`, new Date().toISOString()]);
        await c.query("COMMIT");
        console.log(`applied ${f}`);
      } catch (e) {
        await c.query("ROLLBACK");
        throw new Error(`${f}: ${(e as Error).message}`);
      }
    }
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
