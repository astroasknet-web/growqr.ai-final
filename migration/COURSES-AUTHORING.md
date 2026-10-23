# The 20 interactive courses: how they are built and what they are not

Twenty courses have full lessons, hands-on labs, module quizzes, a capstone and badges: Microsoft Excel (basic), Microsoft Word, PowerPoint design, Statistics for analysts, Financial literacy and investing, Basic accounting and bookkeeping, Digital marketing foundations, SEO, Business communication, Corporate readiness and interview skills, Time management and productivity, Critical thinking and problem solving, Project management fundamentals, Agile/Scrum/Jira, Cybersecurity essentials, Prompt engineering, Entrepreneurship and startup basics, Product management fundamentals, Operations and supply chain, Customer success and support.

## Where the content lives

- One source file per course: `scripts/author/courses/<slug>.mjs` (helpers in `scripts/author/kit.mjs`).
- `node scripts/author/build-new-courses.mjs` turns every source file into `lib/market/data/<slug>.lessons.json`, `lib/learn/data/<slug>.activities.json`, updates the catalogue entry in `lib/market/data/courses.json` and regenerates the lazy registries `lib/market/new-lessons.ts` and `lib/learn/new-activities.ts`. Run it after editing any course, and commit the generated files.
- `lib/learn/new-courses.test.ts` checks every course: six modules of three lessons, at least 3,600 lesson words, well-formed quizzes (answers spread across positions, every question explained), at least one required lab per module, a capstone, and that **every lab can be finished with its model answer** (expected values are computed independently in the source and cross-checked against the spreadsheet engine).
- Selling: a course product is `course-<slug>`. New databases seed it active because the course now has lessons; databases that already had the rows get them switched on by `db/migrations/20261125000001_activate_new_courses.sql`. Fees come from `lib/pay/course-fees.ts`.

## How a lab is judged

Labs are not multiple choice. A spreadsheet, document, slide or sorting task is checked by `lib/learn/checks.ts` against the student's actual work (values, formulas used, cell coverage, headings, lists, word counts, patterns). Each failed check shows a plain explanation and a hint. XP and badges are earned only when every check passes.

## What these courses are not

- They are **not externally accredited**, and none claims to prepare for a named certification (project management and Scrum pages say so explicitly). "International standard" here is a quality target for structure, depth and practice, not an award.
- The labs run in the browser: there are no coding or live-software labs (no real Jira, no real search console, no connection to an AI service). The prompt-engineering labs check the structure and content of what a student writes, not an AI's reply.
- Law, tax, funding and employment content is general and says to check local rules; it is not legal or financial advice.
- Examples use India-friendly rupee figures that are illustrative. Prices of tools, tokens and markets change; the courses say so where it matters.
- Content was written and checked by the build's own tests and a review in the browser, not reviewed by outside subject experts. Have a subject expert read each course before you advertise it as expert-reviewed.
- Each course's first sorting activity is a free sample before purchase (the existing design for all courses); everything else needs a purchase or a plan pick.
