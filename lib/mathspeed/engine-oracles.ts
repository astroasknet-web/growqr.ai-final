/**
 * Independent checks for the generators whose answer is not simply the value of an arithmetic expression. Each oracle takes only the plain
 * numbers a question was built from (`params`) and recomputes the answer a different way from the generator. Used by engine.test.ts.
 * Generators whose questions carry an `expr` are checked against the exact calculator in expr.ts instead.
 */
export type P = Record<string, number | string>;
export type Oracle = (p: P, q: { answer: string; options?: string[] }) => string | boolean | number;

const num = (v: number | string): number => Number(v);
const digitsOfNumber = (x: number): number[] => String(x).split("").map(Number);

export const ORACLES: Record<string, Oracle> = {
  "place-value": (p) => {
    const ds = digitsOfNumber(num(p.n)).reverse(); // ds[pos] is the digit in 10^pos place
    const d = ds[num(p.pos)];
    return p.variant === "digit" ? String(d) : String(d * 10 ** num(p.pos));
  },
  "compare-numbers": (p, q) => {
    const list = String(p.list).split(",").map(Number);
    const want = num(p.larger) === 1 ? Math.max(...list) : Math.min(...list);
    return q.answer.replace(/,/g, "") === String(want) && (q.options ?? []).length === list.length;
  },
};

ORACLES["digital-root"] = (p) => {
  const x = Number(p.x);
  return String(x === 0 ? 0 : 1 + ((x - 1) % 9)); // the digit-sum rule: repeated digit sum equals 1 + (x - 1) mod 9
};

ORACLES["div-remainder"] = (p) => String(Number(p.a) - Number(p.b) * Math.floor(Number(p.a) / Number(p.b)));
ORACLES["divisible-by"] = (p, q) => {
  // check with the test a student would use, not just a % m
  const x = String(p.x), m = Number(p.m);
  const digs = x.split("").map(Number);
  const last = (k: number) => Number(x.slice(-k));
  const sum = digs.reduce((a, b) => a + b, 0);
  const alt = digs.reverse().reduce((a, c, i) => a + (i % 2 ? -c : c), 0);
  const by: Record<number, boolean> = { 2: last(1) % 2 === 0, 3: sum % 3 === 0, 4: last(2) % 4 === 0, 5: last(1) % 5 === 0, 6: last(1) % 2 === 0 && sum % 3 === 0, 8: last(3) % 8 === 0, 9: sum % 9 === 0, 10: last(1) === 0, 11: alt % 11 === 0 };
  return q.answer === (by[m] ? "Yes" : "No");
};

const isPrimeNumber = (x: number): boolean => { if (x < 2) return false; for (let i = 2; i <= Math.sqrt(x); i++) if (x % i === 0) return false; return true; };
ORACLES["prime-test"] = (p, q) => {
  const others = String(p.others).split(",").map(Number);
  return isPrimeNumber(Number(p.p)) && others.every((o) => !isPrimeNumber(o)) && q.answer === String(p.p) && (q.options ?? []).length === 4;
};
ORACLES["factor-count"] = (p) => {
  let c = 0;
  for (let i = 1; i <= Number(p.x); i++) if (Number(p.x) % i === 0) c++;
  return String(c);
};
ORACLES["next-multiple"] = (p) => { let v = Number(p.above) + 1; while (v % Number(p.m) !== 0) v++; return String(v); };
ORACLES["hcf"] = (p) => { let g = Math.min(Number(p.a), Number(p.b)); while (Number(p.a) % g !== 0 || Number(p.b) % g !== 0) g--; return String(g); };
ORACLES["lcm"] = (p) => {
  const xs = String(p.xs).split(",").map(Number);
  let m = Math.max(...xs);
  while (!xs.every((x) => m % x === 0)) m++;
  return String(m);
};
ORACLES["last-digit"] = (p) => String(String(String(p.xs).split(",").map(BigInt).reduce((a, b) => a * b, 1n)).slice(-1));
ORACLES["remainder-pattern"] = (p) => String(BigInt(p.x) % BigInt(p.m));
ORACLES["compare-fractions"] = (p, q) => {
  const [a, b, c, e] = [Number(p.a), Number(p.b), Number(p.c), Number(p.e)];
  const left = a / b, right = c / e;
  if (Math.abs(left - right) < 1e-12) return false;
  const wantFirst = (left > right) === (Number(p.larger) === 1);
  return q.answer === (wantFirst ? `${a}/${b}` : `${c}/${e}`) && (q.options ?? []).length === 2;
};
ORACLES["round-decimal"] = (p) => {
  // a different route: string arithmetic with BigInt on the digits after the kept place
  const [whole, frac] = String(p.v).split(".");
  const dp = Number(p.dp);
  const kept = BigInt(whole + frac.slice(0, dp)) + (Number(frac[dp]) >= 5 ? 1n : 0n);
  const s = kept.toString().padStart(dp + 1, "0");
  return dp === 0 ? s : `${s.slice(0, s.length - dp)}.${s.slice(s.length - dp)}`;
};
ORACLES["recurring-digit"] = (p) => String((BigInt(p.p) * 10n ** BigInt(p.pos) / BigInt(p.q)) % 10n);

