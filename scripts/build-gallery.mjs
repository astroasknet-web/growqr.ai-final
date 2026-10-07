/**
 * Builds the /gallery photo set from the company photo library.
 *
 * Run with `npm run gallery:build`. Idempotent — safe to re-run any time the
 * curation below changes.
 *
 * The source library lives OUTSIDE the repo, in the Desktop archive. It used
 * to sit in public/Event Photos/, but that was ~91MB of originals inside the
 * deploy directory, none of it ever served. Point GALLERY_SOURCE at the
 * library if you move it.
 *
 * Pipeline:
 *   <archive>/01 Source library/    (source of truth, only ever READ)
 *     -> <archive>/02 Selected/     the curated keepers
 *     -> <archive>/03 Removed/      everything cut, filed under why
 *     -> public/gallery/*.webp      480/960/1600 derivatives actually served
 *     -> lib/gallery/gallery-data.ts  typed manifest the page imports
 *     -> gallery-assets/review/     the written record, small enough to commit
 *
 * The curation itself (SELECTED / REJECTED) was made by eye against contact
 * sheets in gallery-assets/review/ — every one of the 114 source images is
 * accounted for in exactly one of the two lists, and the script asserts that.
 * The `id` on each entry is its cell on those contact sheets, so a decision
 * can always be traced back to the frame it was made on.
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE =
  process.env.GALLERY_ARCHIVE ??
  path.join(process.env.HOME ?? "", "Desktop/GrowQR Gallery Archive");
const SOURCE = process.env.GALLERY_SOURCE ?? path.join(ARCHIVE, "01 Source library");
// Read straight from the library. An earlier version mirrored it into
// gallery-assets/original/ first, which bought nothing and cost a second 91MB
// copy, so the mirror is gone and ORIGINAL simply IS the source.
const ORIGINAL = SOURCE;
const SELECTED_DIR = path.join(ARCHIVE, "02 Selected");
const REMOVED_DIR = path.join(ARCHIVE, "03 Removed");
const REVIEW_DIR = path.join(ROOT, "gallery-assets/review");
const WEB_DIR = path.join(ROOT, "public/gallery");

/** Widths emitted, by the role the image plays. Never upscales past the source.
 *
 *  An ordinary masonry tile is 437 CSS px at its widest (a third of the 1360px
 *  grid) and full-bleed ~390-500px on mobile, so 960 already gives it better
 *  than 2x density. Emitting a third tier above that only ever served DPR-3
 *  devices, and cost 2.3MB — 37% of everything on disk — to hand phones on
 *  mobile data a file they cannot resolve the difference of. Feature bands are
 *  different: they render 900 CSS px wide, so they genuinely need 1600 for
 *  retina and keep the full ladder. */
const WIDTHS_FEATURE = [480, 960, 1600];
const WIDTHS_TILE = [480, 960];

// ── Institutions ────────────────────────────────────────────────────────────
// `date` is set only where a capture date is actually verifiable (EXIF, or the
// date in a WhatsApp export filename). The rest carry no date rather than a
// guessed one, and the UI simply omits the line.
const LOCATIONS = {
  aditya: { name: "Aditya University", place: "Surampalem, Andhra Pradesh" },
  andhra: { name: "Andhra University", place: "Visakhapatnam, Andhra Pradesh" },
  banasthali: { name: "Banasthali Vidyapith", place: "Niwai, Rajasthan" },
  iti: { name: "Government ITI", place: "Kakinada, Andhra Pradesh" },
  lawcollege: { name: "Government Law College", place: "Sri Ganganagar, Rajasthan" },
  kanoria: { name: "Kanoria PG Mahila Mahavidyalaya", place: "Jaipur, Rajasthan" },
  jnu: { name: "Jaipur National University", place: "Jaipur, Rajasthan", date: "August 2026" },
  ibb: { name: "IBB College of Physiotherapy", place: "Kota, Rajasthan" },
  lbshm: { name: "LBS College of Hotel Management", place: "Kota, Rajasthan" },
  lbs: { name: "LBS Group of Institutions", place: "Kota, Rajasthan" },
  lordbuddha: { name: "Lord Buddha Institute of Technology", place: "Kota, Rajasthan" },
  lpu: { name: "Lovely Professional University", place: "Phagwara, Punjab", date: "August 2026" },
  poddar: { name: "Poddar Business School", place: "Jaipur, Rajasthan" },
  xaviers: { name: "St. Xavier's College", place: "Jaipur, Rajasthan", date: "August 2026" },
  vgu: { name: "Vivekananda Global University", place: "Jaipur, Rajasthan" },
};

