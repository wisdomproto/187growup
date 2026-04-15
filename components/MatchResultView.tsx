"use client";

import type { MatchResult, PatientInput } from "@/lib/types";
import { ageLabel, formatLabel } from "@/lib/atlas";

interface Props {
  result: MatchResult | null;
  patient: PatientInput;
  patientImageUrl: string | null;
  onPickCandidate?: (side: "younger" | "older", file: string) => void;
}

export default function MatchResultView({ result, patient, patientImageUrl }: Props) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        X-ray 업로드 + 두 ROI 영역(손등 / 손가락)을 지정하면 자동으로 레퍼런스 매칭이 실행됩니다.
      </div>
    );
  }

  const { younger, older, estimated, rangeExpanded, effectiveRange } = result;

  const panel = (
    side: "younger" | "patient" | "older",
    label: string,
    src: string | null,
    caption: string,
    accent: string,
    score?: number,
  ) => (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>{label}</div>
      <div className="relative w-full aspect-[800/1166] rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            {side === "patient" ? "환자 이미지 없음" : "후보 없음"}
          </div>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-800">{caption}</div>
      {typeof score === "number" && (
        <div className="text-xs text-slate-500">유사도 {score.toFixed(3)}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {rangeExpanded && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          요청 범위에 후보가 부족하여 ±{effectiveRange}년으로 자동 확장했습니다.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {panel(
          "younger",
          "younger",
          younger ? `/atlas/${younger.file}` : null,
          younger ? formatLabel(younger) : "—",
          "text-blue-600",
          younger?.score,
        )}
        {panel(
          "patient",
          "patient",
          patientImageUrl,
          `실제 ${ageLabel(patient.age)} (${patient.gender === "M" ? "남" : "여"})`,
          "text-slate-700",
        )}
        {panel(
          "older",
          "older",
          older ? `/atlas/${older.file}` : null,
          older ? formatLabel(older) : "—",
          "text-rose-600",
          older?.score,
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">추정 뼈나이</div>
          <div className="text-3xl font-bold text-slate-900">
            {estimated !== null ? `${estimated.toFixed(2)}세` : "—"}
          </div>
        </div>
        <div className="text-xs text-slate-500 max-w-xs text-right">
          유사도 가중 평균 (younger × S₁ + older × S₂) / (S₁ + S₂). 원장님 판단을 위한 참고값이며
          최종 확정은 의사가 합니다.
        </div>
      </div>

      {result.ranking.length > 2 && (
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            다른 상위 후보 보기 ({result.ranking.length}개)
          </summary>
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {result.ranking.map((c) => (
              <div
                key={c.file}
                className="flex flex-col items-center gap-1 text-center"
                title={`wrist ${c.scoreWrist.toFixed(2)} · finger ${c.scoreFinger.toFixed(2)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/atlas/${c.file}`}
                  alt={formatLabel(c)}
                  className="w-full aspect-[800/1166] object-contain rounded bg-slate-900"
                />
                <div className="text-[11px] font-medium text-slate-700">{formatLabel(c)}</div>
                <div className="text-[10px] text-slate-500">{c.score.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
