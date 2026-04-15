export type Gender = "M" | "F";

export interface AtlasEntry {
  gender: Gender;
  age: number;
  /** "a" | "b" | null — same-age duplicate marker (e.g., F 13.8a / F 13.8b). */
  suffix: string | null;
  /** Path relative to /public/atlas/, e.g. "male/M_01-5.webp" */
  file: string;
}

export interface AtlasData {
  entries: AtlasEntry[];
}

/** Normalized ROI rectangle in [0,1] coordinates — image-agnostic. */
export interface RoiNorm {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PatientInput {
  gender: Gender;
  /** Chronological age in decimal years, e.g. 10.5 */
  age: number;
  /** Age window half-width for filtering atlas candidates, e.g. 1 = ±1yr */
  ageRange: number;
}

export interface MatchCandidate extends AtlasEntry {
  score: number;
  scoreWrist: number;
  scoreFinger: number;
}

export interface MatchResult {
  younger: MatchCandidate | null;
  older: MatchCandidate | null;
  /** Top N ranking irrespective of age side, for "other candidates" UI */
  ranking: MatchCandidate[];
  /** Interpolated estimated bone age in years */
  estimated: number | null;
  /** True if `ageRange` had to be expanded to find candidates */
  rangeExpanded: boolean;
  /** Final range used (may be larger than requested) */
  effectiveRange: number;
}