// ── The keepers, in running order ───────────────────────────────────────────
// `feature: true` opens a full-width band that interrupts the masonry. A band
// is a PAIR: the feature runs two columns wide and the entry immediately after
// it (`companion: true`) fills the third column beside it, so the band never
// leaves a dead column of whitespace.
//
// The pairing is chosen by shape, not at random. A band is as tall as its
// feature, so the companion has to be about `columnWidth / bandHeight` in
// aspect or it gets cropped hard:
//   3:2 feature  -> band is ~599px tall -> companion wants ~0.73 (a 3:4 portrait)
//   1.96 feature -> band is ~458px tall -> companion wants ~0.95 (near square)
// Every pair below is matched that way, so companions crop by only a few
// percent. Re-pairing without redoing that arithmetic will cut heads off.
const SELECTED = [
  { id: "20-06", loc: "xaviers", slug: "xaviers-cohort-stage", feature: true, caption: "The cohort on stage" },
  { id: "9-16", loc: "jnu", slug: "jnu-auditorium", companion: true, caption: "Addressing the auditorium" },
  { id: "3-05", loc: "banasthali", slug: "banasthali-student-question", caption: "A student takes the floor" },
  { id: "20-01", loc: "xaviers", slug: "xaviers-stage", caption: "The AI Agents Platform session opens" },
  { id: "2-02", loc: "andhra", slug: "andhra-gate", caption: "The main gate" },
  { id: "15-10", loc: "lpu", slug: "lpu-address", caption: "First, solve the problem" },
  { id: "12-01", loc: "lbshm", slug: "lbshm-session", caption: "A session under way" },

  { id: "3-04", loc: "banasthali", slug: "banasthali-full-house", feature: true, caption: "The Crack the Interview camp, at capacity" },
  { id: "18-01", loc: "poddar", slug: "poddar-visit", companion: true, caption: "On campus at Poddar" },
  { id: "20-05", loc: "xaviers", slug: "xaviers-felicitation", caption: "Felicitation on stage" },
  { id: "13-01", loc: "lbs", slug: "lbs-handshake", caption: "A partnership begins" },
  { id: "11-03", loc: "ibb", slug: "ibb-hall", caption: "The hall in session" },
  { id: "1-02", loc: "aditya", slug: "aditya-campus", caption: "Arriving on campus" },
  { id: "8-13", loc: "jnu", slug: "jnu-ai-era", caption: "Digital professional branding in the AI era" },
  { id: "3-03", loc: "banasthali", slug: "banasthali-masterclass", caption: "Crack the Interview: the training camp" },
  { id: "9-08", loc: "jnu", slug: "jnu-linkedin-hall", caption: "Personal branding on LinkedIn" },
  { id: "3-08", loc: "banasthali", slug: "banasthali-cohort", caption: "The cohort, together" },

  { id: "20-04", loc: "xaviers", slug: "xaviers-scan-to-begin", feature: true, caption: "Scan to begin" },
  { id: "15-08", loc: "lpu", slug: "lpu-qr", companion: true, caption: "One code, the whole room" },
  { id: "14-03", loc: "lordbuddha", slug: "lordbuddha-scanning", caption: "Phones out, scanning in" },
  { id: "15-09", loc: "lpu", slug: "lpu-cohort", caption: "The cohort in the main auditorium" },
  { id: "12-02", loc: "lbshm", slug: "lbshm-students", caption: "Between exercises" },
  { id: "15-05", loc: "lpu", slug: "lpu-certificate", caption: "Recognised by the faculty" },
  { id: "15-01", loc: "lpu", slug: "lpu-certificate-flags", caption: "Certificates presented" },
  { id: "5-01", loc: "lawcollege", slug: "lawcollege-seminar", caption: "A seminar in session" },
  { id: "8-03", loc: "jnu", slug: "jnu-felicitation", caption: "Felicitation at the podium" },
  { id: "2-01", loc: "andhra", slug: "andhra-centenary", caption: "A century of excellence" },
  { id: "3-06", loc: "banasthali", slug: "banasthali-qa", caption: "Working through a question, live" },

  { id: "20-03", loc: "xaviers", slug: "xaviers-auditorium-full", feature: true, caption: "A full house at the Orientation Odyssey" },
  { id: "9-15", loc: "jnu", slug: "jnu-stage", companion: true, caption: "From the stage" },
  { id: "13-02", loc: "lbs", slug: "lbs-lou", caption: "The Letter of Understanding, signed" },
  { id: "11-04", loc: "ibb", slug: "ibb-faculty", caption: "Faculty and team" },
  { id: "1-01", loc: "aditya", slug: "aditya-handshake", caption: "An agreement, made" },
  { id: "10-01", loc: "kanoria", slug: "kanoria-visit", caption: "On campus at Kanoria" },
  { id: "4-01", loc: "iti", slug: "iti-handshake", caption: "Signed at Kakinada" },
  { id: "22-01", loc: "vgu", slug: "vgu-visit", caption: "On campus at VGU" },
];

