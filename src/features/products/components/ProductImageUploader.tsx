"use client";

// ============================================================================
// ProductImageUploader: Direct Supabase Storage Upload & Image URL Input
// ============================================================================

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, Loader2, Link2 } from "lucide-react";
import { productsApi } from "../api/products.api";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guaranteed strictly controlled string value (never undefined or null)
  const safeValue = typeof value === "string" ? value : "";
  const hasImage = safeValue.trim().length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ຂະໜາດໄຟລ໌ໃຫຍ່ເກີນ 5MB, ກະລຸນາເລືອກຮູບໃໝ່");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const publicUrl = await productsApi.uploadProductImage(file);
      onChange(publicUrl);
    } catch (err: any) {
      console.error("[ProductImageUploader] Upload error:", err);
      setErrorMessage(err.message || "ອັບໂຫຼດຮູບພາບບໍ່ສຳເລັດ");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearImage = () => {
    onChange("");
    setErrorMessage(null);
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
          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="h-3 w-3" />
          <span>{isUrlMode ? "ອັບໂຫຼດໄຟລ໌ຮູບ" : "ໃສ່ລິ້ງ URL"}</span>
        </button>
      </div>

      {hasImage ? (
        // Preview Box
        <div className="relative flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-slate-50/60 p-2.5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
            <p className="text-xs font-semibold text-slate-800 truncate">{safeValue}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
              ຮູບພາບພ້ອມໃຊ້ງານແລ້ວ
            </p>
            <button
              type="button"
              onClick={handleClearImage}
              disabled={disabled || isUploading}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
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
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
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
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
            id="product-image-upload"
          />
          <label
            htmlFor="product-image-upload"
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
              isUploading
                ? "border-emerald-300 bg-emerald-50/50 cursor-wait"
                : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-800">
                  ກຳລັງອັບໂຫຼດຮູບພາບຂຶ້ນລະບົບ...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  ກົດເພື່ອເລືອກຮູບພາບ ຫຼື ລາກວາງທີ່ນີ້
                </div>
                <div className="text-[10px] text-slate-400">
                  PNG, JPG, WEBP (ສູງສຸດ 5MB)
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] font-medium text-rose-500">{errorMessage}</p>
      )}
    </div>
  );
}

