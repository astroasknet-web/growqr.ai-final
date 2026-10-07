/**
 * Create (or reset) a staff account: the Node version of qrscore/tools/create-admin.php.
 *
 *   DATABASE_URL=postgres://... npx tsx scripts/portal-create-user.ts admin@example.com "Admin Name" [admin|counselor]
 *
 * A random password is generated and printed once (never pass a password on the command line: it lands in shell history).
 * Staff are asked to set up two-step login the first time they sign in.
 */
import { randomBytes } from "node:crypto";
import { closePool, databaseConfigured, one, run } from "../lib/portal/db";
import { hashPassword } from "../lib/portal/password";

async function main(): Promise<void> {
  const email = (process.argv[2] ?? "").toLowerCase();
  const name = process.argv[3] ?? "Administrator";
  const role = process.argv[4] ?? "admin";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "counselor"].includes(role)) {
    console.error('Usage: npx tsx scripts/portal-create-user.ts email@example.com "Name" [admin|counselor]');
    process.exit(1);
  }
  if (!databaseConfigured()) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const password = randomBytes(12).toString("base64").replace(/[+/=]/g, "A") + "9";
  const hash = await hashPassword(password);
  const existing = await one<{ id: number; role: string }>("SELECT id, role FROM users WHERE email = $1", [email]);
  if (existing) {
    if (role === "counselor" && !["admin", "counselor"].includes(existing.role)) {
      console.error("That email belongs to a student or employer account. Use a separate staff email.");
      process.exit(1);
    }
    await run("UPDATE users SET role = $1, password_hash = $2, name = $3 WHERE id = $4", [role, hash, name, existing.id]);
    console.log(`Updated existing user to ${role}.`);
  } else {
    await run("INSERT INTO users (role, email, password_hash, name, created_at, email_verified_at) VALUES ($1,$2,$3,$4,NOW(),NOW())", [role, email, hash, name]);
    console.log(`Created ${role}.`);
  }
  console.log(`Email:    ${email}\nPassword: ${password}`);
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