// ── The cuts, filed under why ───────────────────────────────────────────────
// Nothing is deleted; each of these is copied into gallery-assets/removed/<reason>/
// keeping its original event folder, so any call here can be reversed.
const REJECTED = {
  "burned-in camera or GPS watermark": [
    "8-01", "8-02", "11-01", "11-02", "15-11", "15-12", "15-13", "15-14", "15-15", "15-16",
    "16-01", "16-02", "16-03", "16-04", "16-05", "16-06",
    "19-01", "19-02", "19-03", "19-04", "19-05", "19-06", "19-07",
  ],
  "screenshot, video still or padded export": ["4-04", "4-05", "13-03"],
  "press clipping, not photography": ["17-01", "17-02", "17-03", "17-04", "17-05"],
  "duplicate or near-duplicate": [
    "8-08", "8-11", "8-12", "9-01", "9-02", "9-03", "9-04", "9-05", "9-06", "9-07",
    "9-09", "9-10", "9-11", "9-12", "9-13", "9-14", "12-03", "14-05", "14-06",
    "15-03", "15-06", "15-07",
  ],
  "soft focus or weak exposure": ["3-02", "3-07", "4-03", "6-01", "8-05", "8-07", "8-10", "8-14", "20-02"],
  "weak composition or adds nothing new": [
    "2-03", "3-01", "4-02", "7-01", "8-04", "8-06", "8-09", "8-15", "8-16",
    "11-05", "14-01", "14-02", "14-04", "15-02", "15-04", "21-01",
  ],
};

const isImage = (n) => /\.(jpe?g|png|webp)$/i.test(n);

// ── Column balancing ────────────────────────────────────────────────────────
// SELECTED above fixes the editorial sequence and which frames are feature
// bands. It does NOT fix the order inside each block, and it shouldn't: CSS
// multi-column balances by height, so an unlucky run of tall portraits leaves
// one column ending hundreds of pixels short of its neighbours and the block
// bottom reads as a hole rather than an edge.
//
// So: simulate what the browser will do with a given order, then reorder
// within each block (never across a feature band, never moving a band) to
// even the columns out. The result is an order chosen for how it lands, which
// is the difference between art-directed and merely algorithmic.

/** Item height as a multiple of column width, plus the 24px bottom margin. */
const unitHeight = (m) => m.height / m.width + 24 / 437;

