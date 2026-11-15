"use client";

// ============================================================================
// Product Catalog Grid: Touch-Optimized POS Layout (4-5 Cols on Desktop/POS)
// Breakpoints: Mobile (2 cols), sm (3 cols), lg (4 cols), xl (5 cols), 2xl (6 cols)
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, PackageX, AlertCircle, Scale } from "lucide-react";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ProductThumbnail } from "./ProductThumbnail";
import { ProductCard } from "./ProductCard";

interface ProductCatalogGridProps {
  searchFilter?: string;
}

export function ProductCatalogGrid({ searchFilter = "" }: ProductCatalogGridProps) {
  const products = usePosStore((s) => s.products);
  const activeCategory = usePosStore((s) => s.activeCategory);
  const isLoadingCatalog = usePosStore((s) => s.isLoadingCatalog);
  const viewMode = usePosStore((s) => s.viewMode);
  const syncWithDatabase = usePosStore((s) => s.syncWithDatabase);
  const addToCart = usePosStore((s) => s.addToCart);

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      activeCategory === "cat-all" || prod.category_id === activeCategory;

    if (!matchesCategory) return false;

    if (!searchFilter.trim()) return true;

    const query = searchFilter.toLowerCase();
    return (
      prod.name_lo.toLowerCase().includes(query) ||
      (prod.name_en && prod.name_en.toLowerCase().includes(query)) ||
      prod.barcode.toLowerCase().includes(query) ||
      (prod.sku && prod.sku.toLowerCase().includes(query))
    );
  });

  // 1. Skeleton Loading State (Matches touch-optimized layout)
  if (isLoadingCatalog && products.length === 0) {
    return (
      <div className="h-full overflow-y-auto content-start grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 pr-1 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
          <div
            key={n}
            className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-1.5 pb-2.5 shadow-2xs animate-pulse"
          >
            <div className="h-36 w-full rounded-xl bg-slate-100" />
            <div className="flex flex-col flex-1 justify-between px-1.5 pt-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
              <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-auto">
                <div className="h-4 w-16 rounded bg-slate-200" />
                <div className="h-8 w-8 rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Database Empty State
  if (products.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center select-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2.5 shadow-2xs">
          <PackageX className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">ຍັງບໍ່ມີຂໍ້ມູນສິນຄ້າໃນຖານຂໍ້ມູນ (Supabase)</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          ກະລຸນາ Run script <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-700">supabase/seed.sql</code> ໃນ Supabase SQL Editor ແລ້ວກົດປຸ່ມດຶງຂໍ້ມູນ.
        </p>
        <button
          type="button"
          onClick={() => syncWithDatabase()}
          disabled={isLoadingCatalog}
          className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCatalog ? "animate-spin" : ""}`} />
          <span>ດຶງຂໍ້ມູນໃໝ່ (Sync DB)</span>
        </button>
      </div>
    );
  }

  // 3. Search / Category Filter Empty State
  if (filteredProducts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center select-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2.5 shadow-2xs">
          <PackageX className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">ບໍ່ພົບລາຍການສິນຄ້າ</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          {searchFilter
            ? `ບໍ່ມີສິນຄ້າກົງກັບຄຳຄົ້ນຫາ "${searchFilter}"`
            : "ຍັງບໍ່ມີສິນຄ້າໃນໝວດໝູ່ນີ້"}
        </p>
      </div>
    );
  }

  // 4. Compact / List Mode Layout: Horizontal Strip Cards
  if (viewMode === "compact") {
    return (
      <div className="h-full overflow-y-auto content-start grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2 sm:gap-2.5 pr-1 pb-4">
        {filteredProducts.map((prod) => {
          const clearanceBatch = prod.batches?.find(
            (b) => b.is_clearance && b.quantity_on_hand > 0
          );
          const hasNearExpiry = Boolean(clearanceBatch);
          const displayPrice = clearanceBatch?.clearance_price || prod.selling_price;

          const totalStock =
            prod.batches && prod.batches.length > 0
              ? prod.batches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0)
              : null;

          const handleItemClick = () => {
            triggerHapticFeedback(25);
            addToCart(prod);
          };

          return (
            <motion.div
              key={prod.id}
              whileTap={{ scale: 0.98 }}
              onClick={handleItemClick}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-2xs hover:border-emerald-500/60 hover:shadow-xs active:bg-emerald-50/20 transition-all cursor-pointer select-none touch-manipulation min-w-0"
            >
              {/* Left Cluster: Fixed Thumbnail + Product Meta */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Fixed Thumbnail Container (Pure white background + mix-blend-multiply) */}
                <div className="relative h-13 w-13 shrink-0 rounded-xl bg-white p-0.5 overflow-hidden border border-slate-200/70 flex items-center justify-center">
                  <ProductThumbnail
                    src={prod.image_url}
                    alt={prod.name_lo}
                    name={prod.name_lo}
                    className="w-full h-full"
                    imgClassName="object-contain object-center mix-blend-multiply scale-105 group-hover:scale-110 transition-transform duration-200"
                  />
                </div>

                {/* Product Meta */}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-[13px] font-bold text-slate-800 truncate leading-snug">
                      {prod.name_lo}
                    </h3>
                    {hasNearExpiry && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        <AlertCircle className="h-2.5 w-2.5" />
                        <span>ໃກ້ໝົດ</span>
                      </span>
                    )}
                    {prod.is_weighing && (
                      <span className="flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                        <Scale className="h-2.5 w-2.5" />
                        <span>ຊັ່ງກິໂລ</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {prod.barcode && (
                      <span className="text-[10.5px] text-slate-400 font-mono truncate">
                        {prod.barcode}
                      </span>
                    )}
                    {totalStock !== null && totalStock <= 5 && totalStock > 0 && (
                      <span className="text-[10px] font-semibold text-rose-500">
                        ເຫຼືອ {totalStock}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[14px] font-extrabold text-slate-900 tabular-nums">
                      {formatLak(displayPrice)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      /{prod.base_unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action: Plus Button */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white active:scale-95 transition-all shadow-2xs">
                <Plus className="h-4 w-4" />
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // 5. Standard Grid Mode: Touch-Optimized Layout (Compact gap between cards)
  return (
    <div className="h-full overflow-y-auto content-start grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5 pr-1 pb-4">
      {filteredProducts.map((prod) => (
        <ProductCard key={prod.id} product={prod} />
      ))}
    </div>
  );
}
