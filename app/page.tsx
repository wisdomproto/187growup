"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PatientForm from "@/components/PatientForm";
import XrayUpload from "@/components/XrayUpload";
import XrayPreview from "@/components/XrayPreview";
import MatchResultView from "@/components/MatchResultView";
import BoneAgeInput from "@/components/BoneAgeInput";

// Chart.js/zoom plugin touches `window` at module init, so load on client only
const PredictionResult = dynamic(() => import("@/components/PredictionResult"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      그래프 로드 중…
    </div>
  ),
});
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
  const [boneAge, setBoneAge] = useState<number | null>(null);
  const [currentHeight, setCurrentHeight] = useState<number | null>(null);
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

  const canPredict = boneAge !== null && currentHeight !== null && currentHeight > 0;

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-6 space-y-6 text-slate-900 bg-white min-h-screen">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">🦴 BoneAgeAI — Atlas 비교 + 예상키 예측</h1>
        <p className="text-sm text-slate-600">
          생년월일/X-ray일로 역년령 계산 → 『소아의 골연령 판정』 Atlas의 위·아래 레퍼런스 비교 →
          판독 뼈나이 + 현재 키 입력 → Bayley-Pinneau 방식으로 예상 성인키 자동 계산.
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

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">④ 뼈나이 판독 & 현재 키</h2>
        <p className="text-xs text-slate-500">
          위 Atlas를 시각 비교해서 판단한 <strong>실제 뼈나이</strong>와 환자의 <strong>현재 키</strong>를 입력하세요.
          퀵 버튼으로 younger/older 나이를 바로 채울 수 있습니다.
        </p>
        <BoneAgeInput
          boneAge={boneAge}
          onBoneAgeChange={setBoneAge}
          height={currentHeight}
          onHeightChange={setCurrentHeight}
          match={result}
        />
      </section>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">⑤ 예상 성인키 & 성장 곡선</h2>
        {canPredict && boneAge !== null && currentHeight !== null ? (
          <PredictionResult
            gender={patient.gender}
            patientAge={age}
            boneAge={boneAge}
            currentHeight={currentHeight}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            ④ 단계의 뼈나이와 현재 키를 입력하면 예상 성인키와 성장 곡선이 애니메이션으로 표시됩니다.
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          오류: {error}
        </div>
      )}
    </main>
  );
}
