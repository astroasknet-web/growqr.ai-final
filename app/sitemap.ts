import { MetadataRoute } from 'next';
import { visibleExperts } from '@/features/experts/data/experts-data';
import { listEventsForSitemap } from '@/features/events/services/events.service';
import { SITE_URL } from '@/lib/seo';
import { nativeCourse, nativeSlugs } from '@/lib/market/lessons';
import { TOTAL_TESTS } from '@/lib/tests/ielts';

// Revalidate so newly published events appear in the sitemap without a redeploy.
export const revalidate = 3600;

// Deliberately no `priority` or `changeFrequency` anywhere in this file:
// Google ignores both outright, and they were the only hints being emitted
// while <lastmod> — the one field Google does use — was missing entirely.
//
// `lastModified` is only set where a real timestamp exists (events, from the
// DB). Static pages get no lastmod rather than a synthesised one: a build-time
// `new Date()` would mark all 50-odd URLs as freshly modified on every deploy,
// and once Google decides a site's lastmod is untrustworthy it discounts the
// signal site-wide.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const basicRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}` },
    { url: `${baseUrl}/enterprise` },
    { url: `${baseUrl}/agents` },
    { url: `${baseUrl}/about` },
    { url: `${baseUrl}/vision` },
    { url: `${baseUrl}/company` },
    { url: `${baseUrl}/contact` },
    { url: `${baseUrl}/ambassadors` },
    { url: `${baseUrl}/ambassadors/apply` },
    { url: `${baseUrl}/growqr-internship` },
    { url: `${baseUrl}/growqr-internship/apply` },
    { url: `${baseUrl}/community` },
    { url: `${baseUrl}/gallery` },
    { url: `${baseUrl}/privacy-policy` },
    { url: `${baseUrl}/data-deletion` },
    { url: `${baseUrl}/refund-policy` },
  ];

  const aiToolRoutes: MetadataRoute.Sitemap = [
    'ai-brand-builder',
    'ai-interviewer',
    'ai-learning-curator',
    'ai-opportunity-finder',
    'ai-resume-expert',
    'ai-roleplay-coach',
    'ai-skill-trainer',
  ].map((slug) => ({ url: `${baseUrl}/${slug}` }));

  // ── Enterprise agent pages ─────────────────────────────────────────────
  // B2B counterparts of the aiToolRoutes above, living under /enterprise/*.
  const enterpriseAgentRoutes: MetadataRoute.Sitemap = [
    'ai-recruiter',
    'attrition-predictor',
    'brand-builder',
    'capability-builder',
    'interviewer',
    'onboarding-co-pilot',
    'opportunity-finder',
    'outsourcing-manager',
    'workforce-analyst',
  ].map((slug) => ({ url: `${baseUrl}/enterprise/${slug}` }));

  // Note: 'consultants' is intentionally excluded — /solutions/consultants is
  // still placeholder copy and noindexed (see app/solutions/consultants/page.tsx).
  // Add it back once real content ships.
  const solutionPages: MetadataRoute.Sitemap = [
    'coaches',
    'enterprises',
    'freelancers',
    'professionals',
    'institutes',
    'recruiters',
    'startups',
    'students',
  ].map((slug) => ({ url: `${baseUrl}/solutions/${slug}` }));

  // ── Experts ──────────────────────────────────────────────────────────────
  // Experts are defined in a static TS module with no edit timestamps, so
  // there is no honest lastmod to emit for them.
  const expertRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/experts` },
    { url: `${baseUrl}/experts/all` },
    ...visibleExperts.map((e) => ({ url: `${baseUrl}/experts/${e.slug}` })),
  ];

  // ── Events ───────────────────────────────────────────────────────────────
  // Pull active events from the DB; degrade gracefully if it's unavailable so
  // a transient DB error never breaks sitemap generation.
  let events: { slug: string; updatedAt: Date }[] = [];
  try {
    events = await listEventsForSitemap();
  } catch {
    events = [];
  }

  const eventRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/events` },
    { url: `${baseUrl}/events/all` },
    // Real <lastmod> from the row's updated_at. This also replaces the old
    // blanket changeFrequency:'weekly', which told Google to keep re-crawling
    // events that finished months ago and will never change again.
    ...events.map((e) => ({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: e.updatedAt,
    })),
  ];

  // Learning: the courses taught on GrowQR (lessons) and the practice tests. Result pages (?a=...) are never listed.
  const learnRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/courses` },
    ...nativeSlugs().flatMap((slug) => [
      { url: `${baseUrl}/courses/${slug}` },
      { url: `${baseUrl}/courses/${slug}/learn` },
      ...nativeCourse(slug)!.modules.map((m) => ({ url: `${baseUrl}/courses/${slug}/learn/${m.slug}` })),
      { url: `${baseUrl}/courses/${slug}/learn/capstone` },
    ]),
    { url: `${baseUrl}/practice-tests` },
    ...['ielts-reading', 'ielts-listening', 'gre-quant'].flatMap((exam) => [
      { url: `${baseUrl}/practice-tests/${exam}` },
      ...Array.from({ length: TOTAL_TESTS }, (_, i) => ({ url: `${baseUrl}/practice-tests/${exam}/${i + 1}` })),
    ]),
  ];

  return [...basicRoutes, ...learnRoutes, ...aiToolRoutes, ...enterpriseAgentRoutes, ...solutionPages, ...expertRoutes, ...eventRoutes];
}
