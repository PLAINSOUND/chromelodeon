import { PRIME_BASIS } from "mathtools.js";

/////////////////////////////////
// Harmonic Radius in 11-limit //
/////////////////////////////////

export function harmonicRadius(monzos) {
  if (!Array.isArray(monzos) || monzos.length === 0) {
    throw new Error("harmonicRadius expects a non-empty array of monzos.");
  }

  // Find minima per dimension across the set
  const minExp = [Infinity, Infinity, Infinity, Infinity, Infinity];
  for (let i = 0; i < monzos.length; i++) {
    const v = monzos[i];
    for (let j = 0; j < 5; j++) {
      if (v[j] < minExp[j]) minExp[j] = v[j];
    }
  }

  // Transposition offset minima --> 0 so all partial exponents >= 0
  // This transforms a set of ratios into harmonic series segment of integer partials
  const offset = minExp.map((m) => -m);
  const LN_PRIME_BASIS = PRIME_BASIS.map((p) => Math.log(Number(p)));
  // Compute in ln-space to avoid overflow of large integers while maintaining accuracy
  let lnSum = 0;
  for (let i = 0; i < monzos.length; i++) {
    const v = monzos[i];
    let lnP_i = 0;
    for (let j = 0; j < 5; j++) {
      lnP_i += (v[j] + offset[j]) * LN_PRIME_BASIS[j];
    }
    lnSum += lnP_i;
  }

  const lnHR = lnSum / monzos.length; // Geometric mean
  return Math.exp(lnHR); // Convert out of ln-space
}