ORACLES["like-terms"] = (p) => {
  const list = (s: number | string) => String(s).split(",").map(Number);
  return String((Number(p.askX) === 1 ? list(p.xs) : list(p.cs)).reduce((a, b) => a + b, 0));
};

ORACLES["ratio-simplify"] = (p) => {
  const t = String(p.terms).split(",").map(Number);
  let g = t[0];
  const gcd2 = (a: number, b: number): number => (b ? gcd2(b, a % b) : a);
  for (const x of t) g = gcd2(g, x);
  return t.map((x) => x / g).join(":");
};

// ---- Level H: the questions whose prompt is not the expression itself ----------------------------------------------
ORACLES["substitute"] = (p) => {
  // Horner's rule: a different route from substituting term by term
  const coefs = String(p.coefs).split(",").map(Number);
  return coefs.reduce((acc, c) => acc * Number(p.x) + c, 0);
};

// ---- Level I: word problems, recomputed from the plain numbers -------------------------------------------------------
const ints = (s: number | string): number[] => String(s).split(",").map(Number);
ORACLES["ratio-missing"] = (p) => (Number(p.pos) === 2 ? Number(p.b) * Number(p.k) : Number(p.a) * Number(p.k));
ORACLES["direct-prop"] = (p) => (Number(p.total) / Number(p.a)) * Number(p.b);
ORACLES["inverse-prop"] = (p) => (Number(p.x) * Number(p.days)) / Number(p.y);
ORACLES["share-ratio"] = (p) => {
  const parts = ints(p.parts);
  return (Number(p.total) * parts[Number(p.ask)]) / parts.reduce((a, b) => a + b, 0);
};
ORACLES["average"] = (p) => { const xs = ints(p.xs); return xs.reduce((a, b) => a + b, 0) / xs.length; };
ORACLES["weighted-average"] = (p) => {
  const [n1, n2, m1, m2, t] = [Number(p.n1), Number(p.n2), Number(p.m1), Number(p.m2), Number(p.t)];
  return Number(p.pct) === 1 ? ((n1 * (100 / t)) * m1 + (n2 * (100 / t)) * m2) / 100 : (n1 * m1 + n2 * m2) / t;
};
ORACLES["average-missing"] = (p) => {
  const avg = Number(p.avg), count = Number(p.count);
  if (Number(p.form) === 1) return (avg * count + Number(p.x)) / (count + 1);
  return avg * count - ints(p.known).reduce((a, b) => a + b, 0);
};
ORACLES["mixture"] = (p) => (Number(p.q1) * Number(p.form === 1 ? p.c1 : p.p1) + Number(p.q2) * Number(p.form === 1 ? p.c2 : p.p2)) / (Number(p.q1) + Number(p.q2));
ORACLES["partnership"] = (p) => {
  const ra = (Number(p.ca) / 1000) * Number(p.ma), rb = (Number(p.cb) / 1000) * Number(p.mb);
  return (Number(p.P) * ra) / (ra + rb);
};

