/**
 * Draw a post's cover image (1200 x 630, also the social card) from the post itself, so every blog image shares one look.
 *   npx tsx scripts/blog-cover.ts <slug>
 * Writes public/blog/<slug>.png. The title, kicker and chips come from the post fields; only the artwork on the right is fixed.
 */
import path from "node:path";
import sharp from "sharp";
import { LOCAL_POSTS } from "../lib/blog/local";

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FONT = "Segoe UI, Arial, Helvetica, sans-serif";

const short = (t: string, n = 30): string => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t);

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

const slug = process.argv[2];
const post = LOCAL_POSTS.find((p) => p.slug === slug);
if (!post) throw new Error(`usage: npx tsx scripts/blog-cover.ts <slug>  (known: ${LOCAL_POSTS.map((p) => p.slug).join(", ")})`);

const T = '<g filter="url(#sh)" transform="translate(660,48) rotate(-5 100 60)">';
const ARTS: Record<string, string> = {
  docs: "<g filter=\"url(#sh)\" transform=\"translate(660,48) rotate(-5 100 60)\"><rect width=\"150\" height=\"190\" rx=\"10\" fill=\"#fff\"/><rect width=\"150\" height=\"22\" rx=\"10\" fill=\"#2b579a\"/><rect y=\"12\" width=\"150\" height=\"10\" fill=\"#2b579a\"/><rect x=\"16\" y=\"44\" width=\"84\" height=\"9\" rx=\"3\" fill=\"#14213d\"/><g fill=\"#cbd5e1\"><rect x=\"16\" y=\"64\" width=\"116\" height=\"6\" rx=\"3\"/><rect x=\"16\" y=\"78\" width=\"104\" height=\"6\" rx=\"3\"/><rect x=\"16\" y=\"92\" width=\"116\" height=\"6\" rx=\"3\"/></g><g fill=\"#94a3b8\"><circle cx=\"20\" cy=\"118\" r=\"3\"/><rect x=\"30\" y=\"115\" width=\"80\" height=\"6\" rx=\"3\"/><circle cx=\"20\" cy=\"134\" r=\"3\"/><rect x=\"30\" y=\"131\" width=\"66\" height=\"6\" rx=\"3\"/></g></g>",
  code: T + '<rect width="190" height="150" rx="12" fill="#14213d"/><circle cx="16" cy="16" r="5" fill="#ef4444"/><circle cx="32" cy="16" r="5" fill="#f59e0b"/><circle cx="48" cy="16" r="5" fill="#22c55e"/><rect x="18" y="40" width="70" height="8" rx="4" fill="#f9a56b"/><rect x="34" y="60" width="110" height="8" rx="4" fill="#93c5fd"/><rect x="34" y="80" width="84" height="8" rx="4" fill="#86efac"/><rect x="34" y="100" width="124" height="8" rx="4" fill="#93c5fd"/><rect x="18" y="122" width="52" height="8" rx="4" fill="#f9a56b"/></g>',
  chart: T + '<rect width="190" height="160" rx="12" fill="#fff"/><rect x="20" y="26" width="60" height="8" rx="4" fill="#cbd5e1"/><rect x="24" y="100" width="22" height="40" rx="4" fill="#fdba74"/><rect x="56" y="76" width="22" height="64" rx="4" fill="#fb923c"/><rect x="88" y="56" width="22" height="84" rx="4" fill="#ea580c"/><rect x="120" y="86" width="22" height="54" rx="4" fill="#fb923c"/><rect x="152" y="46" width="22" height="94" rx="4" fill="#9c3a11"/></g>',
  web: T + '<rect width="200" height="156" rx="12" fill="#fff"/><rect width="200" height="26" rx="12" fill="#e5e7eb"/><rect y="14" width="200" height="12" fill="#e5e7eb"/><rect x="40" y="8" width="120" height="10" rx="5" fill="#fff"/><rect x="14" y="40" width="172" height="34" rx="6" fill="#fdba74"/><rect x="14" y="84" width="82" height="54" rx="6" fill="#bfdbfe"/><rect x="104" y="84" width="82" height="54" rx="6" fill="#bbf7d0"/></g>',
  audio: T + '<rect width="190" height="150" rx="14" fill="#14213d"/><rect x="26" y="62" width="12" height="28" rx="6" fill="#fdba74"/><rect x="48" y="40" width="12" height="72" rx="6" fill="#fb923c"/><rect x="70" y="22" width="12" height="108" rx="6" fill="#f97316"/><rect x="92" y="48" width="12" height="56" rx="6" fill="#fb923c"/><rect x="114" y="30" width="12" height="92" rx="6" fill="#f97316"/><rect x="136" y="56" width="12" height="40" rx="6" fill="#fdba74"/><rect x="158" y="68" width="12" height="16" rx="6" fill="#fed7aa"/></g>',
  math: T + '<rect width="190" height="150" rx="12" fill="#fff"/><text x="22" y="62" font-size="46" font-weight="800" fill="#9c3a11">\u03A3</text><text x="86" y="62" font-size="46" font-weight="800" fill="#14213d">\u221A</text><text x="138" y="62" font-size="40" font-weight="800" fill="#ea580c">\u03C0</text><text x="22" y="116" font-size="30" font-weight="700" fill="#64748b">x\u00B2 + y\u00B2</text></g>',
};
const style = post.coverStyle;
const art = ARTS[style?.art ?? "docs"];
const [mainRaw, subRaw] = post.seoTitle.split(/:\s*/);
const main = wrap(mainRaw, 18);
const sub = subRaw ?? "";
const chips = style?.chips ?? ["Every answer explained", "Free, no sign-up"];
const q = post.quiz?.questions[4];

