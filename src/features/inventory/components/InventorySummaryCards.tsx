"use client";

// ============================================================================
// InventorySummaryCards: Top KPI Overview (Stock Value, Low Stock, FEFO Expiry)
// ============================================================================

import React from "react";
import { Coins, AlertTriangle, Clock, ShieldAlert, Boxes } from "lucide-react";
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* 1. Total Inventory Cost Value */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ມູນຄ່າສາງທັງໝົດ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1.5 truncate">
          {formatLak(kpis.totalInventoryValue)}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">ຄິດໄລ່ຕາມລາຄາຕົ້ນທຶນ</p>
      </div>

      {/* 2. Low Stock Count */}
      <div
        onClick={() => setFilterStatus(filterStatus === "low_stock" ? "all" : "low_stock")}
        className={`rounded-2xl border p-3.5 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "low_stock"
            ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20"
            : "border-zinc-200/80 bg-white hover:border-amber-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ສິນຄ້າໃກ້ໝົດສະຕັອກ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-1.5">
          {kpis.lowStockCount}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">ສະຕັອກເຫຼືອ ≤ 10 ອັນ</p>
      </div>

      {/* 3. Near Expiry (FEFO) Count */}
      <div
        onClick={() => setFilterStatus(filterStatus === "near_expiry" ? "all" : "near_expiry")}
        className={`rounded-2xl border p-3.5 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "near_expiry"
            ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
            : "border-zinc-200/80 bg-white hover:border-amber-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ລັອດໃກ້ໝົດອາຍຸ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-amber-800 tabular-nums mt-1.5">
          {kpis.nearExpiryBatchCount}
        </div>
        <p className="text-[10px] text-amber-600 font-medium mt-0.5">
          ໝົດອາຍຸພາຍໃນ 30 ວັນ (FEFO)
        </p>
      </div>

      {/* 4. Expired Batches (Need Discard) */}
      <div
        onClick={() => setFilterStatus(filterStatus === "expired" ? "all" : "expired")}
        className={`rounded-2xl border p-3.5 shadow-2xs transition-all cursor-pointer ${
          filterStatus === "expired"
            ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-400/20"
            : "border-zinc-200/80 bg-white hover:border-rose-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">ລັອດໝົດອາຍຸແລ້ວ</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-rose-600 tabular-nums mt-1.5">
          {kpis.expiredBatchCount}
        </div>
        <p className="text-[10px] text-rose-500 font-medium mt-0.5">
          ຕ້ອງຕັດຈ່າຍອອກຈາກສາງ
        </p>
      </div>
    </div>
  );
}

