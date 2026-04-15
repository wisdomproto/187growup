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

export interface PatientInput {
  gender: Gender;
  /** ISO date string YYYY-MM-DD */
  birthDate: string;
  /** ISO date string YYYY-MM-DD — when the X-ray was taken. Defaults to today. */
  xrayDate: string;
}

export interface MatchResult {
  /** Chronological age in decimal years at xrayDate. null if inputs invalid. */
  patientAge: number | null;
  /** Closest atlas entry with age <= patient (same gender). */
  younger: AtlasEntry | null;
  /** Closest atlas entry with age >= patient (same gender). */
  older: AtlasEntry | null;
}
