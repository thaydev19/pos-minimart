"use client";

// ============================================================================
// Cart Item Row: Compact Density & Refined Unit Switcher
// - Compact card padding (p-2) & thumbnail (w-9 h-9)
// - Sleek and refined unit switcher [ ຕຸກ | ແພັກ (x6) ] (h-6 px-2.5 text-[11px])
// - Crisp product title (text-xs font-bold leading-snug)
// - Quantity Stepper with direct editable number input [- input +]
// - Compact Line Total & Subtitle Unit Price
// - Dedicated Trash2 delete button at far right
// ============================================================================

import React, { memo, useState, useEffect } from "react";
import { Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import { CartItem } from "../types/pos.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { usePosStore } from "../stores/pos.store";
import { ProductThumbnail } from "./ProductThumbnail";

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

  useEffect(() => {
    setLocalQty(String(item.quantity));
  }, [item.quantity]);

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

  return (
    <div className="group relative flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-white p-2 shadow-2xs hover:border-emerald-300 transition-all select-none">
      {/* 1. Left Cluster: Thumbnail + 2-Row Info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Product Thumbnail (w-9 h-9 = 36px) */}
        <ProductThumbnail
          src={item.imageUrl}
          alt={item.name}
          name={item.name}
          className="h-9 w-9 rounded-md shrink-0 border border-zinc-200/70 overflow-hidden object-cover"
        />

        {/* 2-Row Text Column */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Product Name */}
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 leading-snug">
              {item.name}
            </h4>

            {item.isNearExpiry && (
              <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800 shrink-0">
                <AlertCircle className="h-2 w-2" />
                <span>ໃກ້ໝົດ</span>
              </span>
            )}
          </div>

          {/* Row 2: Refined Unit Switcher or Unit Badge */}
          {hasMultipleUnits ? (
            /* Case 1: Has Pack Packaging -> Refined Segmented Control */
            <div className="inline-flex items-center p-0.5 rounded-md bg-zinc-100 border border-zinc-200 gap-0.5 mt-1">
              {item.availableUnits.map((u, idx) => {
                const isSelected = u.unit_name === item.selectedUnit.unit_name;
                return (
                  <button
                    key={u.id || `${u.unit_name}-${u.conversion_rate}-${idx}`}
                    type="button"
                    onClick={() => changeUnit(item.id, u.unit_name)}
                    className={`h-6 px-2.5 text-[11px] font-semibold rounded transition-all cursor-pointer select-none leading-none flex items-center justify-center ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
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
            /* Case 2: Base Unit Only (No Pack) -> Clean Unit Badge */
            <span className="h-5 px-2 text-[11px] font-medium rounded bg-zinc-100 text-zinc-600 inline-flex items-center mt-1 border border-zinc-200/50 leading-none">
              {item.selectedUnit.unit_name || "ອັນ"}
            </span>
          )}
        </div>
      </div>

      {/* 2. Right Cluster: Stepper [- input +] + Line Total & Unit Price + Dedicated Trash2 */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quantity Stepper (h-8) */}
        <div className="flex items-center h-8 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={item.quantity <= 1}
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-700 shadow-2xs hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
            title="ຫຼຸດລົງ 1"
          >
            <Minus className="h-3 w-3" />
          </button>

          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={localQty}
            onChange={handleQtyChange}
            onBlur={handleQtyBlur}
            onFocus={(e) => e.target.select()}
            className="w-9 h-8 text-center font-bold text-sm text-zinc-900 bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-700 shadow-2xs hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
            title="ເພີ່ມຂຶ້ນ 1"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Total Price for Line + Subtitle Unit Price */}
        <div className="text-right min-w-[85px] sm:min-w-[95px] shrink-0">
          <span className="text-sm font-extrabold text-emerald-700 text-right leading-tight block tabular-nums">
            {formatLak(item.totalPrice)}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium text-right block mt-0.5 tabular-nums">
            {formatLak(item.unitPrice, true)}/{item.selectedUnit.unit_name || "ອັນ"}
          </span>
        </div>

        {/* Dedicated Delete Button (Trash2) */}
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title="ລຶບລາຍການ"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
