import { first, pool, rows, exec, txRetry, type Db } from "./db";
import { PayError } from "./orders";
import { hasEntitlement } from "./entitlements";

/**
 * What a student's plan gives them. A plan is an entitlement (Pro, Silver or Gold) bought through checkout; everything below is decided from the
 * plan the student holds right now, so it follows renewals and lapses by itself.
 *
 *   Courses from the plan   Pro 1, Silver 2, Gold 4 (the "recommended courses" of the package). The student picks which; a pick is permanent.
 *                           If a lower plan is held later, only the earliest picks (up to that plan's number) stay open.
 *   Vedic Mathematics       module 1 is free; the other modules need Pro or higher.
 *   Resume Studio           Pro or higher unlocks the Studio Pro features (see lib/studio/access.ts).
 */
export type PlanKey = "pro" | "silver" | "gold";
const RANK: PlanKey[] = ["pro", "silver", "gold"];
export const PLAN_COURSE_QUOTA: Record<PlanKey, number> = { pro: 1, silver: 2, gold: 4 };
export const PLAN_NAME: Record<PlanKey, string> = { pro: "Pro", silver: "Silver", gold: "Gold" };

export interface PlanInfo { key: PlanKey; name: string; expiresAt: string | null; courseQuota: number }

/** The highest plan the person holds right now (and the latest end date of it), or null for the free plan. */
export async function planInfo(userId: number, db: Db = pool): Promise<PlanInfo | null> {
  const r = await rows<{ ref: string; expires_at: string | null }>(db, "SELECT ref, expires_at FROM pay_entitlements WHERE user_id = $1 AND kind = 'plan' AND status = 'active' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3)) ORDER BY id DESC", [userId]);
  let best: { key: PlanKey; expiresAt: string | null } | null = null;
  for (const x of r) {
    const i = RANK.indexOf(x.ref as PlanKey);
    if (i < 0) continue;
    const exp = x.expires_at ? String(x.expires_at) : null;
    if (!best || i > RANK.indexOf(best.key) || (i === RANK.indexOf(best.key) && best.expiresAt !== null && (exp === null || exp > best.expiresAt))) best = { key: x.ref as PlanKey, expiresAt: exp };
  }
  return best ? { key: best.key, name: PLAN_NAME[best.key], expiresAt: best.expiresAt, courseQuota: PLAN_COURSE_QUOTA[best.key] } : null;
}

export const atLeast = (have: PlanKey | null, need: PlanKey): boolean => have !== null && RANK.indexOf(have) >= RANK.indexOf(need);

/** Every course the student has picked, in the order picked. */
export async function pickedSlugs(userId: number, db: Db = pool): Promise<string[]> {
  return (await rows<{ course_slug: string }>(db, "SELECT course_slug FROM plan_course_claims WHERE user_id = $1 ORDER BY id ASC", [userId])).map((r) => r.course_slug);
}

/** The picks that are open now: the earliest ones, up to what the current plan allows. */
export async function openPickSlugs(userId: number, db: Db = pool): Promise<string[]> {
  const plan = await planInfo(userId, db);
  if (!plan) return [];
  return (await pickedSlugs(userId, db)).slice(0, plan.courseQuota);
}

export interface PlanCourses { plan: PlanInfo | null; picked: string[]; open: string[]; left: number }

export async function planCourses(userId: number, db: Db = pool): Promise<PlanCourses> {
  const plan = await planInfo(userId, db);
  const picked = await pickedSlugs(userId, db);
  const quota = plan?.courseQuota ?? 0;
  return { plan, picked, open: picked.slice(0, quota), left: Math.max(0, quota - picked.length) };
}

export const hasPurchasedCourse = (userId: number, slug: string, db: Db = pool): Promise<boolean> => hasEntitlement(userId, "course", slug, db);

/**
 * Use one of the plan's course picks on a course. Only a course that has its lessons on GrowQR can be picked (the caller checks that and
 * passes the course id), and a course already bought needs no pick.
 */
export async function pickCourse(userId: number, course: { id: number; slug: string }, db?: Db): Promise<"picked" | "already"> {
  // One pick at a time per student: the student's row is locked while the picks are counted and written, so quick double clicks cannot exceed the plan.
  const work = async (c: Db): Promise<"picked" | "already"> => {
    await first(c, "SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const s = await planCourses(userId, c);
    if (!s.plan) throw new PayError("no_plan", "Your plan is not active. Choose a plan to use its included courses.", 403);
    if (await hasPurchasedCourse(userId, course.slug, c)) return "already";
    if (s.picked.includes(course.slug)) return "already";
    if (s.left <= 0) throw new PayError("no_picks_left", `You have used all ${s.plan.courseQuota} course ${s.plan.courseQuota === 1 ? "pick" : "picks"} in your ${s.plan.name} plan.`, 409);
    await exec(c, "INSERT INTO plan_course_claims (user_id, course_slug) VALUES ($1,$2)", [userId, course.slug]);
    await exec(c, "INSERT IGNORE INTO course_enrolments (user_id, course_id, status, done_json, progress, started_at, updated_at) VALUES ($1,$2,'enrolled','[]',0,NOW(),NOW())", [userId, course.id]);
    return "picked";
  };
  return db ? work(db) : txRetry(work);
}

export async function isPlanMember(userId: number, db: Db = pool): Promise<boolean> {
  return (await first(db, "SELECT 1 AS x FROM pay_entitlements WHERE user_id = $1 AND kind = 'plan' AND status = 'active' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3)) LIMIT 1", [userId])) !== null;
}
