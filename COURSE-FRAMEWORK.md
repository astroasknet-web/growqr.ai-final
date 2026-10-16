# Interactive course framework (benchmark: Digital Literacy)

The Digital Literacy course is the reference for every future course. It is built from reusable parts, so a new course is mostly **data**.

## The pieces

| Layer | Where | What it does |
|---|---|---|
| Lessons (text, quizzes, capstone) | `lib/market/data/lessons/<key>.json` (built by `scripts/build-lessons.mjs`) | Modules, lessons, key points, practical tasks, quizzes. Rendered by `app/courses/[slug]/learn/[step]/page.tsx`. |
| Activities (practice and projects) | `lib/learn/data/<key>.activities.json` | Interactive tasks with objectives, steps, checks, hints, XP, skills, badges and the landing-page content. |
| Playgrounds (the tools) | `components/learn/WordPad`, `SheetGrid`, `SlideStudio`, `ClassifyBoard` | Real editors that run in the browser. |
| Engines (pure logic) | `lib/learn/sheet/*`, `doc.ts`, `slides.ts` | Safe formula engine, document sanitiser/analyser, slide model and export. No DOM, fully unit tested. |
| Checks | `lib/learn/checks.ts` | Judges work against an activity's checks. Runs in the browser (instant) and on the server (the result that counts). |
| Progress | `lib/learn/results.ts`, table `activity_results` | Records what a student demonstrated; derives XP, levels, badges, skills; ticks module checkpoints. |
| Pages | `CourseLanding`, `ActivityRunner`, module page, `/learn/[step]/a/[activity]` | Landing page, module page, activity workspace. |
| Optional AI | `lib/learn/assist.ts`, `app/api/learn/assist`, `AssistantPanel` | Off by default; the course works fully without it. |

## Lesson types and how they map

1. **Concept lesson**: a topic in the lesson JSON (`topics[]`), shown as an accordion with "Remember" key points.
2. **Visual explanation / video / demonstration**: put an inline SVG, image or embedded demo in a topic's `html` (sanitised by `lessons.cleanHtml`).
3. **Guided interactive activity**: an activity with `kind: "classify"` (sort and decide).
4. **Simulation or playground**: an activity with `kind: "word" | "sheet" | "slides"`.
5. **Knowledge check**: the module quiz (graded on the server).
6. **Practical assignment / project**: an activity with `level: "challenge"`, or the module's `practical` steps for offline tasks.
7. **Project assessment**: capstone activities (`module: "capstone"`).

## Add a course in 6 steps

1. **Lessons**: add the source content, run `scripts/build-lessons.mjs`, register the slug in `lib/market/lessons.ts` and `lib/market/data/courses.json`. (Existing process, unchanged.)
2. **Activities file**: copy `lib/learn/data/digital-literacy.activities.json`. Set `course` and `slug`; define `skills`, `badges`, `levels`; write `activities[]`; add a `landing` block (hero, outcomes, projects, tools, assessment, faq).
3. **Register it** in `lib/learn/activities.ts` (`COURSES`). The landing page, module pages, progress, XP and badges switch on automatically.
4. **Test it**: copy the pattern in `lib/learn/activities.test.ts`: write a model answer for each activity and assert it passes, and that nothing passes before the student acts. This is what catches wrong or impossible checks.
5. **Run** `npx vitest run lib/learn`, then try each activity in the browser.
6. **Reconcile**: nothing to do. `results.reconcile` ticks a module when its quiz AND its `required` activities are passed, and marks the course GrowQR-verified when every module and the capstone are done.

### An activity, field by field

```jsonc
{
  "id": "s2-total-average",          // unique within the course
  "kind": "sheet",                   // word | sheet | slides | classify
  "module": "ms-excel",              // a module slug, or "capstone"
  "title": "...", "level": "beginner|intermediate|challenge", "minutes": 10, "xp": 50,
  "skills": ["excel"],               // ids from the course's `skills`
  "required": true,                  // must be passed to complete the module
  "objective": "...", "scenario": "...", "steps": ["..."],
  "initial": { "sheet": { "cells": {"A1": "Student"}, "formats": {}, "charts": [] } },
  "checks": [{ "id": "e2", "label": "...", "hint": "...", "explain": "...", "spec": { "k": "sheet.formula", "ref": "E2", "fns": ["SUM"], "cover": "B2:D2", "equals": 217 } }]
}
```

Check kinds are listed in `lib/learn/types.ts` (`CheckSpec`): `doc.*` (headings, paragraphs, lists, tables, formatting, text, word counts, patterns, order), `sheet.*` (value, formula with function and range coverage, result, filled, chart, sorted, format, noerrors), `slides.*` (count, titles, contains, readable, layouts, shapes, theme, title-first), `classify.item`.

Feedback rules: a failed check says **what is wrong, not the answer**. `hint` appears only when asked; `explain` only when asked after that.

## Add a new playground (for example graphs for Maths, a code editor for Data Science)

1. Put the model and its pure logic in `lib/learn/<name>/` with tests (no DOM).
2. Add check kinds to `CheckSpec` and a handler in `lib/learn/checks.ts`.
3. Add its state to `ActivityState` and a clean-up branch in `cleanState` (`lib/learn/activities.ts`): **everything a client sends must be re-validated on the server**.
4. Build the component in `components/learn/` (controlled: `value` + `onChange`) and add one `case` in `ActivityRunner`.

