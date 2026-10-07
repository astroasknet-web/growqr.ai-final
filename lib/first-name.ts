/**
 * Extract a person's first name for email greetings, skipping leading
 * honorifics so "Dr. Ruchi Sharma" → "Ruchi" and "CA (Dr.) Ankur Bansal" →
 * "Ankur" instead of greeting them as "Hi Dr.,".
 *
 * Returns `fallback` (default "there") when no real name token is found.
 */
const TITLES = new Set([
  "dr", "mr", "mrs", "ms", "miss", "mx",
  "prof", "professor", "ca", "cs", "cma",
  "adv", "advocate", "er", "sir", "madam", "shri", "smt",
]);

export function firstName(full: string | null | undefined, fallback = "there"): string {
  if (!full) return fallback;
  const tokens = full.trim().split(/\s+/);
  for (const token of tokens) {
    // Strip surrounding punctuation/parens, e.g. "(Dr.)" → "dr", "Ruchi," → "ruchi".
    const clean = token.replace(/[().,'"]/g, "");
    if (!clean) continue;
    if (TITLES.has(clean.toLowerCase())) continue;
    // First real name token — return it without surrounding punctuation.
    return token.replace(/^[("']+|[).,"']+$/g, "");
  }
  return fallback;
}
