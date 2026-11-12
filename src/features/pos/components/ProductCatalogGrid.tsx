"use client";

// ============================================================================
// Product Catalog Grid: Ultra Compact 6-Column Layout Desktop (xl:grid-cols-6)
// Breakpoints: Mobile (2 cols), sm (3 cols), md (4 cols), lg (5 cols), xl (6 cols)
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, PackageX } from "lucide-react";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";
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

  // 1. Skeleton Loading State (Matches 6-column layout)
  if (isLoadingCatalog && products.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pr-1 pb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
          <div
            key={n}
            className="flex flex-col h-full rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs animate-pulse"
          >
            <div className="h-24 w-full bg-slate-200" />
            <div className="p-2 flex flex-col flex-1 justify-between">
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                <div className="h-3.5 w-14 rounded bg-slate-200" />
                <div className="h-6 w-6 rounded-md bg-slate-200" />
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

  // 4. Compact Mode Layout
  if (viewMode === "compact") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto pr-1 pb-3">
        {filteredProducts.map((prod) => {
          const clearanceBatch = prod.batches?.find(
            (b) => b.is_clearance && b.quantity_on_hand > 0
          );
          const hasNearExpiry = Boolean(clearanceBatch);
          const displayPrice = clearanceBatch?.clearance_price || prod.selling_price;

          return (
            <motion.div
              key={prod.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(prod)}
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:border-emerald-500/60 hover:shadow-xs transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <ProductThumbnail
                  src={prod.image_url}
                  alt={prod.name_lo}
                  name={prod.name_lo}
                  className="h-10 w-10 rounded-lg shrink-0 border border-zinc-200/70 overflow-hidden"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {prod.name_lo}
                    </h3>
                    {hasNearExpiry && (
                      <span className="rounded bg-orange-100 px-1 py-0.2 text-[9px] font-bold text-orange-800">
                        ໃກ້ໝົດ
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {prod.barcode}
                  </p>
                  <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                    {formatLak(displayPrice)}{" "}
                    <span className="text-[9px] text-slate-400 font-normal">
                      /{prod.base_unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs ml-1.5">
                <Plus className="h-3 w-3" />
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // 5. Standard Grid Mode: 6 Columns on Desktop (xl:grid-cols-6) with gap-2
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 overflow-y-auto pr-1 pb-3">
      {filteredProducts.map((prod) => (
        <ProductCard key={prod.id} product={prod} />
      ))}
    </div>
  );
}
