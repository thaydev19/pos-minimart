"use client";

// ============================================================================
// ProductImageUploader: Client-Side Auto-Compressor & Image Uploader
// Optimized for iPhone/Mobile photos (no 5MB limit, auto WebP compression)
// ============================================================================

import React, { useState, useRef } from "react";
import { UploadCloud, Trash2, Loader2, Link2, Sparkles, CheckCircle2 } from "lucide-react";
import { productsApi } from "../api/products.api";
import { compressImage, formatFileSize } from "@/utils/imageCompressor";

interface ProductImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ProductImageUploader({
  value = "",
  onChange,
  disabled = false,
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<"compressing" | "uploading" | null>(null);
  const [compressionStats, setCompressionStats] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guaranteed strictly controlled string value (never undefined or null)
  const safeValue = typeof value === "string" ? value : "";
  const hasImage = safeValue.trim().length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety guard against accidentally selecting non-image or giant video files (> 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("ຂະໜາດໄຟລ໌ເກີນ 50MB, ກະລຸນາເລືອກຮູບໃໝ່");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setCompressionStats(null);

    try {
      // 1. Client-side Image Optimization & Compression (scales down & converts to WebP)
      setUploadStep("compressing");
      const compressed = await compressImage(file, {
        maxDimension: 1200,
        quality: 0.82,
        preferredMimeType: "image/webp",
      });

      const statsText = `${formatFileSize(compressed.originalSize)} ➔ ${formatFileSize(
        compressed.compressedSize
      )} (-${compressed.reductionPercentage}%)`;
      setCompressionStats(statsText);

      // 2. Upload optimized file (or fallback to Data URL)
      setUploadStep("uploading");
      const finalUrl = await productsApi.uploadProductImage(compressed.file);
      onChange(finalUrl);
    } catch (err: any) {
      console.error("[ProductImageUploader] Upload error:", err);
      setErrorMessage(err.message || "ອັບໂຫຼດຮູບພາບບໍ່ສຳເລັດ");
    } finally {
      setIsUploading(false);
      setUploadStep(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearImage = () => {
    onChange("");
    setErrorMessage(null);
    setCompressionStats(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          ຮູບພາບສິນຄ້າ (Product Image)
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          disabled={disabled || isUploading}
          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Link2 className="h-3 w-3" />
          <span>{isUrlMode ? "ອັບໂຫຼດໄຟລ໌ຮູບ" : "ໃສ່ລິ້ງ URL"}</span>
        </button>
      </div>

      {hasImage ? (
        // Preview Box
        <div className="relative flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 shadow-xs">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <img
              src={safeValue}
              alt="Preview"
              className="h-full w-full object-cover object-center"
              onError={(e) => {
                // fallback if broken url
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/150x150/f1f5f9/94a3b8?text=Error";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>ຮູບພາບພ້ອມໃຊ້ງານແລ້ວ</span>
            </div>

            {compressionStats && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/80 w-fit">
                <Sparkles className="h-3 w-3 shrink-0 text-emerald-600" />
                <span>ບີບອັດ: {compressionStats}</span>
              </div>
            )}

            <p className="mt-1 text-[11px] text-slate-500 truncate max-w-xs font-mono">
              {safeValue.startsWith("data:") ? "Optimized WebP Image (Client Cached)" : safeValue}
            </p>

            <button
              type="button"
              onClick={handleClearImage}
              disabled={disabled || isUploading}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>ລຶບຮູບພາບ</span>
            </button>
          </div>
        </div>
      ) : isUrlMode ? (
        // Direct URL Input Mode
        <div className="space-y-1">
          <input
            type="url"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="https://example.com/image.jpg..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
          />
          <p className="text-[10px] text-slate-400">
            ວາງລິ້ງຮູບພາບ HTTPS ທີ່ສາມາດເປີດສາທາລະນະໄດ້
          </p>
        </div>
      ) : (
        // File Drop/Browse Mode
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
            id="product-image-upload"
          />
          <label
            htmlFor="product-image-upload"
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
              isUploading
                ? "border-emerald-400 bg-emerald-50/50 cursor-wait"
                : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-1.5">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <div className="text-xs font-bold text-emerald-800">
                  {uploadStep === "compressing"
                    ? "ກຳລັງບີບອັດ ແລະ ປັບແຕ່ງຮູບພາບ (Optimize)..."
                    : "ກຳລັງອັບໂຫຼດຮູບພາບຂຶ້ນລະບົບ..."}
                </div>
                <div className="text-[10px] text-emerald-600">
                  ປັບຂະໜາດໃຫ້ເບົາລົງ ໂດຍຮັກສາຄວາມຄົມຊັດ
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  ກົດເພື່ອເລືອກຮູບພາບ ຫຼື ລາກວາງທີ່ນີ້
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  ຮອງຮັບທຸກຂະໜາດຮູບ (ລະບົບຈະບີບອັດໃຫ້ເບົາລົງອັດຕະໂນມັດ ບໍ່ມົວ)
                </div>
                <div className="text-[9px] text-slate-400">
                  PNG, JPG, JPEG, WEBP, HEIC (iPhone)
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] font-medium text-rose-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
