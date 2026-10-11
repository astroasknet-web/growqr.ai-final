# Blog audit and staged plan

Audited from the code in this repo on 2026-10-11 (no live Lighthouse or Search Console data was available, so nothing below claims a measured result).

## What already exists (reused, not rebuilt)
- Blog is a client of BlogForge (`lib/blog/blogforge.ts`); SEO fields (title, description, noindex, og image) come from the engine. Local "standard posts" (`lib/blog/local.ts`) sit beside them.
- Own-host canonical URLs (`postUrl`), BlogPosting + BreadcrumbList JSON-LD, FAQPage on standard posts, RSS (`/blog/rss.xml`), `/blog` and every post in `app/sitemap.ts` with real `lastmod`, empty blog set to noindex, robots.txt with sitemap and non-prod block.
- Consent-gated GA4 through `lib/analytics.ts` (`trackEvent`), plus the BlogForge beacon.
- Audit tooling for standard posts: `npm run blog:audit` (33 checks), cover generator, `BLOG-STANDARD.md`.

## Gaps found
| Area | Finding | Stage |
|---|---|---|
| Sharing | No share controls on any post | 1 (done) |
| Social metadata | Standard posts lacked absolute image URL + alt on X card; engine posts have no `og:image:alt` | 1 (standard posts done; engine posts: 2) |
| Blog home | Only the latest 48 posts, no search, categories, featured block, pagination or breadcrumb; generic title/description | 2 |
| Archives | No category pages, no topic clusters or pillar links | 3 |
| Pagination/search | None, so nothing to index-control yet; search results must be `noindex` when built | 2 |
| Images on cards | Plain `<img>` without width/height/srcset (engine images are remote, not in `next/image` patterns) | 2 |
| Engine-post template | Basic layout: no TOC, no sidebar, no author block, no related posts, `alt` = title | 2 |
| Author / E-E-A-T | Author is a name only; no author page, reviewer or editorial policy page | 3 |
| Schema | Publisher has no logo; no `Blog` node on the index; WebSite/Organization not linked from posts | 2 |
| Sitemap | One flat list; category sitemaps only once categories exist | 3 |
| Redirects | No slug-change redirect table (engine-owned) | needs BlogForge work |
| Admin fields | Reviewer, canonical override, related-post pick live in BlogForge, not this repo | needs BlogForge work |
| i18n | Single language (en); hreflang correctly absent. Add only when translations exist | later |
| Performance | Not measured. Needs Lighthouse/PageSpeed on the deployed site | after deploy |

## Stages
1. **Sharing and social previews** (this change): share bar top and end, 8 platforms plus native share and copy link, canonical-only URLs, GA4 click events, OG/X image alt and absolute URLs.
2. **Blog home and article template**: H1 and intro, search page (noindex), featured + latest + categories, crawlable pagination, card images with dimensions, engine-post template brought up to the standard layout, Blog/Organization schema.
3. **Topic architecture and E-E-A-T**: category landing pages with intros, category sitemap, author pages, editorial and corrections policy, reviewer field.
4. **Measurement checklist**: Search Console and Bing sitemap submission, rich-result and OG validators, Lighthouse before and after.

## Share feature notes
- Links: WhatsApp, Facebook, X, LinkedIn, Telegram, Pinterest (only with an https image), Reddit, Email, plus native Web Share when the browser has it and Copy link. No external scripts or SDKs; icons ship from `react-icons`.
- Always the canonical article URL, no tracking parameters (`lib/blog/share.ts` rejects anything else).
- Events: `share_whatsapp`, `share_facebook`, `share_x`, `share_linkedin`, `share_telegram`, `share_pinterest`, `share_reddit`, `share_email`, `share_native`, `copy_article_link`, with `article_id`, `article_category`, `share_method`, `placement`. They record the click only; platforms do not confirm a completed share. They go through the existing consent-gated `trackEvent`.
- Floating toolbar: not built. The page already has a sticky sidebar and a share row at both ends of the article; a third control would crowd the reading area without a measured benefit.
