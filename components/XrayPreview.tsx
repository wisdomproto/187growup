"use client";

interface Props {
  imageUrl: string | null;
  onReset: () => void;
}

export default function XrayPreview({ imageUrl, onReset }: Props) {
  if (!imageUrl) return null;
  return (
    <div className="space-y-2">
      <div className="relative w-full max-w-md mx-auto aspect-[800/1166] bg-slate-900 rounded-md overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="환자 X-ray" className="w-full h-full object-contain" />
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
        >
          다른 이미지 업로드
        </button>
      </div>
    </div>
  );
}
