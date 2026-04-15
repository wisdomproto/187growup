"use client";

import type { PatientInput } from "@/lib/types";

interface Props {
  value: PatientInput;
  onChange: (v: PatientInput) => void;
  /** Chronological age in years computed from (xrayDate - birthDate). null if invalid. */
  age: number | null;
}

export default function PatientForm({ value, onChange, age }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
        생년월일
        <input
          type="date"
          value={value.birthDate}
          max={value.xrayDate || undefined}
          onChange={(e) => onChange({ ...value, birthDate: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        X-ray 촬영일
        <input
          type="date"
          value={value.xrayDate}
          min={value.birthDate || undefined}
          onChange={(e) => onChange({ ...value, xrayDate: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>

      <div className="flex flex-col gap-2 text-sm font-medium">
        실제 나이
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 font-bold text-lg">
          {age !== null ? `${age.toFixed(2)}세` : "—"}
        </div>
      </div>
    </div>
  );
}