const titleSvg = main.map((l, i) => `<text x="64" y="${230 + i * 76}" font-size="68" font-weight="800" fill="#14213d">${esc(l)}</text>`).join("");
const subY = 230 + main.length * 76 + 6;
let cx = 64;
const chipSvg = chips.map((c) => {
  const w = c.length * 11.2 + 36;
  const g = `<g transform="translate(${cx},${subY + 44})"><rect width="${w}" height="40" rx="20" fill="#fff" stroke="#e9d5c6"/><text x="${w / 2}" y="26" text-anchor="middle" font-size="18" font-weight="600" fill="#9c3a11">${esc(c)}</text></g>`;
  cx += w + 12;
  return g;
}).join("");

const options = (q?.options ?? ["150", "100", "An error message", "0"]).map((o, i) => {
  const right = i === (q?.answer ?? 1);
  const y = 196 + i * 58;
  return `<g transform="translate(0,${y})"><rect x="26" width="364" height="46" rx="12" fill="${right ? "#dcfce7" : "#f6f4ef"}" stroke="${right ? "#16a34a" : "#e5e1d8"}" stroke-width="2"/><circle cx="52" cy="23" r="10" fill="${right ? "#16a34a" : "#fff"}" stroke="${right ? "#16a34a" : "#b8b2a4"}" stroke-width="2"/>${right ? `<path d="M47 23l4 4 7-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}<text x="76" y="30" font-size="19" fill="#1f2937" font-weight="${right ? 700 : 500}">${esc(short(String(o)))}</text></g>`;
}).join("");
const qLines = wrap(q?.q ?? "Cells B2 to B6 hold 10, 20, 30, 40 and 50. What does =SUM(B2:B5) return?", 34).slice(0, 3);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="${FONT}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8f2"/><stop offset="1" stop-color="#ffe0cc"/></linearGradient>
<filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#7c2d12" flood-opacity="0.22"/></filter>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="1090" cy="70" r="150" fill="#fff" opacity="0.55"/><circle cx="560" cy="640" r="120" fill="#ffd2b5" opacity="0.5"/>
<rect x="64" y="64" width="${post.category.length * 13 + 56}" height="40" rx="20" fill="#9c3a11"/><text x="${64 + (post.category.length * 13 + 56) / 2}" y="91" text-anchor="middle" font-size="18" font-weight="700" fill="#fff" letter-spacing="1.5">${esc(post.category.toUpperCase())}</text>
${titleSvg}
<text x="64" y="${subY + 8}" font-size="34" font-weight="600" fill="#9c3a11">${esc(sub)}</text>
${chipSvg}
<text x="64" y="590" font-size="20" font-weight="700" fill="#14213d">GrowQR</text><text x="150" y="590" font-size="20" fill="#6b7280">${esc(style?.footer ?? "Free course: Digital Literacy, learn by doing")}</text>

${art}
<g filter="url(#sh)" transform="translate(728,128)"><rect width="416" height="${196 + 4 * 58 + 12}" rx="22" fill="#fff"/>
<rect x="26" y="26" width="64" height="30" rx="15" fill="#fff1e8"/><text x="58" y="47" text-anchor="middle" font-size="17" font-weight="800" fill="#9c3a11">Q5</text><text x="${416 - 26}" y="47" text-anchor="end" font-size="16" fill="#6b7280">of ${post.quiz?.questions.length ?? 15}</text>
${qLines.map((l, i) => `<text x="26" y="${88 + i * 28}" font-size="21" font-weight="700" fill="#14213d">${esc(l)}</text>`).join("")}
${options}</g>
</svg>`;

const out = path.resolve(__dirname, "../public/blog", `${post.slug}.png`);
sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out).then((i) => console.log(out, i.width + "x" + i.height, Math.round(i.size / 1024) + " KB"));
