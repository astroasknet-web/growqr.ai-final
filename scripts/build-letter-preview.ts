/**
 * Renders the appointment letter with the sample values, then prints it to PDF.
 *
 *   npx tsx scripts/build-letter-preview.ts [outdir]
 *
 * The PDF is produced by headless Chrome driving the same @page rules the
 * browser's own print dialog would use, so the downloadable file and a manual
 * "save as PDF" are the same document. That matters: a rasterising PDF library
 * would give us blurry text and a letter nobody wants to sign.
 */
import { writeFileSync, mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { renderAppointmentLetter, SAMPLE_LETTER } from "@/lib/internship/appointment-letter";
import { inlineLogo } from "./lib-preview-logo";

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

function findChrome(): string | null {
  return CHROME_CANDIDATES.find((p) => existsSync(p)) ?? null;
}

const outDir = process.argv[2] ?? "public/internal";
mkdirSync(resolve(outDir), { recursive: true });

const htmlPath = join(resolve(outDir), "appointment-letter.html");
const pdfPath = join(resolve(outDir), "appointment-letter.pdf");

writeFileSync(
  htmlPath,
  inlineLogo(renderAppointmentLetter(SAMPLE_LETTER, { pdfHref: "appointment-letter.pdf" })),
);
console.log(`HTML  ${htmlPath}`);

const chrome = findChrome();
if (!chrome) {
  console.warn("No Chrome found, skipping the PDF. The Print button still works.");
  process.exit(0);
}

// A throwaway profile keeps this off the user's real Chrome, which refuses to
// run headless while a normal window holds the default profile lock.
const profile = join(resolve(outDir), ".chrome-profile");
rmSync(pdfPath, { force: true });

// Chrome routinely exits non-zero after a successful headless print (allocator
// and GPU warnings on shutdown), so the exit code is not the signal. Whether
// the file landed is.
try {
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--user-data-dir=${profile}`,
      "--no-pdf-header-footer",
      "--virtual-time-budget=8000",
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: "pipe", timeout: 90_000 },
  );
} catch {
  // fall through to the existence check below
}

rmSync(profile, { recursive: true, force: true });

if (!existsSync(pdfPath)) {
  console.error("Chrome ran but produced no PDF.");
  process.exit(1);
}
console.log(`PDF   ${pdfPath}  (${Math.round(statSync(pdfPath).size / 1024)}KB)`);
