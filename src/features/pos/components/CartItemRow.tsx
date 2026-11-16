"use client";

// ============================================================================
// Cart Item Row: Compact & Refined POS Architecture
// - Product Name: text-[13px] font-semibold leading-snug line-clamp-2
// - Container: p-2.5 rounded-2xl gap-2 (maximizes space for product name)
// - Unit Switcher: text-[11px] px-2 py-0.5 compact segmented control
// - Stepper: h-8 w-7 buttons with text-xs w-6 numeric display
// - High-contrast price with formatLak currency
// ============================================================================

import React, { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import { CartItem } from "../types/pos.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { usePosStore } from "../stores/pos.store";
import { ProductThumbnail } from "./ProductThumbnail";
import { triggerHapticFeedback } from "@/utils/haptics";

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow = memo(function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const changeUnit = usePosStore((s) => s.changeUnit);
  const removeItem = usePosStore((s) => s.removeItem);
  const hasMultipleUnits = item.availableUnits && item.availableUnits.length > 1;

  // Local state for smooth editable quantity input
  const [localQty, setLocalQty] = useState<string>(String(item.quantity));
  const [isBouncing, setIsBouncing] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const prevQtyRef = useRef<number>(item.quantity);

  useEffect(() => {
    setLocalQty(String(item.quantity));

    // Trigger keyframe pulse animation whenever quantity changes (regardless of item count)
    if (item.quantity !== prevQtyRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 200);

      if (item.quantity > prevQtyRef.current) {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      prevQtyRef.current = item.quantity;
      return () => clearTimeout(timer);
    }
    prevQtyRef.current = item.quantity;
  }, [item.quantity, item.totalPrice]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQty(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      updateQuantity(item.id, num);
    }
  };

  const handleQtyBlur = () => {
    const num = parseInt(localQty, 10);
    if (isNaN(num) || num < 1) {
      setLocalQty("1");
      updateQuantity(item.id, 1);
    }
  };

  const handleMinus = () => {
    triggerHapticFeedback(25);
    updateQuantity(item.id, item.quantity - 1);
  };

  const handlePlus = () => {
    triggerHapticFeedback(25);
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDelete = () => {
    triggerHapticFeedback(35);
    removeItem(item.id);
  };

  const handleUnitChange = (unitName: string) => {
    triggerHapticFeedback(20);
    changeUnit(item.id, unitName);
  };

  return (
    <motion.div
      ref={rowRef}
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex items-center justify-between gap-2 rounded-2xl bg-white border border-zinc-200/90 hover:border-emerald-300 p-2.5 shadow-2xs transition-colors select-none touch-manipulation"
    >
      {/* 1. Left Cluster: Thumbnail + 2-Row Info (Expanded width) */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Product Thumbnail with mix-blend-multiply to blend .jpg borders into frame */}
        <ProductThumbnail
          src={item.imageUrl}
          alt={item.name}
          name={item.name}
          className="h-9.5 w-9.5 sm:h-10 sm:w-10 rounded-xl shrink-0 border border-zinc-200/70 bg-white p-0.5 overflow-hidden"
          imgClassName="w-full h-full object-contain mix-blend-multiply"
        />

        {/* Text Column: Full product name with line-clamp-2 */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Product Name in fluent Lao */}
          <div className="flex items-start gap-1">
            <h4
              className="text-[13px] font-semibold text-zinc-900 line-clamp-2 leading-snug wrap-break-word"
              title={item.name}
            >
              {item.name}
            </h4>

            {item.isNearExpiry && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 shrink-0 mt-0.5">
                <AlertCircle className="h-2.5 w-2.5" />
                <span>ໃກ້ໝົດ</span>
              </span>
            )}
          </div>

          {/* Row 2: Refined Unit Switcher (text-[11px] px-2 py-0.5) */}
          {hasMultipleUnits ? (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 border border-zinc-200/80 gap-0.5 mt-1">
              {item.availableUnits.map((u, idx) => {
                const isSelected = u.unit_name === item.selectedUnit.unit_name;
                return (
                  <button
                    key={u.id || `${u.unit_name}-${u.conversion_rate}-${idx}`}
                    type="button"
                    onClick={() => handleUnitChange(u.unit_name)}
                    className={`h-5.5 px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all active:scale-95 cursor-pointer select-none leading-none flex items-center justify-center ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {u.unit_name}
                    {u.conversion_rate > 1 ? ` (x${u.conversion_rate})` : ""}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="h-5 px-2 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-600 inline-flex items-center mt-1 border border-zinc-200/50 leading-none">
              {item.selectedUnit.unit_name || "ອັນ"}
            </span>
          )}
        </div>
      </div>

      {/* 2. Right Cluster: Stepper [- 1 +] + Line Total & Unit Price + Delete Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Compact Quantity Stepper: h-8 w-7 buttons with text-xs w-6 quantity */}
        <div className="flex items-center h-8 rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={item.quantity <= 1}
            onClick={handleMinus}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-2xs hover:bg-zinc-100 active:scale-95 transition-all enabled:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
            title="ຫຼຸດລົງ 1"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <motion.div
            animate={isBouncing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center origin-center"
          >
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={localQty}
              onChange={handleQtyChange}
              onBlur={handleQtyBlur}
              onFocus={(e) => e.target.select()}
              className="w-6 h-7 text-center font-bold text-xs text-zinc-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-md outline-none no-spin-button font-mono"
            />
          </motion.div>

          <button
            type="button"
            onClick={handlePlus}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-2xs hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
            title="ເພີ່ມຂຶ້ນ 1"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Total Price for Line + Subtitle Unit Price */}
        <div className="text-right min-w-18 sm:min-w-20.5 shrink-0">
          <motion.span
            animate={
              isBouncing
                ? { scale: [1, 1.08, 1], color: ["#047857", "#059669", "#047857"] }
                : { scale: 1, color: "#047857" }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-[13px] sm:text-sm font-bold text-emerald-700 text-right leading-tight block tabular-nums origin-right"
          >
            {formatLak(item.totalPrice)}
          </motion.span>
          <span className="text-[10px] text-zinc-400 font-medium text-right block mt-0.5 tabular-nums">
            {formatLak(item.unitPrice, true)}/{item.selectedUnit.unit_name || "ອັນ"}
          </span>
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="h-8 w-8 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 active:scale-95 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title="ລຶບລາຍການ"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
});
