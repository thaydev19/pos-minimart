"use client";

// ============================================================================
// Hold Orders Tabs Bar: Dynamic Multi-Bill System (ບິນ #1, #2, #3...)
// - Dynamic tabs for all bills with strict active/inactive color synchronization
// - Active bill is highlighted in dark emerald green (bg-emerald-600 text-white)
// - Inactive/held bills are neutral gray (bg-zinc-100 text-zinc-700 hover:bg-zinc-200)
// - Quick Hold Action (+ ພັກບິນ F2) immediately creates new bill & activates it
// ============================================================================

import React from "react";
import { Plus, PauseCircle, X } from "lucide-react";
import { usePosStore } from "../stores/pos.store";

export function HoldOrdersTabs() {
  const bills = usePosStore((s) => s.bills);
  const activeBillId = usePosStore((s) => s.activeBillId);
  const cart = usePosStore((s) => s.cart);
  const holdCurrentOrder = usePosStore((s) => s.holdCurrentOrder);
  const switchBill = usePosStore((s) => s.switchBill);
  const deleteBill = usePosStore((s) => s.deleteBill);

  const handleHoldClick = () => {
    if (cart.length === 0) return;
    holdCurrentOrder();
  };

  const handleTabClick = (billId: string) => {
    if (billId === activeBillId) return;
    switchBill(billId);
  };

  const handleDeleteClick = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    deleteBill(billId);
  };

  // Safe fallback if bills is somehow uninitialized
  const displayBills = bills && bills.length > 0 ? bills : [
    { id: activeBillId || "bill-1", tabTitle: "ບິນ #1", items: cart }
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar py-0.5 max-w-full">
      {/* 1. Danh sách tất cả các Tab Bill: Chỉ duy nhất tab đang Active mới có màu xanh lá */}
      {displayBills.map((bill) => {
        const isActive = bill.id === activeBillId;
        const itemCount = isActive ? cart.length : bill.items.length;

        if (isActive) {
          return (
            <div
              key={bill.id}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>{bill.tabTitle}</span>
              <span className="rounded-full bg-emerald-700 px-1.5 py-0.2 text-[10px] text-white font-bold tabular-nums">
                {itemCount}
              </span>
              {displayBills.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, bill.id)}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded-md text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors ml-0.5 cursor-pointer"
                  title="ປິດບິນນີ້"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        }

        return (
          <div
            key={bill.id}
            onClick={() => handleTabClick(bill.id)}
            className="group flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 hover:border-zinc-300 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs transition-all cursor-pointer"
            title={`ກົດເພື່ອເປີດ ${bill.tabTitle} ມາຂາຍຕໍ່`}
          >
            <PauseCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-bold text-zinc-800">{bill.tabTitle}</span>
            <span className="rounded-full bg-zinc-200 group-hover:bg-zinc-300 px-1.5 py-0.2 text-[9.5px] font-bold text-zinc-600 tabular-nums">
              {itemCount}
            </span>
            <button
              type="button"
              onClick={(e) => handleDeleteClick(e, bill.id)}
              className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:bg-red-100 hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
              title="ລຶບບິນພັກ"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* 2. Nút + ພັກບິນ (F2): Tạo giỏ hàng mới và chuyển active ngay lập tức */}
      <button
        type="button"
        onClick={handleHoldClick}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95"
        title="ພັກບິນປັດຈຸບັນ ແລະ ເປີດບິນໃໝ່ (F2)"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>+ ພັກບິນ (F2)</span>
      </button>
    </div>
  );
}
