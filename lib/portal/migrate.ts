import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

/**
 * Applies the portal's database migrations (supabase/migrations/2026*.sql) that this database has not seen yet, in order, each in its own
 * transaction, recording them in schema_meta as "migration:<file>". Safe to run repeatedly and from several servers at once (advisory lock).
 * Used by `npm run portal:migrate` and, when PORTAL_AUTO_MIGRATE=1, once at server start.
 */
export interface MigrationReport { applied: string[]; pending: string[]; all: string[] }

export async function runPortalMigrations(url: string, opts: { statusOnly?: boolean; dir?: string } = {}): Promise<MigrationReport> {
  const dir = opts.dir ?? path.join(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => /^2026\d+_.+\.sql$/.test(f)).sort();
  const c = new Client({ connectionString: url, ssl: /@(localhost|127\.0\.0\.1)(:|\/)/.test(url) ? undefined : { rejectUnauthorized: false } });
  await c.connect();
  try {
    await c.query("SELECT pg_advisory_lock(727001)");
    await c.query("CREATE TABLE IF NOT EXISTS schema_meta (k varchar(120) NOT NULL PRIMARY KEY, v varchar(255) NOT NULL)");
    const done = new Set((await c.query("SELECT k FROM schema_meta WHERE k LIKE 'migration:%'")).rows.map((r) => String(r.k).slice(10)));
    const pending = files.filter((f) => !done.has(f));
    const applied: string[] = [];
    if (!opts.statusOnly) {
      for (const f of pending) {
        await c.query("BEGIN");
        try {
          await c.query(fs.readFileSync(path.join(dir, f), "utf8"));
          await c.query("INSERT INTO schema_meta (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [`migration:${f}`, new Date().toISOString()]);
          await c.query("COMMIT");
          applied.push(f);
        } catch (e) {
          await c.query("ROLLBACK");
          throw new Error(`${f}: ${(e as Error).message}`);
        }
      }
    }
    return { applied, pending: opts.statusOnly ? pending : [], all: files };
  } finally {
    await c.query("SELECT pg_advisory_unlock(727001)").catch(() => undefined);
    await c.end();
  }
}
