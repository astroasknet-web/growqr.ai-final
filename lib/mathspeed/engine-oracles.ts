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
