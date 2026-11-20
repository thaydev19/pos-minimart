"use client";

// ============================================================================
// OrderSummaryCards: Top KPI Summary for Filtered Orders
// Compact 2-Line Design - Maximizing Screen Real Estate
// ============================================================================

import React from "react";
import { Coins, Receipt, TrendingUp, QrCode } from "lucide-react";
import { OrderKPIs } from "../types/order.types";
import { formatLak } from "@/utils/formatLakCurrency";

interface OrderSummaryCardsProps {
  kpis: OrderKPIs;
}

export function OrderSummaryCards({ kpis }: OrderSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Total Revenue */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ຍອດຂາຍລວມທັງໝົດ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
            <Coins className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight truncate">
          {formatLak(kpis.totalRevenue)}
        </div>
      </div>

      {/* 2. Completed Orders Count */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ບິນສຳເລັດແລ້ວ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 shrink-0">
            <Receipt className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
          {kpis.completedOrderCount} <span className="text-[11px] font-normal text-slate-400">ບິນ</span>
        </div>
      </div>

      {/* 3. Cash Revenue */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ຍອດຂາຍເງິນສົດ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums mt-1 leading-tight truncate">
          {formatLak(kpis.cashRevenue)}
        </div>
      </div>

      {/* 4. LAO QR Revenue */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ຍອດໂອນ LAO QR</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-800 shrink-0">
            <QrCode className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-indigo-700 tabular-nums mt-1 leading-tight truncate">
          {formatLak(kpis.transferRevenue)}
        </div>
      </div>
    </div>
  );
}
