"use client";

// ============================================================================
// Cart Item Row: Dedicated Unit Switcher Row Under Name
// Completely isolates Quantity Stepper & Price row from jumping or height reflow
// ============================================================================

import React, { memo } from "react";
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

  return (
    <div className="group relative flex flex-col gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2 shadow-2xs transition-all hover:border-slate-300">
      {/* 1. Top Section: [Thumbnail] + [Name & Unit Pills on dedicated row below name] + [Remove Button] */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <ProductThumbnail
            src={item.imageUrl}
            alt={item.name}
            name={item.name}
            className="h-10 w-10 rounded-lg shrink-0 border border-zinc-200/70 overflow-hidden mt-0.5"
          />

          <div className="flex-1 min-w-0">
            {/* Product Name (Full width, no clutter) */}
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">
                {item.name}
              </h4>

              {item.isNearExpiry && (
                <span className="flex items-center gap-0.5 rounded-md bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800 shrink-0">
                  <AlertCircle className="h-2 w-2" />
                  <span>ໃກ້ໝົດ</span>
                </span>
              )}
            </div>

            {/* Dedicated Unit Switcher Row directly below product name */}
            {item.availableUnits.length > 1 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {item.availableUnits.map((u, idx) => {
                  const isSelected = u.unit_name === item.selectedUnit.unit_name;
                  return (
                    <button
                      key={u.id || `${u.unit_name}-${u.conversion_rate}-${idx}`}
                      type="button"
                      onClick={() => changeUnit(item.id, u.unit_name)}
                      className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold transition-all cursor-pointer leading-tight ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {u.unit_name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Small Remove Button */}
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer mt-0.5"
          title="ລຶບສິນຄ້າ"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* 2. Bottom Section: [Isolated 26px Stepper] on left, [Total & @Price] on right */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 pl-12">
        {/* Quantity Stepper (Fixed 26px, never jumps or wraps) */}
        <div className="flex items-center h-[26px] rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            {item.quantity === 1 ? (
              <Trash2 className="h-2.5 w-2.5 text-rose-500" />
            ) : (
              <Minus className="h-2.5 w-2.5" />
            )}
          </button>

          <span className="w-7 text-center text-xs font-extrabold text-slate-800 tabular-nums leading-none">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Total Price & Unit Price aligned on right */}
        <div className="text-right shrink-0">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums leading-tight">
            {formatLak(item.totalPrice)}
          </div>
          <div className="text-[9px] text-slate-400 tabular-nums leading-none mt-0.5">
            @{formatLak(item.unitPrice, false)}/{item.selectedUnit.unit_name}
          </div>
        </div>
      </div>
    </div>
  );
});
