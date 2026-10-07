"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, AlertCircle, Crop } from "lucide-react";
import CropModal from "./CropModal";

interface Props {
  value: string;
  onChange: (url: string) => void;
  purpose: "posters" | "speakers";
  hint?: string;
  label?: string;
  aspect?: "video" | "square" | "portrait";
  cropTitle?: string;
  /** Compact mode: renders a small fixed-size picker instead of a full aspect-ratio box.
   *  Ideal for speaker photos embedded in a form row. */
  compact?: boolean;
}

const aspectCls: Record<string, string> = {
  video: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};
const aspectRatio: Record<string, number> = {
  video: 16 / 9,
  square: 1,
  portrait: 3 / 4,
};

export default function ImageUploader({
  value,
  onChange,
  purpose,
  hint,
  label,
  aspect = "video",
  cropTitle,
  compact = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const openCrop = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10 MB).");
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const performUpload = async (blob: Blob) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append(
        "file",
        new File([blob], `${hint || "asset"}.jpg`, { type: "image/jpeg" }),
      );
      fd.append("purpose", purpose);
      if (hint) fd.append("hint", hint);

      const res = await fetch("/api/admin/events/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Upload failed.");
        return;
      }

      if (value && value.includes("/storage/v1/object/public/event-assets/")) {
        fetch("/api/admin/events/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        }).catch(() => {});
      }

      onChange(json.url);
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
      }
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setError(null);
    if (value && value.includes("/storage/v1/object/public/event-assets/")) {
      setRemoving(true);
      try {
        await fetch("/api/admin/events/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
      } catch {
        /* ignore */
      } finally {
        setRemoving(false);
      }
    }
    onChange("");
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCrop(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openCrop(file);
  };

  const aspectVal = aspectRatio[aspect] ?? aspectRatio.video;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-[12px] font-semibold text-ink-3 uppercase tracking-[0.06em]">
          {label}
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleSelect}
      />

      {/* ── Compact mode (speaker photo) ─────────────────────────────── */}
      {compact ? (
        <div className="flex items-center gap-4">
          {/* Preview circle */}
          <div
            className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-cream-2 border border-black/[0.08] shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Speaker photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-ink-5" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-orange animate-spin" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-black/[0.12] bg-white text-[12.5px] font-semibold text-ink-2 hover:border-orange/40 hover:text-orange-deep transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {value ? "Replace" : "Upload photo"}
            </button>
            {value && (
              <button
                type="button"
                onClick={remove}
                disabled={uploading || removing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-black/[0.08] bg-white text-[12.5px] font-medium text-ink-4 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Remove
              </button>
            )}
            <p className="text-[11px] text-ink-5">JPG, PNG, WEBP · max 10 MB</p>
          </div>
        </div>
      ) : (
        /* ── Standard mode (poster / full area) ─────────────────────── */
        value ? (
          <div className={`relative ${aspectCls[aspect] ?? aspectCls.video} rounded-xl overflow-hidden border border-black/[0.08] bg-cream-2 group`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || removing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-ink text-[12px] font-semibold shadow-sm hover:bg-white transition-colors disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" /> Replace
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={uploading || removing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-red-600 text-[12px] font-semibold shadow-sm hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Remove
              </button>
            </div>
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white text-[10.5px] font-semibold uppercase tracking-wider">
              <Crop className="w-3 h-3" /> Cropped
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            disabled={uploading}
            className={`${aspectCls[aspect] ?? aspectCls.video} w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver
                ? "border-orange bg-orange-lighter"
                : "border-black/[0.12] bg-cream-2 hover:border-orange/40 hover:bg-cream"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-orange animate-spin" />
                <p className="text-[13px] font-semibold text-ink-3">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white border border-black/[0.06] flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-5 h-5 text-ink-4" />
                </div>
                <p className="text-[13.5px] font-semibold text-ink-2">
                  Click to upload <span className="text-ink-4 font-normal">or drag & drop</span>
                </p>
                <p className="text-[11.5px] text-ink-4">JPG, PNG, WEBP, GIF · up to 10 MB</p>
              </>
            )}
          </button>
        )
      )}

      {error && (
        <div className="flex items-start gap-2 text-[12.5px] text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={aspectVal}
          title={cropTitle || "Crop image"}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onConfirm={performUpload}
        />
      )}
    </div>
  );
}