/**
 * Models CSS `column-fill: balance` as what it actually is: split the items
 * into `cols` CONTIGUOUS runs (column order follows source order) such that
 * the tallest run is as short as possible. Solved exactly by DP — n is tiny.
 *
 * An earlier version binary-searched a fill height and padded unused columns
 * with zero, which reported a phantom 2.19 spread for any block chunky enough
 * to settle into two columns and made the optimiser give up on it.
 */
function simulateColumns(items, cols) {
  const hs = items.map(unitHeight);
  const n = hs.length;
  if (n === 0) return new Array(cols).fill(0);
  const k = Math.min(cols, n);
  const prefix = [0];
  for (const h of hs) prefix.push(prefix[prefix.length - 1] + h);
  const sum = (i, j) => prefix[j] - prefix[i];

  // best[j][i] = minimal achievable max-run-sum splitting items[i..] into j runs
  const best = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity));
  const cut = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(n));
  for (let i = 0; i <= n; i++) best[0][i] = i === n ? 0 : Infinity;
  for (let j = 1; j <= k; j++) {
    for (let i = n; i >= 0; i--) {
      if (i === n) {
        best[j][i] = 0;
        continue;
      }
      for (let m = i + 1; m <= n; m++) {
        const worst = Math.max(sum(i, m), best[j - 1][m]);
        if (worst < best[j][i]) {
          best[j][i] = worst;
          cut[j][i] = m;
        }
      }
    }
  }
  const heights = [];
  let i = 0;
  for (let j = k; j >= 1 && i < n; j--) {
    const m = cut[j][i];
    heights.push(sum(i, m));
    i = m;
  }
  while (heights.length < cols) heights.push(0);
  return heights;
}

/** Spread of the resulting columns. Lower is flusher. */
function imbalance(items, cols) {
  const h = simulateColumns(items, cols);
  return Math.max(...h) - Math.min(...h);
}

/**
 * Score an ordering: mostly column flushness at the 3-column desktop layout,
 * with the 2-column tablet layout weighted in so one breakpoint is not fixed
 * at the other's expense, plus a nudge away from putting two frames from the
 * same institution next to each other.
 */
function scoreOrder(items) {
  let repeats = 0;
  for (let i = 1; i < items.length; i++) if (items[i].loc === items[i - 1].loc) repeats++;
  return 2 * imbalance(items, 3) + 0.35 * imbalance(items, 2) + 0.08 * repeats;
}

/** Deterministic PRNG so a given curation always produces the same page. */
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Best ordering found for one block, by repeated restarts + pair swaps. */
function balanceBlock(block) {
  const rand = mulberry32(block.length * 7919 + 13);
  let best = block.slice();
  let bestScore = scoreOrder(best);
  for (let restart = 0; restart < 400; restart++) {
    const cur = restart === 0 ? block.slice() : block.slice().sort(() => rand() - 0.5);
    let curScore = scoreOrder(cur);
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < cur.length; i++) {
        for (let j = i + 1; j < cur.length; j++) {
          [cur[i], cur[j]] = [cur[j], cur[i]];
          const s = scoreOrder(cur);
          if (s < curScore - 1e-9) {
            curScore = s;
            improved = true;
          } else {
            [cur[i], cur[j]] = [cur[j], cur[i]];
          }
        }
      }
    }
    if (curScore < bestScore) {
      bestScore = curScore;
      best = cur.slice();
    }
  }
  return best;
}

/**
 * Second pass: let images move BETWEEN blocks, not just within them.
 *
 * Ordering inside a fixed block can only do so much — a block holding five
 * portraits and one landscape has a floor on how flush it can get, because the
 * columns must be contiguous runs of the source order. Letting a frame migrate
 * to a neighbouring block removes that floor, and is what closes the last of
 * the ragged column bottoms.
 *
 * Block sizes are held between MIN and MAX so the bands stay roughly evenly
 * spaced down the page rather than collapsing into one long run.
 */
