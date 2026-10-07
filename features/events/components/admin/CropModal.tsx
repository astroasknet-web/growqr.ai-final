"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X, Loader2, Check, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  aspect: number;            // e.g. 16/9 for poster, 1 for speaker
  title: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
}

interface PixelCrop { x: number; y: number; width: number; height: number; }

async function getCroppedBlob(
  src: string,
  cropPx: PixelCrop,
  mime = "image/jpeg",
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropPx.width);
  canvas.height = Math.round(cropPx.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    cropPx.x, cropPx.y, cropPx.width, cropPx.height,
    0, 0, canvas.width, canvas.height,
  );

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to render crop"))),
      mime,
      0.92,
    );
  });
}

export default function CropModal({ src, aspect, title, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPx, setCropPx] = useState<PixelCrop | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCropPx(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!cropPx) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(src, cropPx);
      await onConfirm(blob);
    } catch (err) {
      console.error(err);
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-black/[0.06] shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-ink tracking-tight">{title}</h2>
            <p className="text-[12.5px] text-ink-4">Drag to reposition · pinch / scroll to zoom</p>
          </div>
          <button
            onClick={onCancel}
            disabled={working}
            className="shrink-0 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-ink-3 hover:bg-black/10 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="relative bg-black/95 shrink-0" style={{ height: 420 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <footer className="flex flex-col gap-4 px-6 py-4 border-t border-black/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
              disabled={working}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-ink-3 text-[12px] font-semibold hover:bg-black/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider">Zoom</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-orange"
                disabled={working}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={working}
              className="px-5 py-2.5 rounded-full border border-black/[0.12] text-ink-2 text-[14px] font-semibold hover:bg-cream-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={working || !cropPx}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_8px_24px_-8px_rgba(255,106,47,0.45)] hover:bg-orange-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {working ? "Uploading…" : "Apply & upload"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