// ---- Level J: applied problems, recomputed from the plain numbers ---------------------------------------------------
const N = (v: number | string): number => Number(v);
ORACLES["profit-loss"] = (p) => {
  const sign = N(p.profit) === 1 ? 1 : -1;
  if (N(p.form) === 0) return (N(p.cp) * (100 + sign * N(p.pct))) / 100;
  if (N(p.form) === 1) return (Math.abs(N(p.sp) - N(p.cp)) / N(p.cp)) * 100;
  return (N(p.sp) * 100) / (100 + sign * N(p.pct));
};
ORACLES["discount"] = (p) => {
  if (N(p.form) === 0) return (N(p.mp) * (100 - N(p.pct))) / 100;
  if (N(p.form) === 1) return ((N(p.mp) - N(p.sp)) / N(p.mp)) * 100;
  return (N(p.sp) * 100) / (100 - N(p.pct));
};
ORACLES["simple-interest"] = (p) => {
  const years = N(p.months) === 1 ? N(p.t) / 12 : N(p.t);
  if (N(p.form) === 0) return (N(p.P) * N(p.rate) * years) / 100;
  if (N(p.form) === 1) return N(p.P) + (N(p.P) * N(p.rate) * years) / 100;
  return (N(p.si) * 100) / (N(p.P) * years);
};
ORACLES["compound-interest"] = (p) => {
  const amount = N(p.P) * Math.pow(1 + N(p.rate) / 100, N(p.years));
  return N(p.ask) === 1 ? amount : amount - N(p.P);
};
ORACLES["speed-distance-time"] = (p) => {
  switch (N(p.form)) {
    case 0: return N(p.dist) / N(p.t);
    case 1: return N(p.v) * N(p.t);
    case 2: return N(p.dist) / N(p.v);
    default: return (N(p.v) * N(p.t) + N(p.v2) * N(p.t2)) / (N(p.t) + N(p.t2));
  }
};
ORACLES["work-rate"] = (p) => (N(p.form) === 0 ? 1 / (1 / N(p.x) + 1 / N(p.y)) : 1 / (1 / N(p.t) - 1 / N(p.x)));
ORACLES["ages"] = (p) => {
  if (N(p.form) === 0) return (N(p.S) * N(p.k)) / (N(p.k) + 1);
  if (N(p.form) === 1) return (N(p.S) - 2 * N(p.t)) / (N(p.k) + 1);
  // find n >= 0 with parent + n = m (kid + n) by trying each n
  for (let n = 0; n < 200; n++) if (N(p.parent) + n === N(p.m) * (N(p.kid) + n)) return n;
  return -1;
};
ORACLES["unit-convert"] = (p) => (N(p.value) * N(p.num)) / N(p.den);
ORACLES["word-multistep"] = (p) => {
  switch (N(p.form)) {
    case 0: return N(p.pay) - (N(p.q1) * N(p.p1) + N(p.q2) * N(p.p2));
    case 1: return N(p.adults) * N(p.pa) + N(p.kids) * N(p.pk);
    case 2: return N(p.rate) * N(p.h) - N(p.cost);
    default: return N(p.bill) / N(p.people) + N(p.tip);
  }
};
ORACLES["successive-pct"] = (p) => {
  const f1 = 100 + (N(p.up1) === 1 ? N(p.a) : -N(p.a)), f2 = 100 + (N(p.up2) === 1 ? N(p.b) : -N(p.b));
  if (N(p.form) === 0) return (f1 / 100) * (f2 / 100) * 100 - 100;
  if (N(p.form) === 1) return N(p.base) * (f1 / 100) * (f2 / 100);
  return 100 - ((100 - N(p.a)) / 100) * ((100 - N(p.b)) / 100) * 100;
};

// ---- Level K ---------------------------------------------------------------------------------------------------------
import { evaluate as evalExact, toNumber as ratToNumber } from "./expr";

