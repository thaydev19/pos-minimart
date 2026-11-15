"use client";

// ============================================================================
// Product Card: Edge-to-Edge Proportional 4:3 Image, Floating Badges,
// Equal Row Heights & Lao Typography
// ============================================================================

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Plus, AlertCircle, Scale, Tag } from "lucide-react";
import { ProductWithDetails } from "../types/pos.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { ProductThumbnail } from "./ProductThumbnail";
import { usePosStore } from "../stores/pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";

interface ProductCardProps {
  product: ProductWithDetails;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const addToCart = usePosStore((s) => s.addToCart);

  const clearanceBatch = product.batches?.find(
    (b) => b.is_clearance && b.quantity_on_hand > 0
  );
  const hasNearExpiry = Boolean(clearanceBatch);
  const displayPrice = clearanceBatch?.clearance_price || product.selling_price;

  const handleCardClick = () => {
    triggerHapticFeedback(25);
    addToCart(product);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={handleCardClick}
      className="group relative flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-emerald-500/60 hover:shadow-md active:bg-emerald-50/30 transition-all cursor-pointer select-none touch-manipulation min-h-[160px]"
    >
      {/* 1. Proportional 4:3 Edge-to-Edge Image Header (No padding, rounded-t matches card) */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <ProductThumbnail
          src={product.image_url}
          alt={product.name_lo}
          name={product.name_lo}
          className="w-full h-full"
        />

        {/* Floating High-Contrast Badges (absolute top-2 left-2 / right-2 z-10) */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between pointer-events-none gap-1">
          <div className="flex flex-col gap-1 items-start">
            {hasNearExpiry && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <AlertCircle className="h-3 w-3" />
                <span>ລັອດໃກ້ໝົດ</span>
              </span>
            )}
            {product.is_weighing && (
              <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Scale className="h-3 w-3" />
                <span>ຊັ່ງກິໂລ</span>
              </span>
            )}
          </div>

          {product.units && product.units.length > 1 && (
            <span className="flex items-center gap-1 rounded-full bg-zinc-900/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <Tag className="h-2.5 w-2.5" />
              <span>{product.units.length} ຕົວໜ່ວຍ</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Content Body: Equal Row Heights (min-h-[2.5rem] on 2-line title) */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.name_lo}
        </h3>

        <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5 mb-2">
          {product.barcode}
        </p>

        {/* 3. Bottom Row: Kip Price + Quick Add Button pinned to bottom */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-auto">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums truncate">
              {formatLak(displayPrice)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              /{product.base_unit}
            </span>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

