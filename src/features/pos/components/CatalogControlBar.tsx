"use client";

// ============================================================================
// Catalog Control Bar: Compact POS Density (h-9 Search, py-1 px-2.5 Category Pills)
// Maximizes vertical screen area for Product Catalog Grid
// ============================================================================

import React from "react";
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
} from "lucide-react";
import { usePosStore } from "../stores/pos.store";
import { lo } from "@/constants/locales/lo";

interface CatalogControlBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid className="h-3 w-3" />,
  Beer: <Beer className="h-3 w-3" />,
  Utensils: <Utensils className="h-3 w-3" />,
  Milk: <Milk className="h-3 w-3" />,
  Scale: <Scale className="h-3 w-3" />,
  Coffee: <Coffee className="h-3 w-3" />,
  Zap: <Zap className="h-3 w-3" />,
  ShoppingBag: <ShoppingBag className="h-3 w-3" />,
};

export function CatalogControlBar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  inputRef,
}: CatalogControlBarProps) {
  const categories = usePosStore((s) => s.categories);
  const activeCategory = usePosStore((s) => s.activeCategory);
  const setActiveCategory = usePosStore((s) => s.setActiveCategory);
  const viewMode = usePosStore((s) => s.viewMode);
  const setViewMode = usePosStore((s) => s.setViewMode);

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden select-none">
      {/* 1. Top Section: Fast Barcode Scanner & Search Input (h-9, 36px) */}
      <form onSubmit={onSearchSubmit} className="relative flex items-center px-3 py-1.5">
        <div className="pointer-events-none flex items-center text-emerald-600 mr-2 shrink-0">
          <ScanBarcode className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={lo.pos.scanOrSearchPlaceholder}
          className="h-9 w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none pr-24"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1 py-0.2 text-[9px] font-bold text-slate-500 font-mono">
            <span>F1</span>
          </div>

          <button
            type="submit"
            className="flex h-7 items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer ml-1"
          >
            <Search className="h-3 w-3 mr-1" />
            <span>ຄົ້ນຫາ</span>
          </button>
        </div>
      </form>

      {/* 2. Thin Interior Divider */}
      <div className="border-b border-zinc-200/70" />

      {/* 3. Bottom Section: Category Filter Strip & View Switcher (py-1 px-2.5 text-xs) */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-zinc-50/50">
        {/* Category Pills List */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "border border-zinc-200/80 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                  {CATEGORY_ICON_MAP[cat.icon || ""] || <LayoutGrid className="h-3 w-3" />}
                </span>
                <span className="whitespace-nowrap">{cat.name_lo}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Grid vs Compact */}
        <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200/80 bg-white p-0.5 shadow-2xs shrink-0 ml-1.5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="ຮູບແບບກຣິດ (Grid View)"
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LayoutGrid className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("compact")}
            title="ຮູບແບບຫຍໍ້ (Compact View)"
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all cursor-pointer ${
              viewMode === "compact"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <List className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
