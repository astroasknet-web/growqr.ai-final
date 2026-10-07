/**
 * Campus Ambassador cohort registry.
 *
 * The program runs in numbered intakes. Applications carry the cohort that was
 * live when they were submitted, so the admin panel can review one intake
 * without the previous one's rows mixed in.
 *
 * Adding Cohort 03: append "03" here, point CURRENT_COHORT at it, and bump the
 * column default in a new migration. Existing rows keep the cohort they were
 * stamped with.
 */
export const COHORTS = ["01", "02"] as const;

export type Cohort = (typeof COHORTS)[number];

/**
 * The intake currently accepting applications. Written onto every new row by
 * app/api/send-ambassador/route.ts. The DB carries the same value as a column
 * default so a row inserted outside that route is never left cohort-less.
 */
export const CURRENT_COHORT: Cohort = "02";

export function isCohort(value: string): value is Cohort {
  return (COHORTS as readonly string[]).includes(value);
}

export function cohortLabel(cohort: string): string {
  return `Cohort ${cohort}`;
}