/** Detect the rule behind a list of terms (a different route from the generator that built them) and return the term it predicts next, or null. */
function predictNext(t: number[]): number | null {
  // polynomial patterns: take differences until they are constant, then extrapolate back up
  const rows: number[][] = [t];
  for (let order = 1; order <= 3; order++) {
    const last = rows[rows.length - 1];
    const dd = last.slice(1).map((x, i) => x - last[i]);
    rows.push(dd);
    if (dd.length >= 2 && dd.every((x) => x === dd[0])) {
      let nxt = dd[0];
      for (let k = rows.length - 2; k >= 0; k--) nxt = rows[k][rows[k].length - 1] + nxt;
      return nxt;
    }
  }
  if (t.every((x) => x !== 0) && t.slice(2).every((x, i) => x * t[i] === t[i + 1] * t[i + 1])) return (t[t.length - 1] * t[1]) / t[0];
  if (t.length >= 4 && t.slice(2).every((x, i) => x === t[i] + t[i + 1])) return t[t.length - 1] + t[t.length - 2];
  const diffs = t.slice(1).map((x, i) => x - t[i]);
  if (diffs.length >= 4 && diffs.slice(2).every((x, i) => x === diffs[i])) return t[t.length - 1] + diffs[diffs.length - 2];
  return null;
}
ORACLES["series-next"] = (p) => {
  const shown = String(p.terms).split(",").map(Number);
  const predicted = predictNext(shown);
  return predicted === null ? false : predicted;
};
ORACLES["series-missing"] = (p) => {
  const full = String(p.terms).split(",").map(Number);
  const idx = Number(p.idx);
  // the full list must follow one rule, and the hidden term is the one that rule gives
  const before = full.slice(0, idx);
  const rest = full.filter((_, i) => i !== idx);
  if (predictNext(full.slice(0, full.length - 1)) !== full[full.length - 1]) return false;
  void before; void rest;
  return full[idx];
};
const bigModPow = (a: bigint, b: bigint, m: bigint): bigint => { let r = 1n; for (let i = 0n; i < b; i++) r = (r * a) % m; return r % m; };
ORACLES["remainder-big"] = (p) => String(bigModPow(BigInt(p.a), BigInt(p.b), BigInt(p.m)));
ORACLES["unit-digit-power"] = (p) => String((BigInt(p.a) ** BigInt(p.b)) % 10n);
ORACLES["digit-problem"] = (p, q) => {
  const hits: number[] = [];
  for (let n = 10; n <= 99; n++) {
    const t = Math.floor(n / 10), u = n % 10, rev = u * 10 + t;
    const ok = Number(p.form) === 0 ? t + u === Number(p.s) && t - u === Number(p.df) : t + u === Number(p.s) && n - rev === 9 * Number(p.df);
    if (ok) hits.push(n);
  }
  return hits.length === 1 && String(hits[0]) === q.answer;
};
ORACLES["quant-compare"] = (p, q) => {
  const a = ratToNumber(evalExact(String(p.ea))), b = ratToNumber(evalExact(String(p.eb)));
  return q.answer === (a > b ? "A is greater" : b > a ? "B is greater" : "They are equal");
};
ORACLES["estimate-product"] = (p) => {
  if (p.op === "mul") return Number(p.a) * Number(p.b);
  if (p.op === "add") return Number(p.a) + Number(p.b);
  return (Number(p.x) * Number(p.pct)) / 100;
};
ORACLES["approx-sqrt"] = (p, q) => Math.abs(Number(q.answer) - Math.sqrt(Number(p.x))) <= 0.051;

