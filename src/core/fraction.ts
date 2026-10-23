export interface Fraction {
  readonly n: bigint;
  readonly d: bigint;
}

export function fraction(n: bigint, d = 1n): Fraction {
  if (d === 0n) throw new RangeError("A denominator cannot be zero.");
  if (d < 0n) return fraction(-n, -d);
  let a = n < 0n ? -n : n;
  let b = d;
  while (b !== 0n) [a, b] = [b, a % b];
  return { n: n / a, d: d / a };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function multiply(a: Fraction, b: Fraction): Fraction {
  return fraction(a.n * b.n, a.d * b.d);
}

export function asNumber(a: Fraction): number {
  return Number(a.n) / Number(a.d);
}

export function asText(a: Fraction): string {
  return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
}
