"use client";

// ============================================================================
// Catalog Control Bar: Touch-First POS (h-11 Search Bar, Camera Barcode & Category Pills)
// Includes Camera Optical Scanner for Tablets & Mobile POS
// ============================================================================

import React, { useState } from "react";
import {
  ScanBarcode,
  Search,
  X,
  LayoutGrid,
  List,
  Beer,
  Utensils,
  Milk,
  Scale,
  Coffee,
  Zap,
  ShoppingBag,
  Camera,
} from "lucide-react";
import { usePosStore } from "../stores/pos.store";
import { lo } from "@/constants/locales/lo";
import { CameraBarcodeScannerModal } from "./CameraBarcodeScannerModal";
import { triggerHapticFeedback } from "@/utils/haptics";

interface CatalogControlBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCameraBarcodeScanned?: (barcode: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid className="h-3.5 w-3.5" />,
  Beer: <Beer className="h-3.5 w-3.5" />,
  Utensils: <Utensils className="h-3.5 w-3.5" />,
  Milk: <Milk className="h-3.5 w-3.5" />,
  Scale: <Scale className="h-3.5 w-3.5" />,
  Coffee: <Coffee className="h-3.5 w-3.5" />,
  Zap: <Zap className="h-3.5 w-3.5" />,
  ShoppingBag: <ShoppingBag className="h-3.5 w-3.5" />,
};

export function CatalogControlBar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  inputRef,
  onCameraBarcodeScanned,
}: CatalogControlBarProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const categories = usePosStore((s) => s.categories);
  const activeCategory = usePosStore((s) => s.activeCategory);
  const setActiveCategory = usePosStore((s) => s.setActiveCategory);
  const viewMode = usePosStore((s) => s.viewMode);
  const setViewMode = usePosStore((s) => s.setViewMode);

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden select-none touch-manipulation">
        {/* 1. Top Section: Fast Barcode Scanner & Search Input (h-11, 44px) */}
        <form onSubmit={onSearchSubmit} className="relative flex items-center px-3 py-1.5 gap-2">
          <div className="pointer-events-none flex items-center text-emerald-600 shrink-0">
            <ScanBarcode className="h-5 w-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={lo.pos.scanOrSearchPlaceholder}
            className="h-10 w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none pr-32"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  onSearchChange("");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Camera Barcode Scanner Trigger Button */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(25);
                setIsCameraOpen(true);
              }}
              className="flex h-8 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="ສະແກນດ້ວຍກ້ອງ (Camera Scanner)"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
            </button>

            <button
              type="submit"
              className="flex h-8 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              <span>ຄົ້ນຫາ</span>
            </button>
          </div>
        </form>

        {/* 2. Thin Interior Divider */}
        <div className="border-b border-zinc-100" />

        {/* 3. Bottom Section: Category Filter Strip & View Switcher */}
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-zinc-50/60">
          {/* Category Pills List */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    setActiveCategory(cat.id);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer min-h-[36px] ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-zinc-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                    {CATEGORY_ICON_MAP[cat.icon || ""] || <LayoutGrid className="h-3.5 w-3.5" />}
                  </span>
                  <span className="whitespace-nowrap">{cat.name_lo}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Grid vs Compact */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-2xs shrink-0 ml-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setViewMode("grid");
              }}
              title="ຮູບແບບກຣິດ (Grid View)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setViewMode("compact");
              }}
              title="ຮູບແບບຫຍໍ້ (Compact View)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Camera Optical Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onBarcodeDetected={(code) => {
          onCameraBarcodeScanned?.(code);
        }}
      />
    </>
  );
}