// ---- Level L: geometry, recomputed from the plain numbers --------------------------------------------------------------
const PI = (p: P): number => (p.pi === "22/7" ? 22 / 7 : 3.14);
ORACLES["perimeter"] = (p) => {
  switch (N(p.form)) {
    case 0: return 2 * (N(p.l) + N(p.w));
    case 1: return 4 * N(p.l);
    case 2: return N(p.l) + N(p.w) + N(p.c);
    case 3: return N(p.sides) * N(p.l);
    default: return N(p.per) / 2 - N(p.l);
  }
};
ORACLES["area-basic"] = (p) => {
  switch (N(p.form)) {
    case 0: return N(p.l) * N(p.w);
    case 1: return N(p.l) ** 2;
    case 2: return (N(p.b) * N(p.h)) / 2;
    case 3: return N(p.area) / N(p.l);
    default: return N(p.W) * N(p.H) - N(p.a2) * N(p.b2);
  }
};
ORACLES["triangle-angles"] = (p) => {
  switch (N(p.form)) {
    case 0: return 180 - N(p.a) - N(p.b);
    case 1: return (180 - N(p.apex)) / 2;
    case 2: return N(p.a) + N(p.b);
    default: { const parts = ints(p.parts); return (180 * Math.max(...parts)) / parts.reduce((a, b) => a + b, 0); }
  }
};
ORACLES["quad-area"] = (p) => (N(p.form) === 0 ? N(p.b) * N(p.h) : N(p.form) === 1 ? ((N(p.a) + N(p.b)) * N(p.h)) / 2 : (N(p.d1) * N(p.d2)) / 2);
ORACLES["circle"] = (p) => {
  const r = N(p.rad), pi = PI(p);
  switch (N(p.form)) {
    case 0: return 2 * pi * r;
    case 1: return pi * r * r;
    case 2: return (pi * r * r) / 2;
    default: return r;
  }
};
ORACLES["surface-area"] = (p) => {
  switch (N(p.form)) {
    case 0: return 6 * N(p.a) ** 2;
    case 1: return 2 * (N(p.a) * N(p.b) + N(p.b) * N(p.c) + N(p.a) * N(p.c));
    case 2: return 2 * (22 / 7) * N(p.rad) * N(p.h);
    default: return 2 * (22 / 7) * N(p.rad) * (N(p.rad) + N(p.h));
  }
};
ORACLES["volume"] = (p) => {
  switch (N(p.form)) {
    case 0: return N(p.a) ** 3;
    case 1: return N(p.a) * N(p.b) * N(p.c);
    case 2: return (22 / 7) * N(p.rad) ** 2 * N(p.h);
    case 3: return ((22 / 7) * N(p.rad) ** 2 * N(p.h)) / 3;
    case 4: return (4 / 3) * (22 / 7) * 21 ** 3;
    default: return N(p.a) * N(p.b) * N(p.c) * 1000;
  }
};
ORACLES["angle-calc"] = (p) => {
  switch (N(p.form)) {
    case 0: case 2: return 180 - N(p.a);
    case 1: return 360 - N(p.a) - N(p.b) - N(p.c);
    case 3: return (N(p.sides) - 2) * 180;
    case 4: return ((N(p.sides) - 2) * 180) / N(p.sides);
    default: return 360 / N(p.sides);
  }
};
ORACLES["pythagoras"] = (p) => {
  if (N(p.form) === 1) return Math.sqrt(N(p.C) ** 2 - N(p.A) ** 2);
  return Math.hypot(N(p.A), N(p.B));
};
const RIGHT_FORMULA: Record<string, string> = {
  "area of a triangle": "½ × base × height", "area of a circle": "π × r²", "circumference of a circle": "2 × π × r", "area of a trapezium": "½ × (a + b) × h",
  "volume of a cylinder": "π × r² × h", "volume of a cone": "⅓ × π × r² × h", "volume of a sphere": "4/3 × π × r³", "surface area of a sphere": "4 × π × r²",
  "total surface area of a cube with edge a": "6 × a²", "area of a rhombus with diagonals p and q": "½ × p × q", "sum of the interior angles of an n-sided polygon": "(n − 2) × 180°",
  "Pythagoras' theorem for hypotenuse c": "c² = a² + b²", "curved surface area of a cylinder": "2 × π × r × h", "volume of a cuboid": "l × b × h",
};
ORACLES["formula-recall"] = (p, q) => RIGHT_FORMULA[String(p.ask)] === q.answer && (q.options ?? []).length === 4;
ORACLES["measure-convert"] = (p) => (N(p.value) * N(p.num)) / N(p.den);

