// Adult-height prediction for BoneAgeAI: "same-percentile-at-bone-age" projection.
//
// Clinical reasoning: a child's height percentile at their BONE age (not
// chronological age) tends to be preserved through puberty. So we:
//   1. Find what percentile the current height lands on for the bone age,
//   2. Extrapolate the same percentile out to age 18,
//   3. Return that as the predicted adult height.
//
// This mirrors the doctor's workflow on the 187 클리닉 chart where the
// projection line runs horizontally from the bone-age marker and rides
// parallel to the standard percentile curves.

import type { Gender } from "./types";
import { heightAtSamePercentile, calculateHeightPercentileLMS } from "./growthStandard";

/** BoneAgeAI 'M'|'F' → growthStandard 'male'|'female' */
export function toLongGender(g: Gender): "male" | "female" {
  return g === "M" ? "male" : "female";
}

/** LMS data spans 2..18 years — warn the caller when we're outside that. */
export const PRED_AGE_MIN = 2;
export const PRED_AGE_MAX = 18;

/**
 * Predicted adult height: height at age 18 if the bone-age percentile is
 * maintained. Returns 0 if inputs are invalid.
 */
export function predictAdultHeightByBonePercentile(
  currentHeight: number,
  boneAge: number,
  gender: Gender,
): number {
  if (currentHeight <= 0 || boneAge <= 0) return 0;
  const g = toLongGender(gender);
  const result = heightAtSamePercentile(currentHeight, boneAge, 18, g);
  return Math.round(result * 10) / 10;
}

/** Percentile (0-100) of current height at the bone age. */
export function percentileAtBoneAge(
  currentHeight: number,
  boneAge: number,
  gender: Gender,
): number {
  return calculateHeightPercentileLMS(currentHeight, boneAge, toLongGender(gender));
}

/**
 * Yearly projected curve from bone age to 18, riding the same percentile
 * as the bone-age starting point. Each point is height-on-the-curve at
 * that integer age.
 */
export function buildProjectedCurve(
  boneAge: number,
  currentHeight: number,
  gender: Gender,
): { age: number; height: number }[] {
  if (currentHeight <= 0 || boneAge <= 0) return [];
  const g = toLongGender(gender);
  const start = Math.min(18, Math.max(PRED_AGE_MIN, boneAge));
  const out: { age: number; height: number }[] = [{ age: start, height: currentHeight }];

  // Walk integer years from the next year after `start` up through 18.
  const firstInt = Math.ceil(start + 0.0001);
  for (let a = firstInt; a <= 18; a++) {
    const h = heightAtSamePercentile(currentHeight, start, a, g);
    out.push({ age: a, height: Math.round(h * 10) / 10 });
  }
  // Guarantee an exact age-18 endpoint even if firstInt already hit 18.
  if (out[out.length - 1].age !== 18) {
    const h = heightAtSamePercentile(currentHeight, start, 18, g);
    out.push({ age: 18, height: Math.round(h * 10) / 10 });
  }
  return out;
}
