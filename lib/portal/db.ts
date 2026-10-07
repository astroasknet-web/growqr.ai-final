import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

/**
 * Direct Postgres access for the portal (accounts, students, CRM, ...), the same database the PHP app uses.
 *
 * Why not the Supabase REST client: these tables have row level security ON with no policies on purpose (they are never
 * meant to be reachable with the public key). The server connects as the database role, exactly like the PHP app did.
 *
 * Environment:
 *   DATABASE_URL    postgres://user:password@host:port/db  (Supabase: the pooler "session mode" or direct string)
 *   DATABASE_SSL    "disable" for a local database; "verify" to fully verify the server certificate; default: encrypted, not verified
 *   DB_TIMEZONE     session time zone, default UTC. Must equal the zone the PHP app uses while both run on the same data.
 */

// "timestamp without time zone" comes back as the plain string the database holds (no silent local-time conversion).
types.setTypeParser(1114, (v) => v);
// "date" columns (deadlines, birth dates) likewise come back as plain YYYY-MM-DD strings, not JavaScript Dates in the server time zone.
types.setTypeParser(1082, (v) => v);
// bigint (COUNT(*), identity ids) as numbers: our values are far below 2^53.
types.setTypeParser(20, (v) => parseInt(v, 10));

type Row = QueryResultRow;
const g = globalThis as unknown as { __portalPool?: Pool };

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function pool(): Pool {
  if (g.__portalPool) return g.__portalPool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const local = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
  const mode = process.env.DATABASE_SSL ?? (local ? "disable" : "require");
  const p = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: mode === "disable" ? false : mode === "verify" ? true : { rejectUnauthorized: false },
  });
  p.on("error", (e) => console.error("[portal-db] idle client error:", e.message));
  g.__portalPool = p;
  return p;
}

const initialised = new WeakSet<PoolClient>();

/** Borrow a connection, making sure its session time zone is set once (a startup option would not survive a connection pooler). */
async function withClient<R>(fn: (c: PoolClient) => Promise<R>): Promise<R> {
  const c = await pool().connect();
  try {
    if (!initialised.has(c)) {
      const tz = (process.env.DB_TIMEZONE ?? "UTC").replace(/[^A-Za-z0-9_/+-]/g, "");
      await c.query(`SET TIME ZONE '${tz}'`);
      initialised.add(c);
    }
    return await fn(c);
  } finally {
    c.release();
  }
}

/** Run a statement and return all rows. Use $1, $2 ... placeholders. */
export async function all<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await withClient((c) => c.query<T>(sql, params))).rows;
}

export async function one<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await all<T>(sql, params))[0] ?? null;
}

/** First column of the first row, or null. */
export async function val<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
  const r = await withClient((c) => c.query({ text: sql, values: params, rowMode: "array" }));
  const v = r.rows[0]?.[0];
  return (v === undefined ? null : v) as T | null;
}

/** Run a statement, returning the number of affected rows. */
export async function run(sql: string, params: unknown[] = []): Promise<number> {
  return (await withClient((c) => c.query(sql, params))).rowCount ?? 0;
}

/** Run several statements atomically. The callback gets a client; throw to roll back. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (c) => {
    try {
      await c.query("BEGIN");
      const out = await fn(c);
      await c.query("COMMIT");
      return out;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => undefined);
      throw e;
    }
  });
}

/** For tests and shutdown. */
export async function closePool(): Promise<void> {
  if (g.__portalPool) {
    await g.__portalPool.end();
    g.__portalPool = undefined;
  }
}
