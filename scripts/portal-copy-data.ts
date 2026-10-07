/**
 * Copies the portal's data from one Postgres/Supabase database to another (for example from the qrscore Supabase project into the
 * growqr.ai project). Only the tables the portal migrations create are touched; the marketing site's tables are never read or written.
 *
 *   SOURCE_DATABASE_URL=postgres://... DATABASE_URL=postgres://... npx tsx scripts/portal-copy-data.ts --dry-run
 *   SOURCE_DATABASE_URL=postgres://... DATABASE_URL=postgres://... npx tsx scripts/portal-copy-data.ts
 *
 * Rules, chosen so that a mistake cannot destroy anything:
 *  - The target schema must already exist (`npm run portal:migrate` first). Missing tables are reported and skipped.
 *  - A target table that already has rows is SKIPPED, never merged or overwritten (use --truncate-target to empty the portal tables first).
 *  - Parents are copied before children (foreign keys), whole copy runs in one transaction on the target, so it is all or nothing.
 *  - Sessions, sign-in throttle counters and the schema bookkeeping table are not copied (everyone simply logs in again).
 *  - Identity/serial counters are moved past the largest copied id.
 *
 * Files are not in the database: copy the Storage buckets "resumes" and "vault" separately (see CUTOVER.md).
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const SKIP = new Set(["portal_sessions", "auth_throttle", "schema_meta"]);
const BATCH = 500;

const connect = async (url: string) => {
  const c = new Client({ connectionString: url, ssl: /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined });
  await c.connect();
  return c;
};
const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

/** Tables created by the portal migrations, in the order they are declared. */
function portalTables(): string[] {
  const dir = path.resolve(__dirname, "..", "supabase", "migrations");
  const out: string[] = [];
  for (const f of fs.readdirSync(dir).filter((x) => /^2026\d+_.+\.sql$/.test(x)).sort()) {
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/CREATE TABLE IF NOT EXISTS\s+"?(\w+)"?/gi)) if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** Parents before children, using the foreign keys that exist in the target. */
async function order(c: Client, tables: string[]): Promise<string[]> {
  const fk = (await c.query(
    `SELECT cl.relname AS child, pl.relname AS parent FROM pg_constraint k JOIN pg_class cl ON cl.oid = k.conrelid JOIN pg_class pl ON pl.oid = k.confrelid
     JOIN pg_namespace n ON n.oid = cl.relnamespace WHERE k.contype = 'f' AND n.nspname = 'public'`,
  )).rows as Array<{ child: string; parent: string }>;
  const left = new Set(tables);
  const done: string[] = [];
  while (left.size) {
    const ready = [...left].filter((t) => fk.every((r) => r.child !== t || r.parent === t || !left.has(r.parent)));
    if (!ready.length) { done.push(...left); break; } // a cycle: copy the rest in declared order
    for (const t of ready) { done.push(t); left.delete(t); }
  }
  return done;
}

async function main() {
  const srcUrl = process.env.SOURCE_DATABASE_URL;
  const dstUrl = process.env.DATABASE_URL;
  if (!srcUrl || !dstUrl) throw new Error("Set SOURCE_DATABASE_URL (where the data is now) and DATABASE_URL (where it should go).");
  if (srcUrl === dstUrl) throw new Error("SOURCE_DATABASE_URL and DATABASE_URL are the same database; there is nothing to copy.");
  const dry = process.argv.includes("--dry-run");
  const truncate = process.argv.includes("--truncate-target");
  const src = await connect(srcUrl);
  const dst = await connect(dstUrl);
  try {
    const exists = async (c: Client, t: string) => (await c.query("SELECT to_regclass($1) AS r", [`public.${t}`])).rows[0].r !== null;
    const wanted = portalTables().filter((t) => !SKIP.has(t));
    const tables = await order(dst, wanted);
    const plan: Array<{ t: string; rows: number; action: string }> = [];
    for (const t of tables) {
      if (!(await exists(dst, t))) { plan.push({ t, rows: 0, action: "SKIP (missing in target: run portal:migrate)" }); continue; }
      if (!(await exists(src, t))) { plan.push({ t, rows: 0, action: "SKIP (missing in source)" }); continue; }
      const rows = Number((await src.query(`SELECT COUNT(*) AS n FROM ${q(t)}`)).rows[0].n);
      const have = Number((await dst.query(`SELECT COUNT(*) AS n FROM ${q(t)}`)).rows[0].n);
      plan.push({ t, rows, action: rows === 0 ? "nothing to copy" : have > 0 && !truncate ? `SKIP (target already has ${have} rows)` : "COPY" });
    }
    for (const p of plan) console.log(`${p.action.padEnd(40)} ${String(p.rows).padStart(8)}  ${p.t}`);
    if (dry) { console.log("\nDry run: nothing was written."); return; }

    await dst.query("BEGIN");
    try {
      if (truncate) await dst.query(`TRUNCATE ${plan.filter((p) => !p.action.startsWith("SKIP (missing")).map((p) => q(p.t)).join(", ")} RESTART IDENTITY CASCADE`);
      let copied = 0;
      for (const p of plan.filter((x) => x.action === "COPY" || (truncate && x.rows > 0 && !x.action.startsWith("SKIP (missing")))) {
        let off = 0;
        for (;;) {
          const r = await src.query(`SELECT * FROM ${q(p.t)} ORDER BY 1 LIMIT ${BATCH} OFFSET ${off}`);
          if (!r.rows.length) break;
          await dst.query(`INSERT INTO ${q(p.t)} OVERRIDING SYSTEM VALUE SELECT * FROM json_populate_recordset(null::${q(p.t)}, $1::json)`, [JSON.stringify(r.rows)]);
          off += r.rows.length;
          copied += r.rows.length;
        }
        // move the counters past what was copied
        const seqs = (await dst.query(
          `SELECT a.attname AS col, pg_get_serial_sequence($1, a.attname) AS seq FROM pg_attribute a WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped`,
          [`public.${p.t}`],
        )).rows.filter((x) => x.seq);
        for (const s of seqs) await dst.query(`SELECT setval($1, COALESCE((SELECT MAX(${q(s.col)}) FROM ${q(p.t)}), 1), (SELECT COUNT(*) > 0 FROM ${q(p.t)}))`, [s.seq]);
      }
      await dst.query("COMMIT");
      console.log(`\nCopied ${copied} rows.`);
    } catch (e) {
      await dst.query("ROLLBACK");
      throw e;
    }
  } finally {
    await src.end();
    await dst.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
