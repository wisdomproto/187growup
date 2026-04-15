import type { AtlasEntry, Gender, MatchResult } from "./types";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Decimal years between two ISO date strings. Returns null if either is empty/invalid. */
export function computeAge(birthDate: string, xrayDate: string): number | null {
  if (!birthDate || !xrayDate) return null;
  const b = new Date(birthDate);
  const x = new Date(xrayDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(x.getTime())) return null;
  const diff = x.getTime() - b.getTime();
  if (diff < 0) return null;
  return diff / MS_PER_YEAR;
}

/** Today in YYYY-MM-DD (local time). */
export function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Pick the atlas image immediately younger and immediately older than `age`. */
export function matchByAge(
  atlas: AtlasEntry[],
  gender: Gender,
  age: number | null,
): MatchResult {
  if (age === null) {
    return { patientAge: null, younger: null, older: null };
  }
  const pool = atlas
    .filter((e) => e.gender === gender)
    .sort((a, b) => a.age - b.age);

  // Largest age that is <= patient age
  const younger = [...pool].reverse().find((e) => e.age <= age) ?? null;
  // Smallest age that is >= patient age
  const older = pool.find((e) => e.age >= age) ?? null;

  // If exact match (age equals an atlas age), younger==older; split by taking neighbors
  if (younger && older && younger.age === older.age) {
    const idx = pool.indexOf(younger);
    const altYounger = idx > 0 ? pool[idx - 1] : null;
    const altOlder = idx < pool.length - 1 ? pool[idx + 1] : null;
    return {
      patientAge: age,
      // Keep the exact match on one side; put neighbor on the other.
      younger: altYounger ?? younger,
      older: altOlder ?? older,
    };
  }

  return { patientAge: age, younger, older };
}
