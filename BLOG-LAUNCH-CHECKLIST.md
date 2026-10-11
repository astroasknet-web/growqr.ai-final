# Blog launch and monitoring checklist

Run this after each blog deploy. Tick items off with the date and who checked. Nothing here has been measured yet: the code was verified locally and against a mock blog engine only.

**Which site?** The test site (qrscore.mathstudy.in) is for review. Canonical URLs and the sitemap always point at `https://www.growqr.ai` (`SITE_URL`), and non-production hosts should set `SEO_BLOCK_INDEXING=true`. Do the Search Console and Bing steps below only for the real production domain, and only once the blog is live there.

## 1. Before you submit anything (5 minutes, on the live URL)
- [ ] `/blog`, one article, `/blog/topic/digital-literacy`, `/blog/author/sachin-sharma`, `/editorial-policy` all return 200.
- [ ] `/blog?page=abc` and `/blog/no-such-post` return 404 and show the blog 404 page; `/blog?category=ielts` redirects (308) to `/blog/topic/ielts`.
- [ ] `https://www.growqr.ai/robots.txt` lists the sitemap and does not block `/blog`, CSS or JavaScript.
- [ ] `https://www.growqr.ai/sitemap.xml` lists `/blog`, `/editorial-policy`, the author page and each article, and does **not** list `/blog/search`, `?page=` URLs or topic pages that are still noindex.
- [ ] View source on an article: one `<h1>`, a canonical on `www.growqr.ai`, `og:image` (absolute https) with `og:image:alt`, `twitter:image:alt`, and no `noindex`.
- [ ] `http://` redirects to `https://`, and the non-`www` host redirects to `www` (one hop each, no chain).
- [ ] An article opened with `?utm_source=x` still shows the clean canonical (nothing indexable is created by tracking or share parameters).

## 2. Structured data
- [ ] Google Rich Results Test (search.google.com/test/rich-results) on an article: BlogPosting detected, no errors. FAQ markup may show as detected but Google rarely shows FAQ rich results now; do not expect it.
- [ ] Schema Markup Validator (validator.schema.org) on `/blog`, an article, a topic page and the author page: Blog, BreadcrumbList, CollectionPage, ProfilePage and Person parse without errors.
- [ ] The values shown match the page: headline, author, dates, image, publisher logo.
- [ ] Author and `sameAs`: fill in `lib/blog/authors.ts` credentials and profile links only with real, verifiable ones.

## 3. Social previews (after each new article is live)
- [ ] Facebook Sharing Debugger (developers.facebook.com/tools/debug): title, description and 1200x630 image correct; press "Scrape again" if you changed the image.
- [ ] LinkedIn Post Inspector (linkedin.com/post-inspector).
- [ ] X: paste the link into a draft post and check the card, since the old card validator is gone.
- [ ] WhatsApp and Telegram: send the link to yourself.
- [ ] Share bar: each of the eight links opens the right page with the right title and the clean canonical URL; Copy link shows the confirmation; native share appears on a phone.

## 4. Google Search Console (production only)
- [ ] Add the property (Domain property via DNS is best) and verify ownership.
- [ ] Sitemaps: submit `https://www.growqr.ai/sitemap.xml`; confirm status "Success" and the discovered-URL count looks right.
- [ ] URL Inspection on `/blog` and the first article: "URL is available to Google"; request indexing for these two only. Do not bulk-request.
- [ ] Pages report, after a week: note "Indexed", "Crawled, currently not indexed" and "Excluded by noindex". Expected exclusions: `/blog/search`, topic pages with fewer than 3 posts.
- [ ] Experience: Core Web Vitals and Mobile Usability reports (they need weeks of real-user data before they show anything).
- [ ] Performance report: save a baseline (clicks, impressions, CTR, position) for `/blog*` before and after changes.
- [ ] Links report: confirm internal links to the blog and topic pages.

## 5. Bing Webmaster Tools
- [ ] Add the site (import from Search Console is the quickest) and submit the same sitemap.
- [ ] Check the "SEO Reports" and "Site Scan" for the blog URLs.
- [ ] Optional: IndexNow for faster discovery of new articles (the repo does not use it yet).

## 6. Performance (measure, then compare)
Targets at the 75th percentile: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less.
- [ ] PageSpeed Insights (pagespeed.web.dev) for `/blog` and one article, mobile and desktop. Record the lab scores and, when shown, the field data. Save the numbers in the table below.
- [ ] Lighthouse in Chrome (incognito, no extensions) for the same pages: check LCP element (should be the cover image, not lazy-loaded), CLS (share bar and cover image have reserved space), total blocking time.
- [ ] If LCP is slow: check the cover image size (the 1200x630 PNG is about 100 KB; consider WebP), and the third-party scripts on the page.
- [ ] Re-test after the next deploy that touches the blog.

| Date | Page | Device | LCP | INP | CLS | Perf score | Notes |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

## 7. Accessibility and devices
- [ ] Keyboard only: tab through `/blog` (search, topic chips, cards, pagination) and an article (share buttons, quiz, FAQ, sidebar); focus is always visible and nothing traps.
- [ ] Screen reader spot check (NVDA or VoiceOver): share buttons announce the platform, the copy confirmation is spoken, quiz results are announced.
- [ ] Phone, tablet and desktop widths from 320 px up: no horizontal scroll.
- [ ] axe DevTools or Lighthouse accessibility audit on the blog home and an article.

## 8. Analytics (GA4)
- [ ] Confirm events arrive in GA4 DebugView after consent: `share_whatsapp`, `share_facebook`, `share_x`, `share_linkedin`, `share_telegram`, `share_pinterest`, `share_reddit`, `share_email`, `share_native`, `copy_article_link` with `article_id`, `article_category`, `share_method`, `placement`.
- [ ] Remember these are clicks, not confirmed shares.
- [ ] Mark the events you care about as key events; do not add personal data to any event.
- [ ] Internal blog search queries are not tracked yet (planned work): add a `search` event if you want zero-result reporting.
- [ ] BlogForge's own beacon (`NEXT_PUBLIC_BLOGFORGE_URL` and site slug) is set if you want engine-side view counts.

## 9. Every time you publish an article
- [ ] `npm run blog:audit` shows 100% (standard posts).
- [ ] Cover image generated and approved; alt text describes it.
- [ ] Related courses link to pages that return 200.
- [ ] A reviewer is named only if a real review happened.
- [ ] After deploy: article in the sitemap, social preview checked, URL Inspection requested.
- [ ] After three published posts in a topic (and an introduction written in `lib/blog/topics.ts`) the topic page becomes indexable and enters the sitemap automatically.

## 10. Monthly review
- [ ] Search Console: top queries and pages for the blog, pages with impressions but low CTR (rewrite title and description), pages with position 8 to 20 (improve the article).
- [ ] Pages report: any new "Not found (404)" or "Soft 404" URLs; fix links or add redirects.
- [ ] Update an article only when something meaningful changed, and let its updated date change with it.
- [ ] Review the editorial policy and author page for accuracy.

## Known gaps (not done yet)
- Slug-change redirect management and reviewer/canonical-override fields live in BlogForge, not in this repo.
- No hreflang or translations: the site is English only, so none were added.
- No real-user performance data, Search Console data or rich-result validation has been collected.
- Topic pages for IELTS and GRE have introductions but no articles yet, so they return 404 until a post uses that category.
