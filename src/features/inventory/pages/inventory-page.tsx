"use client";

// ============================================================================
// InventoryPage: Enterprise Warehouse & FEFO Batch Expiry Management
// 100% Real Supabase + Dexie Offline DB, Strict Lao Localization
// ============================================================================

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Plus,
  RefreshCw,
  Filter,
  PackagePlus,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { useInventoryStore } from "../stores/inventory.store";
import { useCategories } from "@/features/categories";
import { InventorySummaryCards } from "../components/InventorySummaryCards";
import { StockOverviewTable } from "../components/StockOverviewTable";
import { StockInSheet } from "../components/StockInSheet";
import { BatchDetailDrawer } from "../components/BatchDetailDrawer";
import { StockAdjustmentDialog } from "../components/StockAdjustmentDialog";
import { HeaderRefreshButton } from "@/components/HeaderRefreshButton";
import { CatalogBarcodeSearchInput } from "@/components/CatalogBarcodeSearchInput";

function QuickStockInListener() {
  const searchParams = useSearchParams();
  const quickStockInId = searchParams.get("quickStockIn");
  const openStockIn = useInventoryStore((s) => s.openStockIn);

  useEffect(() => {
    if (quickStockInId) {
      openStockIn(quickStockInId);
    }
  }, [quickStockInId, openStockIn]);

  return null;
}

export function InventoryPage() {
  const { items, totalCount, kpis, isLoading, refresh } = useInventory();
  const searchTerm = useInventoryStore((s) => s.searchTerm);
  const setSearchTerm = useInventoryStore((s) => s.setSearchTerm);
  const filterStatus = useInventoryStore((s) => s.filterStatus);
  const setFilterStatus = useInventoryStore((s) => s.setFilterStatus);
  const selectedCategory = useInventoryStore((s) => s.selectedCategory);
  const setSelectedCategory = useInventoryStore((s) => s.setSelectedCategory);
  const openStockIn = useInventoryStore((s) => s.openStockIn);
  const isStockInOpen = useInventoryStore((s) => s.isStockInOpen);
  const hasBatchViewOpen = useInventoryStore((s) => Boolean(s.selectedProductForBatchView));
  const hasAdjustmentOpen = useInventoryStore((s) => Boolean(s.selectedBatchForAdjustment));
  const isAnyModalOpen = isStockInOpen || hasBatchViewOpen || hasAdjustmentOpen;

  const { allCategories, categories } = useCategories();
  const displayCategories = allCategories && allCategories.length > 0 ? allCategories : categories;

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <QuickStockInListener />
      </Suspense>

      {/* 1. Header Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຄຸ້ມຄອງສາງສິນຄ້າ & ລັອດ FEFO (Inventory & Expiry)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ຫຼັກການ FEFO (First-Expired, First-Out) ຈັດການວັນໝົດອາຍຸ ແລະ ປັບຍອດສະຕັອກ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderRefreshButton />

          <button
            type="button"
            onClick={() => openStockIn()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ນຳເຂົ້າສິນຄ້າ (Stock In)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <InventorySummaryCards kpis={kpis} />

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        {/* Search Input (Barcode-Safe & Auto-Focus on Scan) */}
        <CatalogBarcodeSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ, ເລກລັອດ..."
          globalEnabled={!isAnyModalOpen}
        />

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">ທຸກໝວດໝູ່ ({displayCategories.length})</option>
            {displayCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_lo} {c.product_count !== undefined ? `(${c.product_count})` : ""}
              </option>
            ))}
          </select>

          {/* Quick Filter Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ທັງໝົດ
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("low_stock")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "low_stock"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ໃກ້ໝົດ ({kpis.lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("near_expiry")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "near_expiry"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ໃກ້ໝົດອາຍຸ ({kpis.nearExpiryBatchCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("expired")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "expired"
                  ? "bg-white text-rose-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ໝົດອາຍຸ ({kpis.expiredBatchCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Stock Overview Table */}
      <StockOverviewTable items={items} isLoading={isLoading} />

      {/* 5. Modals & Drawers (Mounted only when open for instant page mount) */}
      {isStockInOpen && <StockInSheet />}
      {hasBatchViewOpen && <BatchDetailDrawer />}
      {hasAdjustmentOpen && <StockAdjustmentDialog />}
    </div>
  );
}