## Data, saving and privacy

- Table `activity_results` (migration `20261012000001_activity_results.sql`): one row per student, course and activity (and `quiz:<module>`): attempts, best score, passed, XP, and the latest work (`state_json`, up to 120 KB).
- Work is stored **only for logged-in students**, when they press **Check my work** or **Save**. Guests get the same feedback and the page says their work is not saved. Rows are deleted with the account.
- XP is the activity's fixed XP, earned once, only when every check passes. Levels, badges and skill bars are computed from passed activities; nothing is stored that a student did not demonstrate.

## Security notes

- Spreadsheet formulas are parsed into a data tree and evaluated by a small interpreter. There is no `eval`, `Function` or dynamic code. Unknown names, deep nesting, long formulas, huge ranges and circular references return error values.
- Documents are sanitised to a whitelist of tags and four style properties; scripts, handlers, links, images and iframes are removed. Pasted text is inserted as plain text.
- Decks are plain data (text, numbers, palette colours) and are always rendered as text. HTML/CSV exports escape text; CSV export neutralises `= + - @` at the start of text cells.
- CSV import: 100 KB, 100 rows, 26 columns.
- Server action `submitActivity` re-runs the checks on cleaned state, throttles per student, and caps state size.

## Optional AI assistant

`LEARN_AI_ENABLED=true` plus the existing `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) turn it on. Students only; 12 questions per 15 minutes and 40 per day; answers are capped at 350 tokens. It sees a student's work **only if they tick "Share my current work"**, and the prompt forbids claiming to have checked or edited anything. With the flag off, or on any error, the lesson is unaffected. Cost: one short completion per question; leave it off to spend nothing.

## Known limits

- The document editor uses `document.execCommand` (deprecated but universally supported); it produces simple HTML, not .docx. "Download .doc" is HTML that Word opens.
- Spreadsheet: one sheet per activity, no cross-sheet references; sorting does not rewrite formulas that point at moved rows (the status line says so).
- Slides export is a self-contained HTML slideshow (and print-to-PDF), not .pptx.
- Automated checks judge structure and content, not taste.

---

## University programme courses (BBA, BCA, MCA, MBA, B.Tech): the standard pipeline

The Digital Literacy course is hand-built. Courses for university programmes follow one repeatable pipeline so each new subject is data, not code. The reference is **Financial Accounting for BBA** (`/courses/bba-financial-accounting`).

| Step | What | Where |
|---|---|---|
| 1. Author | Write the subject as a Vidaara *standard course* JSON (units, lessons, worked examples with machine-checkable numbers, case studies, question bank, glossary, FAQs, lab, SEO block). The authoring tool re-computes every number and fails the build if one is wrong. | `F:\COURSES\COLLLGE LEVEL COURSE\BBA\courses\` (`COURSE_SCHEMA.md`, `AUDIT_GUIDE.md`, `_tools\course_tools.js`) |
| 2. Convert | `node scripts/build-course-pages.mjs <course.json> [slug]` writes the lesson player file, copies the source to `content/course-sources/`, and upserts the catalogue entry in `courses.json`. | `scripts/build-course-pages.mjs`, `scripts/lib/course-html.mjs` |
| 3. Register | Add the slug to `NATIVE` in `lib/market/lessons.ts` (first time only). The catalogue loads into Postgres when the server starts. | `lib/market/lessons.ts` |
| 4. Practice | Author spreadsheet and sort-and-decide activities (optional but recommended): `scripts/author/<slug>-activities.mjs` writes `lib/learn/data/<slug>.activities.json`; register it in `lib/learn/activities.ts`; copy `lib/learn/bba-financial-accounting.activities.test.ts` and write a model answer for each activity. | `lib/learn/` |
| 5. Test | `npx vitest run lib/learn lib/market` (the course-pages tests check slugs, safe HTML, quiz keys, SEO limits and JSON-LD). | `lib/learn/course-pages.test.ts` |

What a programme course gets for free (from the `landing` block in its lesson file):

- A landing page with curriculum, learning outcomes, a **university syllabus alignment table** (with links to the official syllabus), key terms, FAQ, sources and author.
- SEO: keyword title (at most 62 characters), 120-155 character description, canonical, Open Graph and Twitter cards, and schema.org `Course` + `CourseInstance` + `Offer` (free) + `FAQPage` + `DefinedTermSet` + `BreadcrumbList`. Lesson pages carry `LearningResource` with author, time and topics.
- Short keyword URLs: `/courses/<programme>-<subject>/learn/<unit-slug>#<lesson-slug>` (set `slug`, `seo_title` per unit in the source).
- Lesson components (callouts, formula boxes, tables, journal and trial-balance tables, accessible SVG diagrams) styled in `app/globals.css` under "Course lesson components" (prefix `cw-`), mobile-first, with a high-contrast mode.
- "Expand all lessons" and deep links that open the right lesson (`components/learn/LessonTools.tsx`).

Rules to keep the standard: one H1 per page, every diagram has a text alternative, all text is escaped by the renderer, quiz answers are spread across A to D by the authoring tool, and nothing is published until the audit report passes.
