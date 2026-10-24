/**
 * Interactive lesson widgets. A course author writes a small JSON spec; the converter (scripts/lib/course-html.mjs) puts it in the lesson HTML
 * as a placeholder <div data-cw-widget="<type>" data-spec="<base64 json>">; components/learn/widgets/WidgetHost.tsx mounts the matching React
 * component. Every widget has a static fallback inside the placeholder, so the lesson still reads with scripts off and for search engines.
 */
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string }
export interface QuizSpec { type: "quiz"; id: string; title?: string; questions: QuizQuestion[] }

/** One line of a journal entry: [account, amount]. */
export type Line = [string, number];
export interface JournalTxn { text: string; dr: Line[]; cr: Line[]; why: string }
export interface JournalSpec { type: "journal"; id: string; title: string; intro?: string; accounts: string[]; txns: JournalTxn[] }

export type Side = "A" | "L" | "C";
export interface EquationItem { key: string; label: string; side: Side }
export interface EquationMove { text: string; delta: Record<string, number>; why: string }
export interface EquationSpec { type: "equation"; id: string; title: string; items: EquationItem[]; start: Record<string, number>; moves: EquationMove[] }

export interface ExplorerInput { id: string; label: string; min: number; max: number; step: number; value: number; unit?: "rs" | "pct" | "n" | "yrs" }
export interface ExplorerOutput { label: string; expr: string; unit?: "rs" | "pct" | "n" | "x"; hint?: string }
export interface ExplorerSeries { label: string; expr: string; color?: "orange" | "blue" | "green" }
export interface ExplorerSpec {
  type: "explorer"; id: string; title: string; intro?: string; inputs: ExplorerInput[]; outputs: ExplorerOutput[];
  /** Optional line chart: x runs 0..xmax (an expression), each series is evaluated with k = the x value. */
  chart?: { xmax: string; xlabel: string; series: ExplorerSeries[] };
}

export interface Flashcard { front: string; back: string }
export interface FlashcardSpec { type: "flashcards"; id: string; title: string; cards: Flashcard[] }

/** A "mark this lesson complete" button. id is the lesson slug; it feeds the unit progress bar. */
export interface CompleteSpec { type: "complete"; id: string; label?: string }

/** Blockchain widgets: type text and watch its SHA-256 hash; edit a toy chain and re-mine it; edit a transaction and watch the Merkle root change. */
export interface HashLabSpec { type: "hashlab"; id: string; title: string; intro?: string; start: string }
export interface ChainLabSpec { type: "chainlab"; id: string; title: string; intro?: string; blocks: string[]; difficulty: number }
export interface MerkleSpec { type: "merkle"; id: string; title: string; intro?: string; txs: string[] }

export type WidgetSpec = QuizSpec | JournalSpec | EquationSpec | ExplorerSpec | FlashcardSpec | CompleteSpec | HashLabSpec | ChainLabSpec | MerkleSpec;
export const WIDGET_TYPES = ["quiz", "journal", "equation", "explorer", "flashcards", "complete", "hashlab", "chainlab", "merkle"] as const;
