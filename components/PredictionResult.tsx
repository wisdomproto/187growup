"use client";

import { useEffect, useMemo, useState } from "react";
import { GrowthChart } from "./GrowthChart";
import {
  predictAdultHeightByBonePercentile,
  buildProjectedCurve,
  percentileAtBoneAge,
  toLongGender,
  PRED_AGE_MIN,
  PRED_AGE_MAX,
} from "@/lib/growthPrediction";
import { calculateHeightPercentileLMS } from "@/lib/growthStandard";
import type { Gender } from "@/lib/types";

interface Props {
  gender: Gender;
  /** Chronological age; if null, we use boneAge for chart positioning. */
  patientAge: number | null;
  boneAge: number;
  currentHeight: number;
}

export default function PredictionResult({ gender, patientAge, boneAge, currentHeight }: Props) {
  // Dot on the chart: plot the patient at their CHRONOLOGICAL age (falls back
  // to bone age when DOB isn't entered). Prediction math is driven by bone age.
  const chartAge = patientAge ?? boneAge;

  const adultHeight = useMemo(
    () => predictAdultHeightByBonePercentile(currentHeight, boneAge, gender),
    [currentHeight, boneAge, gender],
  );

  const fullCurve = useMemo(
    () => buildProjectedCurve(boneAge, currentHeight, gender),
    [boneAge, currentHeight, gender],
  );

  // "Where does the child land today?" — percentile at bone age drives the prediction.
  const bonePercentile = useMemo(
    () => percentileAtBoneAge(currentHeight, boneAge, gender),
    [currentHeight, boneAge, gender],
  );

  // For reference, also show percentile at chronological age (different curve).
  const chronoPercentile = useMemo(
    () => calculateHeightPercentileLMS(currentHeight, chartAge, toLongGender(gender)),
    [currentHeight, chartAge, gender],
  );

  // Animate: reveal projected curve point-by-point
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    if (fullCurve.length === 0) return;
    const stepMs = 180;
    const id = window.setInterval(() => {
      setRevealed((r) => {
        if (r >= fullCurve.length) {
          window.clearInterval(id);
          return r;
        }
        return r + 1;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [fullCurve]);

  const visibleCurve = fullCurve.slice(0, revealed);
  const outOfRange = boneAge < PRED_AGE_MIN || boneAge > PRED_AGE_MAX;
  const heightGain = adultHeight > 0 ? Math.round((adultHeight - currentHeight) * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="현재 키"
          value={`${currentHeight.toFixed(1)}cm`}
          sub={`역년령 ${chronoPercentile.toFixed(0)}%ile · 뼈나이 ${bonePercentile.toFixed(0)}%ile`}
          color="text-slate-800"
        />
        <Stat
          label="판독 뼈나이"
          value={`${boneAge.toFixed(1)}세`}
          sub={patientAge !== null ? `역년령 ${patientAge.toFixed(1)}세` : "역년령 미입력"}
          color="text-slate-800"
        />
        <Stat
          label="예상 성인키"
          value={adultHeight > 0 ? `${adultHeight.toFixed(1)}cm` : "—"}
          sub={adultHeight > 0 ? `뼈나이 ${bonePercentile.toFixed(0)}%ile 유지 가정` : undefined}
          color="text-indigo-600"
          emphasize
        />
        <Stat
          label="앞으로 성장"
          value={heightGain > 0 ? `+${heightGain.toFixed(1)}cm` : "—"}
          sub={heightGain > 0 ? "남은 성장량" : undefined}
          color="text-emerald-600"
        />
      </div>

      {outOfRange && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          KDCA 성장 표준은 {PRED_AGE_MIN}~{PRED_AGE_MAX}세 범위에서만 정의됩니다. 범위 밖은 경계값으로 근사하여 참고용으로만 사용하세요.
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <GrowthChart
          gender={gender}
          points={[{ age: chartAge, height: currentHeight }]}
          predictedCurve={visibleCurve}
          chronologicAge={patientAge}
          boneAge={boneAge}
          predictedAdultHeight={adultHeight || null}
          showTitle
        />
        {revealed < fullCurve.length && (
          <div className="mt-2 text-xs text-slate-500 text-center">
            성장 경로 {revealed}/{fullCurve.length} …
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        emphasize
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
