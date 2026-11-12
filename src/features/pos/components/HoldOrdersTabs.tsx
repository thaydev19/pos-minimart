"use client";

// ============================================================================
// Hold Orders Tabs Bar: Compact Density (h-12 Header Compatible)
// ============================================================================

import React from "react";
import { Plus, PauseCircle, X } from "lucide-react";
import { usePosStore } from "../stores/pos.store";

export function HoldOrdersTabs() {
  const cart = usePosStore((s) => s.cart);
  const holdOrders = usePosStore((s) => s.holdOrders);
  const holdCurrentOrder = usePosStore((s) => s.holdCurrentOrder);
  const restoreHoldOrder = usePosStore((s) => s.restoreHoldOrder);
  const deleteHoldOrder = usePosStore((s) => s.deleteHoldOrder);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar py-0.5 max-w-full">
      {/* Current Active Bill Badge */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        <span>ບິນປັດຈຸບັນ</span>
        <span className="rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[10px] text-emerald-900 tabular-nums">
          {cart.length}
        </span>
      </div>

      {/* Held Orders List */}
      {holdOrders.map((hold) => (
        <div
          key={hold.id}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <button
            type="button"
            onClick={() => restoreHoldOrder(hold.id)}
            className="flex items-center gap-1 cursor-pointer"
          >
            <PauseCircle className="h-3 w-3 text-amber-600" />
            <span>{hold.tabTitle}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 tabular-nums">
              {hold.items.length}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteHoldOrder(hold.id);
            }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}

      {/* Hold Current Bill Button */}
      <button
        type="button"
        disabled={cart.length === 0}
        onClick={() => holdCurrentOrder()}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
        title="ພັກບິນປັດຈຸບັນ (F2)"
      >
        <Plus className="h-3 w-3" />
        <span>ພັກບິນ (F2)</span>
      </button>
    </div>
  );
}
