import { first, pool, type Db } from "./db";
import { hasEntitlement } from "./entitlements";

/**
 * Who may study a course that has a fee. A course with no active product (or no active INR price) stays free, as before.
 * A priced course is open to: people who paid (an active entitlement), and people already enrolled before it had a fee
 * (enrolments are kept; a full refund removes both the entitlement and the enrolment).
 */
export interface CourseFee { sku: string; amountMinor: number; currency: "INR" }

export const courseSku = (slug: string): string => `course-${slug}`;

export async function courseFee(slug: string, db: Db = pool): Promise<CourseFee | null> {
  const r = await first<{ amount_minor: number }>(db, "SELECT pr.amount_minor FROM pay_products p JOIN pay_prices pr ON pr.product_id = p.id AND pr.currency = 'INR' AND pr.active = 1 WHERE p.sku = $1 AND p.active = 1", [courseSku(slug)]);
  return r ? { sku: courseSku(slug), amountMinor: Number(r.amount_minor), currency: "INR" } : null;
}

export async function canStudy(userId: number | null, courseId: number, slug: string, db: Db = pool): Promise<boolean> {
  if (!(await courseFee(slug, db))) return true;
  if (userId === null) return false;
  if (await first(db, "SELECT 1 AS x FROM course_enrolments WHERE user_id = $1 AND course_id = $2", [userId, courseId])) return true;
  return hasEntitlement(userId, "course", slug, db);
}

export const buyHref = (slug: string): string => `/checkout?sku=${courseSku(slug)}`;
