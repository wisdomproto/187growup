"use client";

import type { PatientInput } from "@/lib/types";

interface Props {
  value: PatientInput;
  onChange: (v: PatientInput) => void;
}

export default function PatientForm({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        성별
        <div className="flex gap-2">
          {(["M", "F"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...value, gender: g })}
              className={`flex-1 rounded-md border px-3 py-2 font-semibold transition ${
                value.gender === g
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {g === "M" ? "남자" : "여자"}
            </button>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        실제 나이 (세)
        <input
          type="number"
          min={1}
          max={18}
          step={0.1}
          value={value.age}
          onChange={(e) =>
            onChange({ ...value, age: Math.max(1, Math.min(18, Number(e.target.value) || 0)) })
          }
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        나이 필터 범위
        <select
          value={value.ageRange}
          onChange={(e) => onChange({ ...value, ageRange: Number(e.target.value) })}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value={1}>±1년 (기본)</option>
          <option value={2}>±2년</option>
          <option value={3}>±3년</option>
        </select>
      </label>
    </div>
  );
}
