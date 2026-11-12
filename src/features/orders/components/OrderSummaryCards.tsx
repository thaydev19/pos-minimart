"use client";

// ============================================================================
// OrderSummaryCards: Top KPI Summary for Filtered Orders
// ============================================================================

import React from "react";
import { Coins, CheckCircle2, QrCode, Receipt, TrendingUp } from "lucide-react";
import { OrderKPIs } from "../types/order.types";
import { formatLak } from "@/utils/formatLakCurrency";

interface OrderSummaryCardsProps {
  kpis: OrderKPIs;
}

export function OrderSummaryCards({ kpis }: OrderSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* 1. Total Revenue */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ຍອດຂາຍລວມທັງໝົດ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1.5 truncate">
          {formatLak(kpis.totalRevenue)}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          ສະເລ່ຍ: {formatLak(kpis.averageOrderValue)}/ບິນ
        </p>
      </div>

      {/* 2. Completed Orders Count */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ບິນສຳເລັດແລ້ວ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1.5">
          {kpis.completedOrderCount}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          ຍົກເລີກ: {kpis.cancelledOrderCount} ບິນ
        </p>
      </div>

      {/* 3. Cash Revenue */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ຍອດຂາຍເງິນສົດ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums mt-1.5 truncate">
          {formatLak(kpis.cashRevenue)}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">ເງິນສົດໃນເກ໊ະ</p>
      </div>

      {/* 4. LAO QR Revenue */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ຍອດໂອນ LAO QR</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
            <QrCode className="h-4 w-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-indigo-700 tabular-nums mt-1.5 truncate">
          {formatLak(kpis.transferRevenue)}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">ໂອນຜ່ານແອັບທະນາຄານ</p>
      </div>
    </div>
  );
}

