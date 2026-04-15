/**
 * Simplified global SSIM (Structural Similarity Index) for grayscale Float32 arrays.
 * Both inputs must be the same size (side×side). Returns score in [-1, 1], 1=identical.
 */
export function ssim(
  a: Float32Array,
  b: Float32Array,
  size: number,
): number {
  if (a.length !== b.length) throw new Error("ssim: array length mismatch");
  const n = a.length;

  // Means
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < n; i++) {
    meanA += a[i];
    meanB += b[i];
  }
  meanA /= n;
  meanB /= n;

  // Variances and covariance
  let varA = 0;
  let varB = 0;
  let cov = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    varA += da * da;
    varB += db * db;
    cov += da * db;
  }
  varA /= n - 1;
  varB /= n - 1;
  cov /= n - 1;

  // SSIM constants for 8-bit range (L=255)
  const L = 255;
  const k1 = 0.01;
  const k2 = 0.03;
  const c1 = (k1 * L) ** 2;
  const c2 = (k2 * L) ** 2;

  const numer = (2 * meanA * meanB + c1) * (2 * cov + c2);
  const denom = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);
  return numer / denom;
  // Note: 'size' arg is kept for future windowed SSIM — unused here.
}

/** Normalized Cross-Correlation (Pearson) for grayscale arrays. Returns [-1, 1]. */
export function ncc(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) throw new Error("ncc: array length mismatch");
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < a.length; i++) {
    meanA += a[i];
    meanB += b[i];
  }
  meanA /= a.length;
  meanB /= a.length;

  let num = 0;
  let dA = 0;
  let dB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - meanA;
    const y = b[i] - meanB;
    num += x * y;
    dA += x * x;
    dB += y * y;
  }
  const den = Math.sqrt(dA * dB);
  return den === 0 ? 0 : num / den;
}

/** Blend SSIM and NCC for robustness. Both in similar range. */
export function combinedSimilarity(a: Float32Array, b: Float32Array, size: number): number {
  const s = ssim(a, b, size);
  const c = ncc(a, b);
  return 0.6 * s + 0.4 * c;
}
