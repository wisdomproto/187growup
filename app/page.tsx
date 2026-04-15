"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PatientForm from "@/components/PatientForm";
import XrayUpload from "@/components/XrayUpload";
import XrayPreview from "@/components/XrayPreview";
import MatchResultView from "@/components/MatchResultView";
import { loadAtlas } from "@/lib/atlas";
import { computeAge, matchByAge, todayIso } from "@/lib/matcher";
import type { AtlasEntry, PatientInput } from "@/lib/types";

export default function Home() {
  const [patient, setPatient] = useState<PatientInput>({
    gender: "M",
    birthDate: "",
    xrayDate: todayIso(),
  });
  const [atlas, setAtlas] = useState<AtlasEntry[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    loadAtlas()
      .then((d) => setAtlas(d.entries))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const age = useMemo(
    () => computeAge(patient.birthDate, patient.xrayDate),
    [patient.birthDate, patient.xrayDate],
  );

  const result = useMemo(() => {
    if (!atlas) return { patientAge: null, younger: null, older: null };
    return matchByAge(atlas, patient.gender, age);
  }, [atlas, patient.gender, age]);

  const handleFile = (file: File) => {
    setError(null);
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    const url = URL.createObjectURL(file);
    prevUrl.current = url;
    setImageUrl(url);
  };

  const resetImage = () => {
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    prevUrl.current = null;
    setImageUrl(null);
  };

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-6 space-y-6 text-slate-900 bg-white min-h-screen">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">🦴 BoneAgeAI — Atlas 비교</h1>
        <p className="text-sm text-slate-600">
          환자의 생년월일과 X-ray 촬영일을 입력하면 『소아의 골연령 판정』 Atlas에서
          해당 나이 바로 아래·위 레퍼런스 이미지를 양옆에 표시합니다. 최종 판독은 의사가 시각 비교로 확정합니다.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">① 환자 정보</h2>
        <PatientForm value={patient} onChange={setPatient} age={age} />
      </section>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">② X-ray 이미지 (선택)</h2>
        {!imageUrl ? (
          <XrayUpload onFile={handleFile} />
        ) : (
          <XrayPreview imageUrl={imageUrl} onReset={resetImage} />
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">③ Atlas 비교 (younger / patient / older)</h2>
        <MatchResultView result={result} patient={patient} patientImageUrl={imageUrl} />
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          오류: {error}
        </div>
      )}
    </main>
  );
}
