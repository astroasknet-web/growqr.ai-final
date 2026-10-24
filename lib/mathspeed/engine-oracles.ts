/**
 * Independent checks for the generators whose answer is not simply the value of an arithmetic expression. Each oracle takes only the plain
 * numbers a question was built from (`params`) and recomputes the answer a different way from the generator. Used by engine.test.ts.
 * Generators whose questions carry an `expr` are checked against the exact calculator in expr.ts instead.
 */
export type P = Record<string, number | string>;
export type Oracle = (p: P, q: { answer: string; options?: string[] }) => string | boolean;

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
