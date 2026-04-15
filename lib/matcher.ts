import { cropRoiToGray, loadImage } from "./image";
import { combinedSimilarity } from "./similarity";
import type {
  AtlasEntry,
  MatchCandidate,
  MatchResult,
  PatientInput,
  RoiNorm,
} from "./types";

interface MatchParams {
  patient: PatientInput;
  patientImage: HTMLImageElement;
  wristRoi: RoiNorm;
  fingerRoi: RoiNorm;
  atlas: AtlasEntry[];
  /** Weight for wrist ROI in final score (0..1). Doctor's workflow prioritizes wrist. */
  wristWeight?: number;
  /** Grayscale patch size for similarity computation. */
  patchSize?: number;
}

export async function runMatch({
  patient,
  patientImage,
  wristRoi,
  fingerRoi,
  atlas,
  wristWeight = 0.6,
  patchSize = 128,
}: MatchParams): Promise<MatchResult> {
  const fingerWeight = 1 - wristWeight;

  // Crop patient ROIs once
  const patientWrist = await cropRoiToGray(patientImage, wristRoi, patchSize);
  const patientFinger = await cropRoiToGray(patientImage, fingerRoi, patchSize);

  // Progressive filter: start with requested range, expand if <2 candidates
  const ranges = [patient.ageRange, patient.ageRange + 1, patient.ageRange + 2, 999];
  let candidates: AtlasEntry[] = [];
  let effectiveRange = patient.ageRange;
  let rangeExpanded = false;

  for (const r of ranges) {
    candidates = atlas.filter(
      (e) => e.gender === patient.gender && Math.abs(e.age - patient.age) <= r,
    );
    effectiveRange = Math.min(r, 16); // cap display at 16
    rangeExpanded = r > patient.ageRange;
    if (candidates.length >= 2) break;
  }

  if (candidates.length === 0) {
    return {
      younger: null,
      older: null,
      ranking: [],
      estimated: null,
      rangeExpanded,
      effectiveRange,
    };
  }

  // Score each candidate
  const scored: MatchCandidate[] = [];
  for (const e of candidates) {
    const img = await loadImage(`/atlas/${e.file}`);
    const atlasWrist = await cropRoiToGray(img, wristRoi, patchSize);
    const atlasFinger = await cropRoiToGray(img, fingerRoi, patchSize);

    const scoreWrist = combinedSimilarity(patientWrist.data, atlasWrist.data, patchSize);
    const scoreFinger = combinedSimilarity(patientFinger.data, atlasFinger.data, patchSize);
    const score = wristWeight * scoreWrist + fingerWeight * scoreFinger;
    scored.push({ ...e, score, scoreWrist, scoreFinger });
  }

  scored.sort((a, b) => b.score - a.score);

  // Pick younger/older relative to patient.age among scored
  const younger = scored.filter((c) => c.age <= patient.age)[0] ?? null;
  const older = scored.filter((c) => c.age >= patient.age && c !== younger)[0] ?? null;

  // Estimate: similarity-weighted age between chosen two
  let estimated: number | null = null;
  if (younger && older) {
    const sy = Math.max(0, younger.score);
    const so = Math.max(0, older.score);
    const denom = sy + so;
    estimated = denom > 0
      ? (younger.age * sy + older.age * so) / denom
      : (younger.age + older.age) / 2;
  } else if (younger) {
    estimated = younger.age;
  } else if (older) {
    estimated = older.age;
  }

  return {
    younger,
    older,
    ranking: scored.slice(0, 8),
    estimated,
    rangeExpanded,
    effectiveRange,
  };
}