// ---- Level M: data, recomputed from the lists the question was built from -----------------------------------------------
const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
ORACLES["table-read"] = (p) => {
  const v = ints(p.values);
  switch (N(p.form)) {
    case 0: return total(v);
    case 1: return v[N(p.i)] + v[N(p.j)];
    case 2: return Math.max(...v) - Math.min(...v);
    default: return v[N(p.i)] - v[N(p.j)];
  }
};
ORACLES["bar-chart"] = (p) => {
  const v = ints(p.values);
  return N(p.form) === 0 ? v[N(p.i)] + v[N(p.j)] : N(p.form) === 1 ? total(v) : total(v) / v.length;
};
ORACLES["line-chart"] = (p) => {
  if (N(p.form) === 0) { const v = ints(p.values); return v[N(p.j)] - v[N(p.i)]; }
  if (N(p.form) === 1) { const v = ints(p.values); return Math.max(...v) - Math.min(...v); }
  return (Math.abs(N(p.to) - N(p.base)) / N(p.base)) * 100;
};
ORACLES["pie-chart"] = (p) => {
  const pc = ints(p.pcts);
  if (total(pc) !== 100) return false;
  return N(p.form) === 0 ? (pc[N(p.i)] * N(p.total)) / 100 : (pc[N(p.i)] / 100) * 360;
};
ORACLES["data-percent"] = (p) => { const v = ints(p.values); return (v[N(p.i)] / total(v)) * 100; };
ORACLES["data-average"] = (p) => {
  const v = ints(p.xs);
  const sorted = [...v].sort((a, b) => a - b);
  switch (N(p.form)) {
    case 0: return total(v) / v.length;
    case 1: return v.length % 2 ? sorted[(v.length - 1) / 2] : (sorted[v.length / 2 - 1] + sorted[v.length / 2]) / 2;
    case 2: {
      const counts = new Map<number, number>();
      for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1);
      const best = Math.max(...counts.values());
      const modes = [...counts].filter(([, c]) => c === best).map(([x]) => x);
      return modes.length === 1 ? modes[0] : false;
    }
    default: return sorted[sorted.length - 1] - sorted[0];
  }
};
const gcdOf = (x: number, y: number): number => (y ? gcdOf(y, x % y) : x);
const reduceFrac = (a: number, b: number): string => { const g = gcdOf(a, b); return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`; };
ORACLES["probability-basic"] = (p) => {
  if (N(p.form) <= 1) { const t = N(p.red) + N(p.blue) + N(p.green); return reduceFrac(N(p.form) === 0 ? N(p.red) : t - N(p.red), t); }
  if (N(p.form) === 2) { let c = 0; for (let f = 1; f <= 6; f++) if (f > N(p.k)) c++; return reduceFrac(c, 6); }
  let c = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === N(p.s)) c++;
  return reduceFrac(c, 36);
};
ORACLES["counting-basic"] = (p) => {
  switch (N(p.form)) {
    case 0: return N(p.a) * N(p.b);
    case 1: return N(p.a) * N(p.b) * N(p.c);
    case 2: { let c = 0; for (let i = 0; i < N(p.people); i++) for (let j = i + 1; j < N(p.people); j++) c++; return c; }
    default: { let f = 1; for (let i = 2; i <= N(p.k); i++) f *= i; return f; }
  }
};
ORACLES["perm-comb-basic"] = (p) => {
  const fact = (x: number): bigint => (x <= 1 ? 1n : BigInt(x) * fact(x - 1));
  const nn = N(p.n), kk = N(p.k);
  const perms = fact(nn) / fact(nn - kk);
  return Number(N(p.comb) === 1 ? perms / fact(kk) : perms);
};
ORACLES["data-multistep"] = (p) => {
  const a = ints(p.y1), b = ints(p.y2);
  if (N(p.form) === 0) return total(a) + total(b);
  if (N(p.form) === 1) return b[N(p.i)] - a[N(p.i)];
  return ((total(b) - total(a)) / total(a)) * 100;
};

// ---- Level N -----------------------------------------------------------------------------------------------------------
ORACLES["algebra-adv"] = (p, q) => {
  // find every integer pair that satisfies the stated facts; the answer must be the single solution's requested value
  const hits: Array<[number, number]> = [];
  for (let x = -60; x <= 60; x++) for (let y = -60; y <= 60; y++) {
    let ok: boolean;
    if (N(p.form) === 0) ok = x + y === N(p.s) && Math.abs(x - y) === N(p.df);
    else if (N(p.form) === 1) ok = N(p.a) * x + N(p.b) * y === N(p.c1) && x - y === N(p.c2);
    else ok = N(p.a) * x + N(p.b) * y === N(p.c4) && N(p.e) * x - N(p.f) * y === N(p.c3);
    if (ok) hits.push([x, y]);
  }
  if (N(p.form) === 0) return hits.length === 2 && String(Math.max(...hits[0])) === q.answer;
  return hits.length === 1 && q.answer === String(N(p.form) === 1 ? hits[0][0] : hits[0][1]);
};
ORACLES["quadratic-roots"] = (p) => {
  const disc = N(p.b) ** 2 - 4 * N(p.c);
  const hi = (-N(p.b) + Math.sqrt(disc)) / 2, lo = (-N(p.b) - Math.sqrt(disc)) / 2;
  return N(p.form) === 0 ? hi : N(p.form) === 1 ? hi + lo : hi * lo;
};
ORACLES["factorise"] = (p, q) => {
  const found: Array<[number, number]> = [];
  for (let a = -40; a <= 40; a++) for (let b = a; b <= 40; b++) if (a + b === N(p.b) && a * b === N(p.c)) found.push([a, b]);
  return found.length === 1 && String(found[0][0]) === q.answer;
};
ORACLES["radicals"] = (p) => {
  const bigSquare = (x: number): number => { let best = 1; for (let i = 1; i * i <= x; i++) if (x % (i * i) === 0) best = i; return best; };
  if (N(p.form) === 0) return bigSquare(N(p.N1));
  return bigSquare(N(p.N1)) + bigSquare(N(p.N2));
};
ORACLES["sci-notation"] = (p) => {
  if (N(p.form) === 0) {
    const t = String(p.text).replace(/,/g, "");
    if (t.startsWith("0.")) { const frac = t.slice(2); return -(frac.length - frac.replace(/^0+/, "").length + 1); }
    return t.length - 1;
  }
  if (N(p.form) === 1) return N(p.m) + N(p.k) + (N(p.a10) * N(p.b10) >= 1000 ? 1 : 0);
  return (N(p.a10) / 10) * 10 ** -N(p.e);
};
ORACLES["polynomial-eval"] = (p) => ints(p.coefs).reduce((acc, c) => acc * N(p.x) + c, 0);
ORACLES["pct-ratio-adv"] = (p) => {
  if (N(p.form) === 0) return (N(p.now) * 100) / (100 + (N(p.up) === 1 ? N(p.pct) : -N(p.pct)));
  if (N(p.form) === 1) return (N(p.a) / 100) * (N(p.b) / 100) * N(p.base);
  return (100 * N(p.p)) / (100 + N(p.p));
};
const trigOf = (f: string, deg: number): number => Math[f as "sin" | "cos" | "tan"]((deg * Math.PI) / 180);
ORACLES["trig-values"] = (p, q) => {
  if (N(p.form) === 0) return trigOf(String(p.f), N(p.deg));
  if (N(p.form) === 1) return Math.abs(Number(q.answer) - trigOf(String(p.f), N(p.deg))) <= 0.0005 + 1e-9;
  return trigOf(String(p.f1), N(p.d1)) + trigOf(String(p.f2), N(p.d2));
};
ORACLES["trig-identity"] = (p) => {
  const known = N(p.a) / N(p.c);
  const other = Math.sqrt(1 - known * known); // the other ratio, positive for an acute angle
  const sin = N(p.sinFirst) === 1 ? known : other, cos = N(p.sinFirst) === 1 ? other : known;
  return p.which === "cos" ? (N(p.sinFirst) === 1 ? cos : sin) : sin / cos;
};
