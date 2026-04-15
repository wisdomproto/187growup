"use client";

import type { MatchResult } from "@/lib/types";
import { PRED_AGE_MIN, PRED_AGE_MAX } from "@/lib/growthPrediction";

interface Props {
  /** Bone age (decimal years). null = not set yet. */
  boneAge: number | null;
  onBoneAgeChange: (v: number | null) => void;
  /** Current height in cm. null = not set yet. */
  height: number | null;
  onHeightChange: (v: number | null) => void;
  /** Show quick-pick buttons based on atlas match. */
  match: MatchResult;
}

export default function BoneAgeInput({
  boneAge,
  onBoneAgeChange,
  height,
  onHeightChange,
  match,
}: Props) {
  const outOfRange =
    boneAge !== null && (boneAge < PRED_AGE_MIN || boneAge > PRED_AGE_MAX);

  const quick: { label: string; value: number }[] = [];
  if (match.younger) quick.push({ label: `${match.younger.age.toFixed(1)}세 (younger)`, value: match.younger.age });
  if (match.older) quick.push({ label: `${match.older.age.toFixed(1)}세 (older)`, value: match.older.age });
  if (match.younger && match.older) {
    const mid = Math.round(((match.younger.age + match.older.age) / 2) * 10) / 10;
    quick.splice(1, 0, { label: `중간값 ${mid.toFixed(1)}세`, value: mid });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        판독 뼈나이 (세)
        <input
          type="number"
          min={1}
          max={18}
          step={0.1}
          value={boneAge ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onBoneAgeChange(v === "" ? null : Number(v));
          }}
          placeholder="예: 12.5"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
        {quick.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onBoneAgeChange(q.value)}
                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs hover:bg-slate-100"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
        {outOfRange && (
          <span className="text-xs text-amber-700">
            KDCA 성장 표준은 {PRED_AGE_MIN}~{PRED_AGE_MAX}세만 지원합니다. 범위 밖은 경계값으로 근사하여 참고용으로만 사용하세요.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        현재 키 (cm)
        <input
          type="number"
          min={50}
          max={220}
          step={0.1}
          value={height ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onHeightChange(v === "" ? null : Number(v));
          }}
          placeholder="예: 155.2"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>
    </div>
  );
}