const MIN_BLOCK = 3;
const MAX_BLOCK = 13;

function orderCheaply(block) {
  // Same local search as balanceBlock but with few restarts — this runs
  // thousands of times inside the move search below.
  let best = block.slice();
  let bestScore = scoreOrder(best);
  const rand = mulberry32(block.length * 104729 + 7);
  for (let r = 0; r < 8; r++) {
    const cur = r === 0 ? block.slice() : block.slice().sort(() => rand() - 0.5);
    let curScore = scoreOrder(cur);
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < cur.length; i++)
        for (let j = i + 1; j < cur.length; j++) {
          [cur[i], cur[j]] = [cur[j], cur[i]];
          const sc = scoreOrder(cur);
          if (sc < curScore - 1e-9) {
            curScore = sc;
            improved = true;
          } else [cur[i], cur[j]] = [cur[j], cur[i]];
        }
    }
    if (curScore < bestScore) {
      bestScore = curScore;
      best = cur.slice();
    }
  }
  return { order: best, score: bestScore };
}

function rebalanceAcrossBlocks(blocks) {
  let cur = blocks.map((b) => orderCheaply(b));
  let total = cur.reduce((a, x) => a + x.score, 0);

  for (let sweep = 0; sweep < 14; sweep++) {
    let moved = false;
    for (let from = 0; from < cur.length; from++) {
      for (let to = 0; to < cur.length; to++) {
        if (from === to) continue;
        if (cur[from].order.length <= MIN_BLOCK) continue;
        if (cur[to].order.length >= MAX_BLOCK) continue;
        for (let k = 0; k < cur[from].order.length; k++) {
          const item = cur[from].order[k];
          const nextFrom = orderCheaply(cur[from].order.filter((_, i) => i !== k));
          const nextTo = orderCheaply([...cur[to].order, item]);
          const delta =
            nextFrom.score + nextTo.score - cur[from].score - cur[to].score;
          if (delta < -1e-9) {
            cur[from] = nextFrom;
            cur[to] = nextTo;
            total += delta;
            moved = true;
            break;
          }
        }
      }
    }
    if (!moved) break;
  }
  // Final polish with the thorough search.
  return cur.map((x) => balanceBlock(x.order));
}

/**
 * Reorder within each run of masonry items, leaving the bands in place.
 * A feature and the companion that follows it are one unit and never move
 * apart — the renderer relies on the companion sitting at feature index + 1.
 */
