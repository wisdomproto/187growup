"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PatientForm from "@/components/PatientForm";
import XrayUpload from "@/components/XrayUpload";
import XrayCanvas from "@/components/XrayCanvas";
import MatchResultView from "@/components/MatchResultView";
import { loadAtlas } from "@/lib/atlas";
import { loadImage } from "@/lib/image";
import { runMatch } from "@/lib/matcher";
import type { AtlasEntry, MatchResult, PatientInput, RoiNorm } from "@/lib/types";

export default function Home() {
  const [patient, setPatient] = useState<PatientInput>({
    gender: "M",
    age: 10,
    ageRange: 1,
  });
  const [atlas, setAtlas] = useState<AtlasEntry[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [wristRoi, setWristRoi] = useState<RoiNorm | null>(null);
  const [fingerRoi, setFingerRoi] = useState<RoiNorm | null>(null);
  const [activeRoi, setActiveRoi] = useState<"wrist" | "finger">("wrist");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  // Load atlas manifest once
  useEffect(() => {
    loadAtlas()
      .then((d) => setAtlas(d.entries))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const candidateCount = useMemo(() => {
    if (!atlas) return 0;
    return atlas.filter(
      (e) => e.gender === patient.gender && Math.abs(e.age - patient.age) <= patient.ageRange,
    ).length;
  }, [atlas, patient.gender, patient.age, patient.ageRange]);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    setWristRoi(null);
    setFingerRoi(null);
    setActiveRoi("wrist");
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    const url = URL.createObjectURL(file);
    prevUrl.current = url;
    setImageUrl(url);
    try {
      const img = await loadImage(url);
      setImageEl(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // Run matching whenever both ROIs present and inputs stable
  useEffect(() => {
    if (!atlas || !imageEl || !wristRoi || !fingerRoi) return;
    let cancelled = false;
    setLoading(true);
    runMatch({ patient, patientImage: imageEl, wristRoi, fingerRoi, atlas })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [atlas, imageEl, wristRoi, fingerRoi, patient]);

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-6 space-y-6 text-slate-900 bg-white min-h-screen">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">🦴 BoneAgeAI — Atlas 매칭</h1>
        <p className="text-sm text-slate-600">
          『소아의 골연령 판정』 Atlas를 기준으로 환자 X-ray에 가장 가까운 레퍼런스 2장(younger/older)을 자동으로 찾아
          뼈나이를 추정합니다. 이미지는 브라우저 내에서만 처리됩니다.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">① 환자 정보</h2>
        <PatientForm value={patient} onChange={setPatient} />
        <div className="text-xs text-slate-500">
          Atlas 후보 {atlas?.length ?? "…"}장 중 <strong>{candidateCount}장</strong>이 현재 범위(±{patient.ageRange}년)에 해당합니다.
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">② X-ray 업로드 & ROI 지정</h2>
        {!imageUrl ? (
          <XrayUpload onFile={handleFile} />
        ) : (
          <div className="space-y-3">
            <XrayCanvas
              imageUrl={imageUrl}
              imageEl={imageEl}
              wristRoi={wristRoi}
              fingerRoi={fingerRoi}
              onRoiChange={(k, r) => (k === "wrist" ? setWristRoi(r) : setFingerRoi(r))}
              activeRoi={activeRoi}
              onActiveRoiChange={setActiveRoi}
            />
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setWristRoi(null);
                  setFingerRoi(null);
                  setActiveRoi("wrist");
                  setResult(null);
                }}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50"
              >
                ROI 초기화
              </button>
              <button
                type="button"
                onClick={() => {
                  if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
                  prevUrl.current = null;
                  setImageUrl(null);
                  setImageEl(null);
                  setWristRoi(null);
                  setFingerRoi(null);
                  setResult(null);
                }}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50"
              >
                다른 이미지 업로드
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-slate-800">
          ③ 매칭 결과 {loading && <span className="text-xs text-slate-500">계산 중…</span>}
        </h2>
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
