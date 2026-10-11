# Blog standard

A post is an education resource, not an ad. The reference is `lib/blog/posts/digital-literacy-quiz-with-answers.ts`.

## Workflow

1. Pick a live course. Choose a focus keyword a learner actually types (specific, question-like, low competition). Check it in Search Console / a keyword tool before writing; the first post's keyword was reasoned, not tool-verified.
2. Copy the reference post to `lib/blog/posts/<slug>.ts` and register it in `LOCAL_POSTS` (`lib/blog/local.ts`).
3. Write it (rules below). Put `<!--quiz-->` where the quiz goes.
4. `npm run blog:audit` must report 100%. A person still reads it: the audit checks mechanics, not whether the advice is right.
5. Generate the cover: `npx tsx scripts/blog-cover.ts <slug>` (1200x630 PNG in `public/blog/`).
6. Review on the preview, then publish.

## Required elements

| Area | Rule |
|---|---|
| SEO title | 50 to 60 chars, focus keyword first |
| Meta description | 120 to 155 chars, keyword, ends with a mild call to action |
| Keyword | In H1, first 100 words, 2+ H2s, image alt; density 0.5 to 1.5% |
| Structure | 4 to 8 H2s (FAQ and Related courses count), H3s for sub-points, at least one table, 1,200 to 2,500 words |
| Education | Interactive quiz (10+ questions, 4 options, explanation for every answer, answers spread across positions) |
| FAQ | 4 to 6, each answer 2 to 4 sentences, direct |
| Links | 3+ internal links in the body with descriptive anchors; 4+ related courses (internal `/courses/...` links with a one-line note) shown in a "Related courses" section; no external links for now |
| Author | Sachin Sharma only |
| Cover | 1200x630, descriptive alt, doubles as the social card |

## Writing

Open with a concrete moment, not a sweeping statement. Take a position, give real numbers, admit trade-offs, vary paragraph length, one non-obvious insight. Avoid the banned phrases listed in `lib/blog/standard.ts`, stacked hedging, mirrored section summaries, generic calls to action, and more than two em dashes. Never invent statistics.

## What ships

`StandardPost` renders breadcrumb, byline, cover, table of contents, body, quiz, FAQ, call to action and related courses. JSON-LD emits BlogPosting, FAQPage and BreadcrumbList. The post appears in `/blog` and the sitemap automatically. Tables must be wrapped in `<div class="table-wrap" role="region" tabindex="0" aria-label="...">`.
