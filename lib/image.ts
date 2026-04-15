import type { RoiNorm } from "./types";

/** Load an image from a URL (or object URL) into an HTMLImageElement. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** Draw image into an offscreen canvas of the given size. */
export function drawToCanvas(
  img: HTMLImageElement | ImageBitmap,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Crop a normalized ROI from an image and return a fixed-size grayscale Float32Array. */
export async function cropRoiToGray(
  img: HTMLImageElement,
  roi: RoiNorm,
  outSize = 128,
): Promise<{ data: Float32Array; size: number }> {
  const sx = Math.round(roi.x * img.naturalWidth);
  const sy = Math.round(roi.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(roi.w * img.naturalWidth));
  const sh = Math.max(1, Math.round(roi.h * img.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outSize, outSize);

  const rgba = ctx.getImageData(0, 0, outSize, outSize).data;
  const gray = new Float32Array(outSize * outSize);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    // Standard luminance weights
    gray[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return { data: gray, size: outSize };
}

/** Convert normalized ROI to pixel rect relative to a canvas size. */
export function roiToPixels(roi: RoiNorm, canvasW: number, canvasH: number) {
  return {
    x: roi.x * canvasW,
    y: roi.y * canvasH,
    w: roi.w * canvasW,
    h: roi.h * canvasH,
  };
}

/** Compute a unit-safe ROI from two arbitrary points. */
export function roiFromPoints(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  canvasW: number,
  canvasH: number,
): RoiNorm {
  const x0 = Math.min(ax, bx);
  const y0 = Math.min(ay, by);
  const x1 = Math.max(ax, bx);
  const y1 = Math.max(ay, by);
  return {
    x: Math.max(0, x0 / canvasW),
    y: Math.max(0, y0 / canvasH),
    w: Math.min(1 - x0 / canvasW, (x1 - x0) / canvasW),
    h: Math.min(1 - y0 / canvasH, (y1 - y0) / canvasH),
  };
}
