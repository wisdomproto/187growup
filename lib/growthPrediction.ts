// Bayley-Pinneau adult height prediction + helpers tying into growthStandard.ts
// Adapted from dflo_0.1 (187성장케어) for the BoneAgeAI app's 'M'|'F' gender type.

import type { Gender } from "./types";
import { heightAtSamePercentile } from "./growthStandard";

/** BoneAgeAI 'M'|'F' → growthStandard 'male'|'female' */
export function toLongGender(g: Gender): "male" | "female" {
  return g === "M" ? "male" : "female";
}

// ── Bayley–Pinneau (PAH) table: bone age (integer years) → % of adult height already achieved ──

const BP_MALE: Record<number, number> = {
  6: 68.5, 7: 72.5, 8: 75.5, 9: 78.5, 10: 81, 11: 83.5,
  12: 86, 13: 88.5, 14: 91.5, 15: 94.5, 16: 97, 17: 99,
};

const BP_FEMALE: Record<number, number> = {
  6: 73, 7: 76.5, 8: 80, 9: 83, 10: 86, 11: 89,
  12: 92, 13: 95, 14: 97, 15: 98.5, 16: 99.5, 17: 100,
};

/** Bayley–Pinneau predicted adult height (cm). */
export function predictAdultHeightBP(
  currentHeight: number,
  boneAge: number,
  gender: Gender,
): number {
  if (currentHeight <= 0 || boneAge <= 0) return 0;
  const table = gender === "M" ? BP_MALE : BP_FEMALE;
  const floor = Math.floor(boneAge);
  const ceil = Math.ceil(boneAge);
  const lo = table[floor];
  const hi = table[ceil];
  if (lo === undefined && hi === undefined) return 0;

  let pct: number;
  if (floor === ceil || hi === undefined) pct = lo ?? 0;
  else if (lo === undefined) pct = hi;
  else {
    const t = boneAge - floor;
    pct = lo + t * (hi - lo);
  }
  if (pct <= 0) return 0;
  return Math.round((currentHeight / (pct / 100)) * 10) / 10;
}

/** Supported BP bone-age range for display/warning purposes. */
export const BP_AGE_MIN = 6;
export const BP_AGE_MAX = 17;

/**
 * Build a yearly projected growth curve from the patient's current measurement
 * out to age 18, anchored to the BP-predicted adult height at 18.
 *
 * Middle points follow the "same-percentile" projection from the standard curve
 * (using chronological age of the patient) so the curve has a realistic shape,
 * but we scale it so that the 18-year-old endpoint lands exactly on the BP
 * prediction (which is the doctor-trusted number).
 */
export function buildProjectedCurve(
  currentAge: number,
  currentHeight: number,
  gender: Gender,
  predictedAdult: number,
): { age: number; height: number }[] {
  if (predictedAdult <= 0 || currentAge >= 18) {
    return [{ age: 18, height: predictedAdult }];
  }
  const longG = toLongGender(gender);
  const startAge = Math.min(18, Math.max(2, currentAge));
  const yearly: { age: number; height: number }[] = [];

  // Raw same-percentile shape (start → 18)
  const raw: { age: number; h: number }[] = [];
  raw.push({ age: startAge, h: currentHeight });
  const firstInt = Math.ceil(startAge + 0.0001);
  for (let a = firstInt; a <= 18; a++) {
    raw.push({ age: a, h: heightAtSamePercentile(currentHeight, startAge, a, longG) });
  }
  // Ensure final point is exactly at 18
  if (raw[raw.length - 1].age !== 18) {
    raw.push({ age: 18, h: heightAtSamePercentile(currentHeight, startAge, 18, longG) });
  }

  // Scale so the 18-year endpoint matches the BP prediction exactly
  const rawEnd = raw[raw.length - 1].h;
  const startH = currentHeight;
  const endH = predictedAdult;
  const rawGrowth = rawEnd - startH || 1;

  for (const { age, h } of raw) {
    const progress = (h - startH) / rawGrowth; // 0..1 along the raw curve
    const scaled = startH + progress * (endH - startH);
    yearly.push({ age, height: Math.round(scaled * 10) / 10 });
  }

  // Deduplicate if start age collapsed with first integer
  const unique: typeof yearly = [];
  for (const p of yearly) {
    if (unique.length && unique[unique.length - 1].age === p.age) continue;
    unique.push(p);
  }
  return unique;
}
