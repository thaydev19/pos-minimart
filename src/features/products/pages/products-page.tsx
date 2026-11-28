"use client";

// ============================================================================
// ProductsPage: Enterprise Product & Multi-Unit Conversion Management
// 100% Real Supabase + Dexie Offline DB, Strict Lao Localization
// ============================================================================

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Package,
  Plus,
  Scale,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useProductStore } from "../stores/product.store";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { ProductTable } from "../components/ProductTable";
import { useInventoryStore } from "@/features/inventory/stores/inventory.store";
import { HeaderRefreshButton } from "@/components/HeaderRefreshButton";
import { CatalogBarcodeSearchInput } from "@/components/CatalogBarcodeSearchInput";

const ProductFormModal = dynamic(
  () =>
    import("../components/ProductFormModal").then((m) => m.ProductFormModal),
  { ssr: false }
);
const StockInSheet = dynamic(
  () =>
    import("@/features/inventory/components/StockInSheet").then(
      (m) => m.StockInSheet
    ),
  { ssr: false }
);
const StockAdjustmentDialog = dynamic(
  () =>
    import("@/features/inventory/components/StockAdjustmentDialog").then(
      (m) => m.StockAdjustmentDialog
    ),
  { ssr: false }
);

export function ProductsPage() {
  const { products, totalCount, isLoading, refresh } = useProducts();
  const searchTerm = useProductStore((s) => s.searchTerm);
  const setSearchTerm = useProductStore((s) => s.setSearchTerm);
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const setSelectedCategory = useProductStore((s) => s.setSelectedCategory);
  const filterType = useProductStore((s) => s.filterType);
  const setFilterType = useProductStore((s) => s.setFilterType);
  const openCreateSheet = useProductStore((s) => s.openCreateSheet);
  const isFormSheetOpen = useProductStore((s) => s.isFormSheetOpen);
  const editingProduct = useProductStore((s) => s.editingProduct);
  const isStockInOpen = useInventoryStore((s) => s.isStockInOpen);
  const hasAdjustmentOpen = useInventoryStore((s) => Boolean(s.selectedBatchForAdjustment));
  const isAnyModalOpen = isFormSheetOpen || isStockInOpen || hasAdjustmentOpen;

  const { categories } = useCategories();

  // Metrics
  const { weighingCount, lowStockCount } = useMemo(() => {
    let weighing = 0;
    let low = 0;
    for (const p of products) {
      if (p.is_weighing) weighing++;
      if (p.total_stock <= 10) low++;
    }
    return { weighingCount: weighing, lowStockCount: low };
  }, [products]);

  return (
    <div className="space-y-4">
      {/* 1. Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ລາຍການສິນຄ້າ & ຫົວໜ່ວຍ (Products & Units)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ຈັດການສິນຄ້າມິນິມາດ, ບາໂຄດ, ຫົວໜ່ວຍຍ່ອຍ/ແພັກ/ແກັດ ແລະ ລາຄາຂາຍ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderRefreshButton />

          <button
            type="button"
            onClick={openCreateSheet}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ເພີ່ມສິນຄ້າໃໝ່</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Compact 2-Line Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Products */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ສິນຄ້າທັງໝົດ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {totalCount} <span className="text-[11px] font-normal text-slate-400">ລາຍການ</span>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ໝວດໝູ່ສິນຄ້າ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 shrink-0">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {categories.length} <span className="text-[11px] font-normal text-slate-400">ໝວດ</span>
          </div>
        </div>

        {/* Weighing items */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ສິນຄ້າຊັ່ງກິໂລ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 shrink-0">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {weighingCount} <span className="text-[11px] font-normal text-slate-400">ລາຍການ</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ໃກ້ໝົດສະຕັອກ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-700 shrink-0">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums mt-1 leading-tight">
            {lowStockCount} <span className="text-[11px] font-normal text-slate-400">ລາຍການ</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        {/* Search Input (Barcode-Safe & Auto-Focus on Scan) */}
        <CatalogBarcodeSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ, SKU..."
          globalEnabled={!isAnyModalOpen}
        />

        {/* Filter Chips & Category Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600"
          >
            <option value="all">ທຸກໝວດໝູ່ ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_lo}
              </option>
            ))}
          </select>

          {/* Quick Filter Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ທັງໝົດ
            </button>
            <button
              type="button"
              onClick={() => setFilterType("weighing")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterType === "weighing"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ຊັ່ງກິໂລ
            </button>
            <button
              type="button"
              onClick={() => setFilterType("low_stock")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                filterType === "low_stock"
                  ? "bg-white text-rose-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ໃກ້ໝົດ
            </button>
          </div>
        </div>
      </div>

      {/* 4. Products Table */}
      <ProductTable products={products} isLoading={isLoading} />

      {/* 5. Product Form Modal (Mounted only when open for instant page mount) */}
      {isFormSheetOpen && (
        <ProductFormModal key={editingProduct?.id ?? "create-new"} />
      )}

      {/* 6. Quick Stock-In Drawer */}
      {isStockInOpen && <StockInSheet />}

      {/* 7. Quick Stock Adjustment Dialog */}
      {hasAdjustmentOpen && <StockAdjustmentDialog />}
    </div>
  );
}
