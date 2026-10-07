# lib/qrscore: the RQ Score engine in TypeScript

Port of the PHP scoring engine (`../qrscore/src`) so GrowQR's resume scoring runs inside the Next.js app. Same rubric, dictionaries, recommendations and learned model (the JSON files in `data/` are copied unchanged), same results.

```ts
import { scoreText, scoreFile, isScored } from "@/lib/qrscore";   // scoreFile lives in "@/lib/qrscore/extract"

const r = scoreText(resumeText);
if (isScored(r)) {
  r.overall.score;     // 0-100
  r.grade;             // Excellent | Strong | Good | Needs work | Weak
  r.sections;          // five sections with per-parameter scores and reasons
  r.profile;           // structured profile (education, experience, skills, ...)
} else {
  r.gate;              // "this is not a resume" verdict with reasons
}
```

For uploads (PDF, DOCX, TXT): `await scoreFile(bytes, filename)` from `./extract` (server-side only).

## Layout

| File | PHP original |
|---|---|
| `index.ts` | `QrScore.php` (facade) |
| `resume-gate.ts` + `data/gate.json` | `Extract/ResumeGate.php` |
| `segmenter.ts`, `education-parser.ts`, `profile.ts` | `Extract/*` |
| `career-stage.ts` | `Score/CareerStage.php`, `DomainDetector.php` |
| `scorers/{education,experience,skills,projects,impact}.ts` | `Score/*Scorer.php` |
| `score-engine.ts`, `recommender.ts`, `advice.ts` | `Score/ScoreEngine.php`, `Recommender.php`, `Advice.php` |
| `ml.ts` | `Ml/FeatureVector.php`, `Model.php`, `Trainer::predict` |
| `extract.ts` | `Extract/TextExtractor.php`, `DocxExtractor.php`, `PdfExtractor.php` (pdf.js only) |
| `php.ts` | PHP built-ins whose behaviour differs from JavaScript (round, str_word_count, trim with byte lists, PCRE-style `\s`) |

## Keeping it equal to PHP

`parity.test.ts` scores 333 inputs (fixtures plus Unicode/edge variants) and requires the result to equal the PHP engine's, field by field. To refresh after changing the PHP engine or its data files:

```
php scripts/qrscore-golden.php
npx vitest run lib/qrscore
```

The year is part of the maths (years of experience), so the golden file records the year it was made and the test pins it (`setNowYear`).

## Known differences

- Scanned (image-only) PDFs are not OCR'd yet.
- PDF text comes from pdf.js, not Poppler, so line breaks in some PDFs can differ and move a score slightly. Text, DOCX and pasted input are identical to PHP.
- Not ported here: `Ml/Trainer` (offline training CLI), which stays in PHP until training moves too.
