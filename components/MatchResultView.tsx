"use client";

import type { MatchResult, PatientInput } from "@/lib/types";
import { formatLabel } from "@/lib/atlas";

interface Props {
  result: MatchResult;
  patient: PatientInput;
  patientImageUrl: string | null;
}

export default function MatchResultView({ result, patient, patientImageUrl }: Props) {
  const { patientAge, younger, older } = result;

  if (patientAge === null) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        생년월일과 X-ray 촬영일을 입력하면 해당 나이의 레퍼런스 이미지가 양쪽에 자동 표시됩니다.
      </div>
    );
  }

  const panel = (
    side: "younger" | "patient" | "older",
    label: string,
    src: string | null,
    caption: string,
    accent: string,
    subcaption?: string,
  ) => (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>{label}</div>
      <div className="relative w-full aspect-[800/1166] rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            {side === "patient" ? "환자 이미지 없음" : "해당 나이 범위를 벗어남"}
          </div>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-800 text-center">{caption}</div>
      {subcaption && <div className="text-xs text-slate-500 text-center">{subcaption}</div>}
    </div>
  );

  const patientLabel = `${patient.gender === "M" ? "남" : "여"} ${patientAge.toFixed(2)}세`;
  const diff = (atlasAge: number) => (patientAge - atlasAge).toFixed(2);

  return (
    <div className="grid grid-cols-3 gap-4">
      {panel(
        "younger",
        "younger",
        younger ? `/atlas/${younger.file}` : null,
        younger ? formatLabel(younger) : "—",
        "text-blue-600",
        younger ? `환자보다 ${diff(younger.age)}세 어림` : undefined,
      )}
      {panel(
        "patient",
        "patient",
        patientImageUrl,
        patientLabel,
        "text-slate-700",
        patientImageUrl ? "촬영일 기준" : "X-ray 이미지를 업로드하면 여기 표시됩니다",
      )}
      {panel(
        "older",
        "older",
        older ? `/atlas/${older.file}` : null,
        older ? formatLabel(older) : "—",
        "text-rose-600",
        older ? `환자보다 ${(older.age - patientAge).toFixed(2)}세 많음` : undefined,
      )}
    </div>
  );
}
