/**
 * Regenerates public/og-image.png — the 1200x630 default social/preview card
 * referenced by OG_IMAGE in lib/seo.ts.
 *
 * Run with `npm run og:image`. Requires Poppins to be installed locally (the
 * SVG falls back to Helvetica/Arial otherwise, which renders fine but off-brand).
 * The output is committed, so this only needs re-running when the brand line
 * or palette changes.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200;
const H = 630;

// tailwind.config.ts -> theme.extend.colors
const CREAM = "#FAFAF8";
const INK = "#1A1A1A";
const INK3 = "#525252";
const ORANGE = "#FF6A2F";

// Cream base with the site's signature warm radial bleeding in from the
// top-right, plus a short orange rule as the accent.
const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="88%" cy="10%" r="62%">
      <stop offset="0%"   stop-color="#FFB287" stop-opacity="0.55"/>
      <stop offset="38%"  stop-color="#FF8852" stop-opacity="0.26"/>
      <stop offset="70%"  stop-color="#FF6A2F" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="#FF6A2F" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <rect x="88" y="330" width="72" height="6" rx="3" fill="${ORANGE}"/>

  <text x="88" y="416" font-family="Poppins, Helvetica, Arial, sans-serif"
        font-size="62" font-weight="700" fill="${INK}" letter-spacing="-1.4">
    One QR. One Identity.
  </text>
  <text x="88" y="486" font-family="Poppins, Helvetica, Arial, sans-serif"
        font-size="62" font-weight="700" fill="${ORANGE}" letter-spacing="-1.4">
    Unlocks Growth.
  </text>
  <text x="88" y="548" font-family="Poppins, Helvetica, Arial, sans-serif"
        font-size="27" font-weight="500" fill="${INK3}">
    Specialised AI agents. Your career edge, activated.
  </text>
</svg>`;

// 385x130 source -> 400 wide, so it stays crisp at ~1.04x rather than blurring.
const logo = await sharp(`${ROOT}/public/logo.png`).resize({ width: 400 }).toBuffer();

const out = `${ROOT}/public/og-image.png`;
await sharp(Buffer.from(bg))
  .composite([{ input: logo, top: 150, left: 88 }])
  .png({ compressionLevel: 9 })
  .toFile(out);

const { width, height } = await sharp(out).metadata();
console.log(`public/og-image.png -> ${width}x${height}`);
