"use client";

import type { AtlasEntry, PatientInput } from "@/lib/types";
import { formatLabel } from "@/lib/atlas";

interface Props {
  patient: PatientInput;
  /** Chronological age in years, or null if DOB missing. */
  patientAge: number | null;
  patientImageUrl: string | null;
  /** Atlas entry shown on the left (younger side). User can step this up/down. */
  younger: AtlasEntry | null;
  /** Atlas entry shown on the right (older side). Auto-derived = next step after younger. */
  older: AtlasEntry | null;
  /** Step the left image by offset (-1 = one younger, +1 = one older). */
  onYoungerStep: (offset: number) => void;
  /** Whether further stepping is allowed in each direction. */
  canStepUp: boolean;
  canStepDown: boolean;
}

export default function MatchResultView({
  patient,
  patientAge,
  patientImageUrl,
  younger,
  older,
  onYoungerStep,
  canStepUp,
  canStepDown,
}: Props) {
  const diffLabel = (atlasAge: number): string | undefined => {
    if (patientAge === null) return undefined;
    const d = atlasAge - patientAge;
    const sign = d >= 0 ? "많음" : "어림";
    return `환자보다 ${Math.abs(d).toFixed(2)}세 ${sign}`;
  };

  const patientLabel = patientAge !== null
    ? `${patient.gender === "M" ? "남" : "여"} ${patientAge.toFixed(2)}세`
    : `${patient.gender === "M" ? "남" : "여"} (역년령 미입력)`;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Younger — manual control */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">younger</div>
        <div className="relative w-full aspect-[800/1166] rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
          {younger ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/atlas/${younger.file}`} alt={formatLabel(younger)} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">후보 없음</div>
          )}
          {/* Step buttons — overlay on the image */}
          <div className="absolute top-1 right-1 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onYoungerStep(+1)}
              disabled={!canStepUp}
              title="다음 (더 많은 나이)"
              className="h-7 w-7 rounded-md bg-white/90 hover:bg-white text-slate-800 font-bold shadow disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onYoungerStep(-1)}
              disabled={!canStepDown}
              title="이전 (더 어린 나이)"
              className="h-7 w-7 rounded-md bg-white/90 hover:bg-white text-slate-800 font-bold shadow disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ↓
            </button>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-800 text-center">
          {younger ? formatLabel(younger) : "—"}
        </div>
        <div className="text-xs text-slate-500 text-center">
          {younger ? (diffLabel(younger.age) ?? "수동 조정 가능") : "—"}
        </div>
      </div>

      {/* Patient */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-700">patient</div>
        <div className="relative w-full aspect-[800/1166] rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
          {patientImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patientImageUrl} alt="환자 X-ray" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">환자 이미지 없음</div>
          )}
        </div>
        <div className="text-sm font-semibold text-slate-800 text-center">{patientLabel}</div>
        <div className="text-xs text-slate-500 text-center">
          {patientImageUrl ? "촬영일 기준" : "X-ray 이미지를 업로드하면 여기 표시됩니다"}
        </div>
      </div>

      {/* Older — auto */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-rose-600">older</div>
        <div className="relative w-full aspect-[800/1166] rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
          {older ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/atlas/${older.file}`} alt={formatLabel(older)} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">더 큰 atlas 없음</div>
          )}
        </div>
        <div className="text-sm font-semibold text-slate-800 text-center">
          {older ? formatLabel(older) : "—"}
        </div>
        <div className="text-xs text-slate-500 text-center">
          {older ? (diffLabel(older.age) ?? "왼쪽 기준 자동") : "—"}
        </div>
      </div>
    </div>
  );
}
