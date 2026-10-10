import type { SheetState } from "./sheet/engine";
import type { Deck } from "./slides";

/**
 * Reusable learning-activity model. A course lists activities as data (lib/learn/data/<course>.activities.json); the interactive
 * components render them and lib/learn/checks.ts judges them. New courses add JSON, not code, unless they need a new playground.
 */
export type ActivityKind = "word" | "sheet" | "slides" | "classify";
export type Level = "beginner" | "intermediate" | "challenge";

export type CheckSpec =
  // Word
  | { k: "doc.heading"; min: number; level?: 1 | 2 | 3 }
  | { k: "doc.paragraphs"; min: number; minWords?: number }
  | { k: "doc.list"; type?: "ul" | "ol"; minItems: number }
  | { k: "doc.table"; rows: number; cols: number }
  | { k: "doc.format"; what: "bold" | "italic" | "underline" | "center" | "right" | "justify" | "size" }
  | { k: "doc.contains"; text: string }
  | { k: "doc.words"; min?: number; max?: number }
  | { k: "doc.pattern"; re: string; flags?: string; what: string }
  | { k: "doc.order"; texts: string[] }
  // Spreadsheet
  | { k: "sheet.value"; ref: string; equals: string | number }
  | { k: "sheet.formula"; ref: string; fns?: string[]; cover?: string; equals?: number | string }
  | { k: "sheet.filled"; range: string; min?: number }
  | { k: "sheet.result"; ref: string; equals: number | string; tolerance?: number }
  | { k: "sheet.chart"; type?: "bar" | "line" | "pie"; labels?: string; values?: string }
  | { k: "sheet.sorted"; range: string; dir: "asc" | "desc" }
  | { k: "sheet.format"; ref: string; what: "bold" | "currency" | "percent" | "center" }
  | { k: "sheet.noerrors" }
  // Slides
  | { k: "slides.count"; min: number; max?: number }
  | { k: "slides.titles" }
  | { k: "slides.contains"; text: string }
  | { k: "slides.readable"; maxBullets: number; maxWords: number }
  | { k: "slides.layouts"; min: number }
  | { k: "slides.shapes"; min: number }
  | { k: "slides.theme"; notDefault?: boolean }
  | { k: "slides.title-first"; text?: string }
  // Classify
  | { k: "classify.item"; item: string };

export interface Check {
  id: string;
  label: string;
  hint: string;
  /** Shown only when the student asks for the explanation. */
  explain: string;
  spec: CheckSpec;
}

export interface ClassifyData { categories: Array<{ id: string; label: string }>; items: Array<{ id: string; text: string; answer: string; why: string }> }

export interface Activity {
  id: string;
  kind: ActivityKind;
  module: string; // module slug, or "capstone"
  title: string;
  level: Level;
  minutes: number;
  xp: number;
  skills: string[];
  objective: string;
  scenario: string;
  steps: string[];
  checks: Check[];
  /** Does passing this activity count toward completing its module (and so the course)? */
  required: boolean;
  /** Starting content: HTML for Word, a SheetState for sheets, a Deck for slides. Absent for classify. */
  initial?: { html?: string; sheet?: SheetState; deck?: Deck };
  classify?: ClassifyData;
  /** Spreadsheet only: the grid area to show and which columns are headers. */
  view?: { cols: number; rows: number };
}

export type ActivityState =
  | { kind: "word"; html: string }
  | { kind: "sheet"; sheet: SheetState }
  | { kind: "slides"; deck: Deck }
  | { kind: "classify"; answers: Record<string, string> };

export interface CheckResult { id: string; label: string; passed: boolean; message: string; hint: string; explain: string }
export interface RunResult { results: CheckResult[]; passed: number; total: number; score: number; allPassed: boolean }

export interface Badge { id: string; title: string; description: string; when: { all?: string[]; any?: string[]; module?: string } }
/** Content for the course landing page. Everything on the page comes from here and from the lesson file, so a new course needs no new page code. */
export interface Landing {
  hero: { eyebrow: string; title: string; subtitle: string; level: string; outcomeLine: string };
  outcomes: Array<{ icon: string; title: string; text: string }>;
  projects: Array<{ title: string; text: string; module: string }>;
  tools: Array<{ icon: string; title: string; text: string }>;
  assessment: string[];
  faq: Array<{ q: string; a: string }>;
}
export interface LearnCourse {
  course: string; // lesson-file key
  slug: string; // catalogue slug
  skills: Array<{ id: string; label: string }>;
  badges: Badge[];
  levels: Array<{ min: number; title: string }>;
  activities: Activity[];
  landing?: Landing;
}
