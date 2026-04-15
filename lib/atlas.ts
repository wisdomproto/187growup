import type { AtlasData, AtlasEntry, Gender } from "./types";

let cache: AtlasData | null = null;

export async function loadAtlas(): Promise<AtlasData> {
  if (cache) return cache;
  const res = await fetch("/atlas.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load atlas.json: ${res.status}`);
  cache = (await res.json()) as AtlasData;
  return cache;
}

export function filterAtlas(
  entries: AtlasEntry[],
  gender: Gender,
  centerAge: number,
  halfRange: number,
): AtlasEntry[] {
  return entries.filter(
    (e) => e.gender === gender && Math.abs(e.age - centerAge) <= halfRange,
  );
}

/** Format "M 1.5세" or "F 13.8(a)세" for display. */
export function formatLabel(e: AtlasEntry): string {
  const korean = e.gender === "M" ? "남자" : "여자";
  const suffix = e.suffix ? `(${e.suffix})` : "";
  return `${korean} ${e.age.toFixed(1)}${suffix}세`;
}

export function ageLabel(age: number): string {
  return `${age.toFixed(1)}세`;
}

/** Full gender-filtered atlas sorted by age (tie-broken by suffix a<b<…). */
export function byGenderSorted(entries: AtlasEntry[], gender: Gender): AtlasEntry[] {
  return entries
    .filter((e) => e.gender === gender)
    .sort((a, b) => (a.age - b.age) || (a.suffix ?? "").localeCompare(b.suffix ?? ""));
}

/** Neighbor in the sorted list by relative offset (e.g. +1 → next older, -1 → next younger). */
export function neighborInSorted(
  sorted: AtlasEntry[],
  from: AtlasEntry | null,
  offset: number,
): AtlasEntry | null {
  if (!from || sorted.length === 0) return null;
  const idx = sorted.findIndex((e) => e.file === from.file);
  if (idx < 0) return null;
  const target = idx + offset;
  if (target < 0 || target >= sorted.length) return null;
  return sorted[target];
}