function balanceRunningOrder(items) {
  // Split into bands and the masonry blocks between them.
  const bands = [];
  const blocks = [];
  let block = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.feature) {
      blocks.push(block);
      block = [];
      const next = items[i + 1];
      if (!next?.companion) {
        throw new Error(`feature "${it.slug}" is not followed by a companion entry`);
      }
      bands.push([it, next]);
      i++;
    } else if (it.companion) {
      throw new Error(`companion "${it.slug}" does not follow a feature entry`);
    } else block.push(it);
  }
  blocks.push(block);

  const balanced = rebalanceAcrossBlocks(blocks.filter((b) => b.length));
  let bi = 0;
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].length) out.push(...balanced[bi++]);
    if (bands[i]) out.push(...bands[i]);
  }
  return out;
}

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function copyInto(relPath, destRoot) {
  const dest = path.join(destRoot, relPath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(path.join(ORIGINAL, relPath), dest);
}

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    throw new Error(
      `source library not found at:\n  ${SOURCE}\n` +
        `Set GALLERY_SOURCE=/path/to/library (or GALLERY_ARCHIVE) and re-run.`
    );
  }

  // 1. Rebuild the contact-sheet index so ids stay stable across runs.
  //    Ids are assigned by folder (alphabetical), then filename, in blocks of
  //    16 — exactly the order the review sheets were rendered in.
  const files = (await walk(ORIGINAL)).filter((f) => isImage(path.basename(f))).sort();
  const groups = new Map();
  for (const f of files) {
    const d = path.dirname(path.relative(ORIGINAL, f));
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(path.relative(ORIGINAL, f));
  }
  const byId = {};
  let sheet = 0;
  // Plain code-unit sort, NOT localeCompare: the review sheets were numbered
  // this way, and locale collation orders "Lord Buddha…" before "LoU" (it
  // ignores case) where a code-unit sort does the reverse. Switching would
  // silently renumber every id from sheet 13 on and repoint the curation.
  for (const [, items] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    items.sort();
    for (let c = 0; c < items.length; c += 16) {
      sheet++;
      items.slice(c, c + 16).forEach((rel, i) => {
        byId[`${sheet}-${String(i + 1).padStart(2, "0")}`] = rel;
      });
    }
  }

  // 2. Every source image must be decided on, exactly once.
  const selIds = SELECTED.map((s) => s.id);
  const rejIds = Object.values(REJECTED).flat();
  const allIds = Object.keys(byId);
  const dupes = [...selIds, ...rejIds].filter((v, i, a) => a.indexOf(v) !== i);
  const unknown = [...selIds, ...rejIds].filter((v) => !allIds.includes(v));
  const undecided = allIds.filter((v) => !selIds.includes(v) && !rejIds.includes(v));
  if (dupes.length || unknown.length || undecided.length) {
    throw new Error(
      `curation is inconsistent — decided twice: [${dupes}], unknown id: [${unknown}], undecided: [${undecided}]`
    );
  }

  // 3. Sort the originals into selected/ and removed/ in the archive.
  await fs.rm(SELECTED_DIR, { recursive: true, force: true });
  await fs.rm(REMOVED_DIR, { recursive: true, force: true });
  for (const s of SELECTED) await copyInto(byId[s.id], SELECTED_DIR);
  for (const [reason, ids] of Object.entries(REJECTED))
    for (const id of ids) await copyInto(byId[id], path.join(REMOVED_DIR, reason));

  // 4. Transcode. sharp drops EXIF/ICC unless asked to keep it, so the served
  //    files carry no camera, GPS or timestamp metadata.
  await fs.rm(WEB_DIR, { recursive: true, force: true });
  await fs.mkdir(WEB_DIR, { recursive: true });
  const manifest = [];
  let inBytes = 0;
  let outBytes = 0;

  for (const s of SELECTED) {
    const src = path.join(ORIGINAL, byId[s.id]);
    inBytes += (await fs.stat(src)).size;
    const meta = await sharp(src).metadata();
    const turned = meta.orientation && meta.orientation >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;

    const ladder = s.feature ? WIDTHS_FEATURE : WIDTHS_TILE;
    const widths = ladder.filter((w) => w <= width);
    // A source narrower than the whole ladder still gets its own native width,
    // so a feature band is never served something smaller than it has.
    if (!widths.includes(width) && width < Math.max(...ladder)) widths.push(width);
    if (widths.length === 0) widths.push(width);

    const sources = [];
    for (const w of widths.sort((a, b) => a - b)) {
      const file = `${s.slug}-${w}.webp`;
      const info = await sharp(src)
        .rotate() // bake in EXIF orientation before it is stripped
        .resize(w, null, { withoutEnlargement: true, kernel: "lanczos3" })
        .webp({ quality: w >= 1600 ? 80 : 76, effort: 6, smartSubsample: true })
        .toFile(path.join(WEB_DIR, file));
      outBytes += info.size;
      sources.push({ file, w: info.width });
    }

    const lqip = await sharp(src)
      .rotate()
      .resize(20, null, { fit: "inside" })
      .blur(1)
      .webp({ quality: 28 })
      .toBuffer();

    const L = LOCATIONS[s.loc];
    manifest.push({
      loc: s.loc, // build-time only, for the balancer; not emitted
      slug: s.slug,
      width,
      height,
      feature: Boolean(s.feature),
      companion: Boolean(s.companion),
      src: `/gallery/${sources[sources.length - 1].file}`,
      srcSet: sources.map((x) => `/gallery/${x.file} ${x.w}w`).join(", "),
      lqip: `data:image/webp;base64,${lqip.toString("base64")}`,
      location: L.name,
      place: L.place,
      date: L.date ?? null,
      caption: s.caption,
    });
  }

  // 5. Even out the columns without disturbing the editorial sequence.
  const before = manifest;
  const ordered = balanceRunningOrder(manifest);
  const runs = (list) => {
    const out = [];
    let b = [];
    for (const it of list) {
      // Features AND their companions both sit outside the masonry flow.
      if (it.feature || it.companion) {
        if (b.length) out.push(b);
        b = [];
      } else b.push(it);
    }
    if (b.length) out.push(b);
    return out;
  };
  const spread = (list) =>
    runs(list)
      .map((b) => imbalance(b, 3).toFixed(2))
      .join(", ");
  console.log(`column spread (3-col, in column-widths)`);
  console.log(`  before balancing  ${spread(before)}`);
  console.log(`  after balancing   ${spread(ordered)}`);

  // 6. Emit the typed module the page imports.
  const esc = (v) => JSON.stringify(v);
  const body = ordered
    .map(
      (m) => `  {
    slug: ${esc(m.slug)},
    width: ${m.width},
    height: ${m.height},
    feature: ${m.feature},
    companion: ${m.companion},
    src: ${esc(m.src)},
    srcSet: ${esc(m.srcSet)},
    lqip: ${esc(m.lqip)},
    location: ${esc(m.location)},
    place: ${esc(m.place)},
    date: ${m.date ? esc(m.date) : "null"},
    caption: ${esc(m.caption)},
  },`
    )
    .join("\n");

  await fs.mkdir(path.join(ROOT, "lib/gallery"), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, "lib/gallery/gallery-data.ts"),
    `// GENERATED by scripts/build-gallery.mjs — do not edit by hand.
// Curation and captions live in that script; re-run \`npm run gallery:build\`
// after changing them.
//
// Every entry carries its intrinsic width/height so the grid can reserve the
// exact box before the file loads (zero layout shift), plus a ~100-byte inline
// WebP placeholder that paints immediately behind the real image.

export type GalleryImage = {
  slug: string;
  /** Intrinsic size of the largest derivative. Drives the reserved aspect box. */
  width: number;
  height: number;
  /** Opens a full-width band, two columns wide. */
  feature: boolean;
  /** Fills the third column beside the feature that precedes it. */
  companion: boolean;
  src: string;
  srcSet: string;
  /** Inline base64 WebP shown until the real file decodes. */
  lqip: string;
  location: string;
  place: string;
  date: string | null;
  caption: string;
};

export const galleryImages: GalleryImage[] = [
${body}
];

/** Distinct institutions represented, in first-appearance order. */
export const galleryLocations: string[] = Array.from(
  new Set(galleryImages.map((i) => i.location))
);
`
  );

  // 7. Review artefacts.
  await fs.mkdir(REVIEW_DIR, { recursive: true });
  await fs.writeFile(
    path.join(REVIEW_DIR, "curation-index.json"),
    JSON.stringify(
      {
        total: allIds.length,
        selected: SELECTED.map((s) => ({ id: s.id, slug: s.slug, file: byId[s.id] })),
        removed: Object.fromEntries(
          Object.entries(REJECTED).map(([r, ids]) => [r, ids.map((id) => byId[id])])
        ),
      },
      null,
      1
    )
  );

  const mb = (b) => `${(b / 1048576).toFixed(2)} MB`;
  console.log(`source images   ${allIds.length}`);
  console.log(`selected        ${SELECTED.length}`);
  console.log(`removed         ${rejIds.length}`);
  console.log(`institutions    ${new Set(SELECTED.map((s) => s.loc)).size}`);
  console.log(`webp files      ${manifest.reduce((a, m) => a + m.srcSet.split(",").length, 0)}`);
  console.log(`weight          ${mb(inBytes)} originals -> ${mb(outBytes)} served`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
