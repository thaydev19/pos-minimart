"use client";

// ============================================================================
// Product Card: Modern Retail POS (Edge-to-Edge Visuals, High Contrast)
// Zero Nested Borders, Solid Black Price, Crisp Lao Typography & Haptic Feedback
// ============================================================================

import React, { memo } from "react";
import { Plus, AlertCircle, Scale, Layers } from "lucide-react";
import { ProductWithDetails } from "../types/pos.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { ProductThumbnail } from "./ProductThumbnail";
import { usePosStore } from "../stores/pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";

interface ProductCardProps {
  product: ProductWithDetails;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const clearanceBatch = product.batches?.find(
    (b) => b.is_clearance && b.quantity_on_hand > 0
  );
  const hasNearExpiry = Boolean(clearanceBatch);
  const displayPrice = clearanceBatch?.clearance_price || product.selling_price;

  const totalStock =
    product.batches && product.batches.length > 0
      ? product.batches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0)
      : null;

  const handleCardClick = () => {
    triggerHapticFeedback(25);
    usePosStore.getState().addToCart(product);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "auto 250px",
        contain: "layout style paint",
      }}
      className="group relative flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white p-2 pb-2.5 hover:border-emerald-500/70 active:bg-emerald-50/35 transition-colors duration-75 cursor-pointer select-none touch-pan-y"
    >
      {/* 1. Seamless Image Header (Pure white bg without GPU blend readback) */}
      <div
        style={{ borderBottomColor: "#f1f5f9" }}
        className="relative h-40 w-full shrink-0 bg-white overflow-hidden border-b border-slate-100 pb-2 mb-2"
      >
        <div className="w-full h-full flex items-center justify-center">
          <ProductThumbnail
            src={product.image_url}
            alt={product.name_lo}
            name={product.name_lo}
            className="w-full h-full"
            imgClassName="w-full h-full object-contain object-center"
          />
        </div>

        {/* Top-Left Badges (Near Expiry, Weighing, Low Stock) */}
        {(hasNearExpiry ||
          product.is_weighing ||
          (totalStock !== null && totalStock <= 5 && totalStock > 0)) && (
          <div
            style={{ position: "absolute", top: 6, left: 6 }}
            className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none"
          >
            {hasNearExpiry && (
              <span className="flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                <AlertCircle className="h-2.5 w-2.5" />
                <span>ໃກ້ໝົດ</span>
              </span>
            )}
            {product.is_weighing && (
              <span className="flex items-center gap-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                <Scale className="h-2.5 w-2.5" />
                <span>ຊັ່ງກິໂລ</span>
              </span>
            )}
            {totalStock !== null && totalStock <= 5 && totalStock > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                <span>ເຫຼືອ {totalStock}</span>
              </span>
            )}
          </div>
        )}

        {/* Top-Right Badge (Multi-Unit Count) */}
        {product.units && product.units.length > 1 && (
          <div
            style={{ position: "absolute", top: 6, right: 6 }}
            className="absolute top-2 right-2 z-10 pointer-events-none"
          >
            <span className="flex items-center gap-1 rounded-md bg-zinc-900/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <Layers className="h-2.5 w-2.5" />
              <span>{product.units.length} ໜ່ວຍ</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Text & Actions Section */}
      <div className="px-1 pt-2 flex flex-col justify-between flex-1">
        {/* Product Name: High readability Lao typography with consistent min height */}
        <h3 className="text-[13.5px] font-semibold text-slate-800 leading-snug line-clamp-2 min-h-[38px] flex items-center mb-1">
          {product.name_lo}
        </h3>

        {/* 3. Bottom Row: High-Contrast Charcoal Price + Neutral Unit + Refined Emerald Plus Button */}
        {/* Soft light grey divider (border-slate-100) to gently separate title from price */}
        <div
          style={{ borderTopColor: "#f1f5f9" }}
          className="mt-auto pt-1.5 flex items-center justify-between border-t border-slate-100"
        >
          <div className="flex items-baseline gap-1 min-w-0 truncate">
            <span className="text-[16px] font-extrabold text-slate-900 tracking-tight tabular-nums truncate">
              {formatLak(displayPrice)}
            </span>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              /{product.base_unit}
            </span>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-75">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
});

