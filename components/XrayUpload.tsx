"use client";

import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
}

export default function XrayUpload({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file?: File | null) => {
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
        dragging
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 bg-slate-50 hover:border-slate-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      <p className="text-sm font-medium text-slate-700">
        환자 X-ray를 여기로 끌어다 놓거나 <span className="text-blue-600 underline">클릭하여 선택</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">JPG / PNG / WebP — 이미지는 서버로 전송되지 않습니다.</p>
    </div>
  );
}
