export const PRIME_BASIS = [2n, 3n, 5n, 7n, 11n];

function asPositiveBigInt(value) {
  if (typeof value === "bigint") {
    if (value <= 0n) throw new Error("Integer must be > 0.");
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0)
      throw new Error("Number must be a positive integer.");
    return BigInt(value);
  }

  if (typeof value === "string") {
    if (!/^[0-9]+$/.test(value))
      throw new Error("String must be an unsigned decimal integer.");
    const b = BigInt(value);
    if (b <= 0n) throw new Error("Integer must be > 0.");
    return b;
  }

  throw new Error(
    "Unsupported integer type (use number, bigint, or decimal string).",
  );
}

function gcdBigInt(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

////////////////////////////
// 11-limit factorisation //
////////////////////////////

function factorIntoPrimeBasis11(n) {
  let remaining = n;
  const exponents = [0, 0, 0, 0, 0];

  for (let i = 0; i < PRIME_BASIS.length; i++) {
    const prime = PRIME_BASIS[i];
    while (remaining % prime === 0n) {
      exponents[i] += 1;
      remaining /= prime;
    }
  }

  if (remaining !== 1n) {
    throw new Error(`Not 11-limit: leftover factor ${remaining.toString()}`);
  }

  return exponents;
}

/////////////////////
// Calculate Monzo //
/////////////////////

export function ratioToMonzo([numerator, denominator]) {
  let N = asPositiveBigInt(numerator);
  let D = asPositiveBigInt(denominator);

  // Reduce ratio first
  const g = gcdBigInt(N, D);
  N /= g;
  D /= g;

  const numExp = factorIntoPrimeBasis11(N);
  const denExp = factorIntoPrimeBasis11(D);

  // exponent vector (monzo) = exp(num) - exp(den)
  return numExp.map((e, i) => e - denExp[i]);
}
