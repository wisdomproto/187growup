"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoiNorm } from "@/lib/types";
import { roiFromPoints, roiToPixels } from "@/lib/image";

type RoiKey = "wrist" | "finger";

interface Props {
  imageUrl: string | null;
  imageEl: HTMLImageElement | null;
  wristRoi: RoiNorm | null;
  fingerRoi: RoiNorm | null;
  onRoiChange: (key: RoiKey, roi: RoiNorm) => void;
  activeRoi: RoiKey;
  onActiveRoiChange: (key: RoiKey) => void;
}

export default function XrayCanvas({
  imageUrl,
  imageEl,
  wristRoi,
  fingerRoi,
  onRoiChange,
  activeRoi,
  onActiveRoiChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // Drag is tracked via refs to avoid stale closures across rapid synthetic events
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick((t) => t + 1), []);

  // Fit canvas to container width, keep image aspect
  useEffect(() => {
    if (!imageEl || !canvasRef.current) return;
    const parent = canvasRef.current.parentElement;
    if (!parent) return;
    const maxW = Math.min(parent.clientWidth, 700);
    const aspect = imageEl.naturalHeight / imageEl.naturalWidth;
    const w = maxW;
    const h = Math.round(w * aspect);
    setCanvasSize({ w, h });
  }, [imageEl]);

  // Redraw on state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl || canvasSize.w === 0) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageEl, 0, 0, canvas.width, canvas.height);

    const drawRoi = (roi: RoiNorm | null, color: string, label: string, active: boolean) => {
      if (!roi) return;
      const r = roiToPixels(roi, canvas.width, canvas.height);
      ctx.save();
      ctx.lineWidth = active ? 3 : 2;
      ctx.strokeStyle = color;
      ctx.setLineDash(active ? [] : [6, 4]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = color;
      ctx.fillRect(r.x, r.y - 22, 76, 22);
      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(label, r.x + 6, r.y - 6);
      ctx.restore();
    };

    drawRoi(wristRoi, "#2563eb", "손등", activeRoi === "wrist");
    drawRoi(fingerRoi, "#f97316", "손가락", activeRoi === "finger");

    // Live drag preview
    const drag = dragRef.current;
    const dragEnd = dragEndRef.current;
    if (drag && dragEnd) {
      const x = Math.min(drag.x, dragEnd.x);
      const y = Math.min(drag.y, dragEnd.y);
      const w = Math.abs(dragEnd.x - drag.x);
      const h = Math.abs(dragEnd.y - drag.y);
      ctx.save();
      ctx.strokeStyle = activeRoi === "wrist" ? "#2563eb" : "#f97316";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [imageEl, canvasSize, wristRoi, fingerRoi, activeRoi]);

  const getXY = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageEl) return;
    const p = getXY(e);
    dragRef.current = p;
    dragEndRef.current = p;
    redraw();
  };
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    dragEndRef.current = getXY(e);
    redraw();
  };
  const handleUp = () => {
    const drag = dragRef.current;
    const dragEnd = dragEndRef.current;
    if (!drag || !dragEnd) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const minSize = 20;
      if (Math.abs(dragEnd.x - drag.x) > minSize && Math.abs(dragEnd.y - drag.y) > minSize) {
        const roi = roiFromPoints(drag.x, drag.y, dragEnd.x, dragEnd.y, canvas.width, canvas.height);
        onRoiChange(activeRoi, roi);
        // Auto-switch to the other ROI on first draw
        if (activeRoi === "wrist" && !fingerRoi) onActiveRoiChange("finger");
      }
    }
    dragRef.current = null;
    dragEndRef.current = null;
    redraw();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-700">선택 중인 ROI:</span>
        <button
          type="button"
          onClick={() => onActiveRoiChange("wrist")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            activeRoi === "wrist"
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          손등 박스
        </button>
        <button
          type="button"
          onClick={() => onActiveRoiChange("finger")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            activeRoi === "finger"
              ? "bg-orange-500 text-white"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          손가락 박스
        </button>
        <span className="ml-auto text-xs text-slate-500">
          이미지 위에서 드래그하여 영역을 지정하세요.
        </span>
      </div>
      <div className="relative inline-block bg-slate-900 rounded-md overflow-hidden">
        {imageUrl ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            className="cursor-crosshair block"
          />
        ) : (
          <div className="w-[500px] h-[600px] flex items-center justify-center text-slate-400">
            X-ray 이미지를 먼저 업로드하세요
          </div>
        )}
      </div>
    </div>
  );
}
