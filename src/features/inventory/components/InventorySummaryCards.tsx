"use client";

// ============================================================================
// InventorySummaryCards: Top KPI Overview (Stock Value, Low Stock, FEFO Expiry)
// Compact 2-Line Design - Maximizing Screen Real Estate
// ============================================================================

import React from "react";
import { Coins, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { InventoryKPIs } from "../types/inventory.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { useInventoryStore } from "../stores/inventory.store";

interface InventorySummaryCardsProps {
  kpis: InventoryKPIs;
}

export function InventorySummaryCards({ kpis }: InventorySummaryCardsProps) {
  const setFilterStatus = useInventoryStore((s) => s.setFilterStatus);
  const filterStatus = useInventoryStore((s) => s.filterStatus);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Total Inventory Cost Value */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ມູນຄ່າສາງທັງໝົດ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
            <Coins className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight truncate">
          {formatLak(kpis.totalInventoryValue)}
        </div>
      </div>

      {/* 2. Low Stock Count */}
      <div
        onClick={() => setFilterStatus(filterStatus === "low_stock" ? "all" : "low_stock")}
        className={`rounded-xl border p-2.5 sm:p-3 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "low_stock"
            ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20"
            : "border-zinc-200/80 bg-white hover:border-amber-300"
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ສິນຄ້າໃກ້ໝົດສະຕັອກ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-amber-700 tabular-nums mt-1 leading-tight">
          {kpis.lowStockCount} <span className="text-[11px] font-normal text-slate-400">ລາຍການ</span>
        </div>
      </div>

      {/* 3. Near Expiry (FEFO) Count */}
      <div
        onClick={() => setFilterStatus(filterStatus === "near_expiry" ? "all" : "near_expiry")}
        className={`rounded-xl border p-2.5 sm:p-3 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "near_expiry"
            ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
            : "border-zinc-200/80 bg-white hover:border-amber-400"
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ລັອດໃກ້ໝົດອາຍຸ (30 ວັນ)</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800 shrink-0">
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-amber-800 tabular-nums mt-1 leading-tight">
          {kpis.nearExpiryBatchCount} <span className="text-[11px] font-normal text-slate-400">ລັອດ</span>
        </div>
      </div>

      {/* 4. Expired Batches (Need Discard) */}
      <div
        onClick={() => setFilterStatus(filterStatus === "expired" ? "all" : "expired")}
        className={`rounded-xl border p-2.5 sm:p-3 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "expired"
            ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-400/20"
            : "border-zinc-200/80 bg-white hover:border-rose-300"
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold text-slate-600 truncate">ລັອດໝົດອາຍຸແລ້ວ</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-700 shrink-0">
            <ShieldAlert className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums mt-1 leading-tight">
          {kpis.expiredBatchCount} <span className="text-[11px] font-normal text-slate-400">ລັອດ</span>
        </div>
      </div>
    </div>
  );
}
