"use client";

import React, { useRef, useState } from "react";
import { Upload, Link2, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  kind: "avatar" | "banner";
  value: string;
  onChange: (nextUrl: string) => void;
  hint?: string;
}

async function compressImageFile(file: File, kind: "avatar" | "banner"): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Не удалось прочитать файл изображения"));
      el.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Браузер не поддерживает обработку изображений");
    }

    if (kind === "avatar") {
      // Crisp 512x512 center-cropped square
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(img.width, img.height);
      const sx = Math.max(0, Math.floor((img.width - side) / 2));
      const sy = Math.max(0, Math.floor((img.height - side) / 2));
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    } else {
      // Crisp widescreen banner (up to 1400px wide)
      const maxW = 1400;
      const maxH = 560;
      let targetW = img.width;
      let targetH = img.height;
      if (targetW > maxW) {
        targetH = Math.round((targetH * maxW) / targetW);
        targetW = maxW;
      }
      if (targetH > maxH) {
        targetW = Math.round((targetW * maxH) / targetH);
        targetH = maxH;
      }
      canvas.width = Math.max(1, targetW);
      canvas.height = Math.max(1, targetH);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    let dataUrl = canvas.toDataURL("image/webp", 0.85);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ImageUploadField({
  label,
  kind,
  value,
  onChange,
  hint,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilePick = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения (PNG, JPG, WEBP)");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImageFile(file, kind);
      const res = await fetch("/api/cabinet/profile/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, dataUrl: compressed }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.url) {
        setImgBroken(false);
        onChange(data.url);
      } else {
        setError(data?.error || "Не удалось загрузить фото");
      }
    } catch (err: any) {
      setError(err?.message || "Ошибка обработки фото");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D0A16] border border-white/10 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-mono font-bold text-white uppercase tracking-wider">
            {label}
          </label>
          {hint && <p className="text-[11px] text-[#D9D9E2]/55 mt-0.5">{hint}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput((s) => !s)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-[#D9D9E2] transition cursor-pointer"
          >
            <Link2 className="w-3 h-3 text-[#00F0FF]" />
            <span>{showUrlInput ? "Скрыть URL" : "По ссылке"}</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                setImgBroken(false);
                onChange("");
              }}
              title="Удалить изображение"
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview + Upload Dropzone */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#06050B] flex items-center justify-center ${
            kind === "avatar" ? "w-20 h-20" : "w-full sm:w-44 h-20"
          }`}
        >
          {value && !imgBroken ? (
            <img
              src={value}
              alt={label}
              onError={() => setImgBroken(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/30 gap-1">
              <ImageIcon className="w-5 h-5" />
              <span className="font-mono text-[9px] uppercase">
                {kind === "avatar" ? "Нет фото" : "Нет баннера"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-[#8737FF]/55 bg-[#8737FF]/10 hover:bg-[#8737FF]/20 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" />
                <span>Загрузка фото...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-[#00F0FF]" />
                <span>Загрузить фотку с устройства</span>
              </>
            )}
          </button>
        </div>
      </div>

      {(showUrlInput || (value && !value.startsWith("data:"))) && (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setImgBroken(false);
              onChange(e.target.value);
            }}
            placeholder="Или вставьте прямую ссылку https://..."
            className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 focus:border-[#00F0FF] text-white text-xs font-mono outline-none transition"
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-mono text-rose-400">{error}</p>
      )}
    </div>
  );
}
