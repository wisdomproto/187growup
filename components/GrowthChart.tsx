"use client";

// GrowthChart — 187 클리닉 스타일 성장 곡선
// 3rd/15th/50th/85th/97th 퍼센타일 + 환자 현재점 + 예측 곡선
// 고정 축: x=5~18.5세, y=90~190cm, 16:9 비율

import { useMemo } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartDataset,
} from "chart.js";
import { Line } from "react-chartjs-2";

type LineDataset = ChartDataset<"line", { x: number; y: number }[]>;
import { getHeightStandard } from "@/lib/growthStandard";
import { toLongGender } from "@/lib/growthPrediction";
import type { Gender } from "@/lib/types";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface GrowthPoint {
  age: number;
  height: number;
}

interface Props {
  gender: Gender;
  points: GrowthPoint[];
  predictedCurve?: GrowthPoint[];
  /** Chronologic age vertical reference line (left-pointing orange). */
  chronologicAge?: number | null;
  /** Bone age vertical reference line (drawn dashed). */
  boneAge?: number | null;
  /** Current height horizontal reference (red). */
  currentHeight?: number | null;
  showTitle?: boolean;
}

const X_MIN = 5;
const X_MAX = 18.5;
const Y_MIN = 90;
const Y_MAX = 190;

const COLORS = {
  p3: "#3b82f6",    // blue
  p15: "#f59e0b",   // orange
  p50: "#22c55e",   // green
  p85: "#ef4444",   // red
  p97: "#a855f7",   // purple
  patient: "#1e293b",
  predicted: "#F59E0B",
  chronoLine: "#f97316",
  boneAgeLine: "#6366f1",
  heightLine: "#ef4444",
};

export function GrowthChart({
  gender,
  points,
  predictedCurve,
  chronologicAge,
  boneAge,
  currentHeight,
  showTitle = true,
}: Props) {
  const chartData = useMemo(() => {
    const standard = getHeightStandard(toLongGender(gender));
    const stdFiltered = standard.filter((d) => d.age >= X_MIN && d.age <= X_MAX);
    const toXY = (pick: (d: typeof stdFiltered[number]) => number) =>
      stdFiltered.map((d) => ({ x: d.age, y: pick(d) }));

    // Vertical/horizontal reference lines (drawn as datasets for simplicity — no annotation plugin)
    const refDatasets: LineDataset[] = [];
    if (typeof chronologicAge === "number") {
      refDatasets.push({
        label: "역년령",
        data: [
          { x: chronologicAge, y: Y_MIN },
          { x: chronologicAge, y: Y_MAX },
        ],
        borderColor: COLORS.chronoLine,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0,
        order: 10,
      });
    }
    if (typeof boneAge === "number") {
      refDatasets.push({
        label: "뼈나이",
        data: [
          { x: boneAge, y: Y_MIN },
          { x: boneAge, y: Y_MAX },
        ],
        borderColor: COLORS.boneAgeLine,
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        tension: 0,
        order: 11,
      });
    }
    if (typeof currentHeight === "number") {
      refDatasets.push({
        label: "현재 키",
        data: [
          { x: X_MIN, y: currentHeight },
          { x: X_MAX, y: currentHeight },
        ],
        borderColor: COLORS.heightLine,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0,
        order: 12,
      });
    }

    const percentileDatasets = [
      { key: "p3", label: "3rd", color: COLORS.p3 },
      { key: "p15", label: "15th", color: COLORS.p15 },
      { key: "p50", label: "50th", color: COLORS.p50 },
      { key: "p85", label: "85th", color: COLORS.p85 },
      { key: "p97", label: "97th", color: COLORS.p97 },
    ].map(({ key, label, color }) => ({
      label,
      data: toXY((d) => d[key as keyof typeof stdFiltered[number]] as number),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.35,
      order: 1,
    }));

    return {
      datasets: [
        ...percentileDatasets,
        ...refDatasets,
        {
          label: "실제 키",
          data: points.map((p) => ({ x: p.age, y: p.height })),
          borderColor: COLORS.patient,
          backgroundColor: COLORS.patient,
          borderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
          order: 0,
        },
        ...(predictedCurve && predictedCurve.length > 0
          ? [
              {
                label: "예상 성장곡선",
                data: predictedCurve.map((p) => ({ x: p.age, y: p.height })),
                borderColor: COLORS.predicted,
                backgroundColor: COLORS.predicted,
                borderWidth: 2.5,
                borderDash: [6, 4] as number[],
                pointRadius: predictedCurve.map((_, i) =>
                  i === predictedCurve.length - 1 ? 7 : 3,
                ),
                pointHoverRadius: 7,
                pointBackgroundColor: predictedCurve.map((_, i) =>
                  i === predictedCurve.length - 1 ? COLORS.predicted : "#FCD34D",
                ),
                pointBorderColor: "#fff",
                pointBorderWidth: 1.5,
                spanGaps: true,
                tension: 0.3,
                fill: false,
                order: 0,
              },
            ]
          : []),
      ],
    };
  }, [gender, points, predictedCurve, chronologicAge, boneAge, currentHeight]);

  const options: Parameters<typeof Line>[0]["options"] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 16 / 9,
    animation: {
      duration: 600,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        align: "center" as const,
        labels: {
          boxWidth: 16,
          font: { size: 12 },
          padding: 10,
          // Only show percentile/series labels, hide ref-line entries to reduce clutter
          filter: (item: { text?: string }) =>
            !!item.text && !["역년령", "뼈나이", "현재 키"].includes(item.text),
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.parsed.y != null ? `${ctx.dataset.label}: ${ctx.parsed.y}cm @ ${ctx.parsed.x}세` : "",
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: { display: true, text: "Age (years)", font: { size: 13 } },
        min: X_MIN,
        max: X_MAX,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          callback: (val) => (Number.isInteger(Number(val)) ? `${val}` : ""),
        },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
      y: {
        title: { display: true, text: "Height (cm)", font: { size: 13 } },
        min: Y_MIN,
        max: Y_MAX,
        ticks: {
          stepSize: 5,
          font: { size: 11 },
        },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
    },
  };

  return (
    <div className="w-full">
      {showTitle && (
        <div className="mb-2">
          <h4 className="text-base font-bold text-slate-800">성장 그래프</h4>
        </div>
      )}
      <Line data={chartData} options={options} />
    </div>
  );
}
