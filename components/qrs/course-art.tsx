import glyphs from "@/lib/market/data/course-glyphs.json";

/** Generated course cover art and category tiles (port of CourseArt.php): inline SVG, no image files, unique per course. */
const G = glyphs as Record<string, string>;
const glyph = (icon: string): string => G[icon] ?? G.sparkles ?? "";
const color = (c: string | undefined, fallback: string): string => (c && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : fallback);

export const CAT_ICON: Record<string, string> = {
  foundational: "grid", data: "chartBar", ai: "sparkles", dev: "code", cloud: "cloud", cyber: "shield", design: "palette", marketing: "megaphone", content: "play",
  business: "briefcase", finance: "rupee", entrepreneurship: "rocket", communication: "message", languages: "globe", academics: "cap", wellness: "heart", lifeskills: "shield", blockchain: "blocks",
};

export function CatTile({ cat, c1, c2 }: { cat: string; c1: string; c2: string }) {
  return (
    <span className="ct-ic" style={{ background: `linear-gradient(135deg,${color(c1, "#4338ca")},${color(c2, "#818cf8")})` }}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: glyph(CAT_ICON[cat] ?? "sparkles") }} />
    </span>
  );
}

const BLOBS = [
  '<circle cx="330" cy="40" r="72" fill="#fff" opacity=".10"/><circle cx="58" cy="212" r="54" fill="#fff" opacity=".09"/><circle cx="302" cy="205" r="30" fill="#fff" opacity=".10"/>',
  '<circle cx="70" cy="46" r="60" fill="#fff" opacity=".10"/><circle cx="342" cy="182" r="76" fill="#fff" opacity=".08"/><circle cx="205" cy="26" r="24" fill="#fff" opacity=".10"/>',
  '<circle cx="362" cy="66" r="82" fill="#fff" opacity=".09"/><circle cx="40" cy="120" r="46" fill="#fff" opacity=".09"/><circle cx="150" cy="222" r="34" fill="#fff" opacity=".10"/>',
];
const RINGS = [
  '<g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"><circle cx="326" cy="54" r="46"/><circle cx="326" cy="54" r="66"/></g>',
  '<g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"><circle cx="66" cy="196" r="42"/><circle cx="66" cy="196" r="62"/></g>',
  '<g fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="1.5"><circle cx="352" cy="200" r="40"/><circle cx="352" cy="200" r="58"/></g>',
];

export function CourseArt({ slug, c1, c2, icon, uid }: { slug: string; c1: string; c2: string; icon?: string; uid: string }) {
  let hash = 0;
  for (const ch of slug || "x") hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0;
  const v = hash % 3;
  const a = color(c1, "#4338ca");
  const b = color(c2, "#818cf8");
  const html = `<defs><linearGradient id="g${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`
    + `<radialGradient id="h${uid}" cx=".3" cy=".12" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="400" height="250" fill="url(#g${uid})"/>${BLOBS[v]}${RINGS[v]}<rect width="400" height="250" fill="url(#h${uid})"/>`
    + `<g transform="translate(200 116)"><circle r="50" fill="#fff" fill-opacity=".15"/><circle r="50" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>`
    + `<g transform="translate(-24 -24) scale(2)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyph(icon ?? "sparkles")}</g></g>`;
  return <svg className="cc-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
}
