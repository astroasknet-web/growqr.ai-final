import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The letterhead logo as a data URI.
 *
 * Production emails and PDFs reference the hosted asset, which is correct:
 * it stays cacheable and one file to update. But a preview page is often
 * viewed somewhere that will not load a remote image (a strict content
 * policy, an offline copy), and a letterhead with a missing logo is worse
 * than useless for showing people. So previews inline it.
 */
export function logoDataUri(): string {
  const bytes = readFileSync(resolve("public/emailogo.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

/** Swap every hosted-logo reference in rendered HTML for the inlined copy. */
export function inlineLogo(html: string): string {
  return html.replace(/https:\/\/www\.growqr\.ai\/emailogo\.png/g, logoDataUri());
}
