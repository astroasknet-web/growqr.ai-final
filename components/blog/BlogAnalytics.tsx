"use client";

import Script from "next/script";

/**
 * Loads the BlogForge first-party analytics beacon so headless blog views are
 * counted in the engine's dashboard. Renders nothing unless the public engine
 * URL and this site's public slug are configured. The beacon is keyed by the
 * PUBLIC slug (never a secret) and stores no PII — safe in page JS.
 */
export default function BlogAnalytics() {
  const engineRaw = process.env.NEXT_PUBLIC_BLOGFORGE_URL;
  const site = process.env.NEXT_PUBLIC_BLOGFORGE_SITE_SLUG;
  if (!engineRaw || !site) return null;
  const engine = engineRaw.replace(/\/+$/, "");
  return (
    <Script
      src={`${engine}/js/track.js`}
      data-site={site}
      data-engine={engine}
      strategy="afterInteractive"
    />
  );
}
