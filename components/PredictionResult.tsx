"use client";

import { useEffect, useMemo, useState } from "react";
import { GrowthChart } from "./GrowthChart";
import {
  predictAdultHeightBP,
  buildProjectedCurve,
  BP_AGE_MIN,
  BP_AGE_MAX,
} from "@/lib/growthPrediction";
import { calculateHeightPercentileLMS } from "@/lib/growthStandard";
import { toLongGender } from "@/lib/growthPrediction";
import type { Gender } from "@/lib/types";

interface Props {
  gender: Gender;
  /** Chronological age; if null, we use boneAge for chart positioning. */
  patientAge: number | null;
  boneAge: number;
  currentHeight: number;
}

export default function PredictionResult({ gender, patientAge, boneAge, currentHeight }: Props) {
  // Chart positioning falls back to bone age when DOB wasn't provided
  const chartAge = patientAge ?? boneAge;
  const adultHeight = useMemo(
    () => predictAdultHeightBP(currentHeight, boneAge, gender),
    [currentHeight, boneAge, gender],
  );

  const fullCurve = useMemo(
    () => buildProjectedCurve(chartAge, currentHeight, gender, adultHeight),
    [chartAge, currentHeight, gender, adultHeight],
  );

  const currentPercentile = useMemo(
    () => calculateHeightPercentileLMS(currentHeight, chartAge, toLongGender(gender)),
    [currentHeight, chartAge, gender],
  );

  const adultPercentile = useMemo(
    () => calculateHeightPercentileLMS(adultHeight, 18, toLongGender(gender)),
    [adultHeight, gender],
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
  const outOfBP = boneAge < BP_AGE_MIN || boneAge > BP_AGE_MAX;
  const heightGain = adultHeight > 0 ? Math.round((adultHeight - currentHeight) * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="현재 키" value={`${currentHeight.toFixed(1)}cm`} sub={`${currentPercentile.toFixed(0)}%ile`} color="text-slate-800" />
        <Stat
          label="판독 뼈나이"
          value={`${boneAge.toFixed(1)}세`}
          sub={patientAge !== null ? `역년령 ${patientAge.toFixed(1)}세` : "역년령 미입력"}
          color="text-slate-800"
        />
        <Stat
          label="예상 성인키 (BP)"
          value={adultHeight > 0 ? `${adultHeight.toFixed(1)}cm` : "—"}
          sub={adultHeight > 0 ? `18세 기준 ${adultPercentile.toFixed(0)}%ile` : undefined}
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

      {outOfBP && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          Bayley-Pinneau 표는 {BP_AGE_MIN}~{BP_AGE_MAX}세 골연령에 대해서만 정의됩니다. 범위 밖은 경계값으로 근사하여 참고용으로만 사용하세요.
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
          currentHeight={currentHeight}
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
