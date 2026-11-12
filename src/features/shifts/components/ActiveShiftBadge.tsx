"use client";

// ============================================================================
// ActiveShiftBadge: Header Status Indicator with Quick Close Action
// ============================================================================

import React from "react";
import { Clock, ShieldAlert, LogOut, PlusCircle, CheckCircle2 } from "lucide-react";
import { useShiftStore } from "../stores/shift.store";
import { formatShiftDuration } from "../utils/shift.util";

interface ActiveShiftBadgeProps {
  className?: string;
  showActions?: boolean;
}

export function ActiveShiftBadge({
  className = "",
  showActions = true,
}: ActiveShiftBadgeProps) {
  const activeShift = useShiftStore((s) => s.activeShift);
  const openOpenShiftModal = useShiftStore((s) => s.openOpenShiftModal);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);

  if (!activeShift) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-800">
          <ShieldAlert className="h-3 w-3 text-amber-600" />
          <span>ຍັງບໍ່ໄດ້ເປີດກະ</span>
        </span>

        {showActions && (
          <button
            type="button"
            onClick={openOpenShiftModal}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <PlusCircle className="h-3 w-3" />
            <span>ເປີດກະໃໝ່</span>
          </button>
        )}
      </div>
    );
  }

  const duration = formatShiftDuration(activeShift.opening_time);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Active Shift Pill */}
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <span>ກະຂາຍເປີດຢູ່ ({duration})</span>
      </span>

      {/* Close Shift Button */}
      {showActions && (
        <button
          type="button"
          onClick={openCloseShiftModal}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="ປິດກະຂາຍເຄື່ອງ ແລະ ນັບເງິນສົດ (Blind Close)"
        >
          <LogOut className="h-3 w-3" />
          <span>ປິດກະ</span>
        </button>
      )}
    </div>
  );
}

