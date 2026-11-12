"use client";

// ============================================================================
// ProductsPage: Enterprise Product & Multi-Unit Conversion Management
// 100% Real Supabase + Dexie Offline DB, Strict Lao Localization
// ============================================================================

import React from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Scale,
  AlertTriangle,
  Layers,
  Filter,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useProductStore } from "../stores/product.store";
import { useCategories } from "@/features/categories";
import { ProductTable } from "../components/ProductTable";
import { ProductFormModal } from "../components/ProductFormModal";
import { StockInSheet } from "@/features/inventory";

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

  const { categories } = useCategories();

  // Metrics
  const weighingCount = products.filter((p) => p.is_weighing).length;
  const lowStockCount = products.filter((p) => p.total_stock <= 10).length;

  return (
    <div className="space-y-4">
      {/* 1. Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ລາຍການສິນຄ້າ & ຫົວໜ່ວຍ (Products & Units)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ຈັດການສິນຄ້າມິນິມາດ, ບາໂຄດ, ຫົວໜ່ວຍຍ່ອຍ/ແພັກ/ແກັດ ແລະ ລາຄາຂາຍ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="ດຶງຂໍ້ມູນລ່າສຸດຈາກ Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
          </button>

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

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Products */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ສິນຄ້າທັງໝົດ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {totalCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ລາຍການໃນຖານຂໍ້ມູນ</p>
        </div>

        {/* Categories */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ໝວດໝູ່ສິນຄ້າ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {categories.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ໝວດໝູ່ທີ່ເປີດໃຊ້</p>
        </div>

        {/* Weighing items */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ສິນຄ້າຊັ່ງກິໂລ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {weighingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ບາໂຄດຕາຊັ່ງ (PLU)</p>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ໃກ້ໝົດສະຕັອກ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-600 tabular-nums mt-1.5">
            {lowStockCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ສະຕັອກເຫຼືອ ≤ 10 ອັນ</p>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ, SKU..."
            className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
          />
        </div>

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

      {/* 5. Product Form Modal (Create / Edit) with Key-based Clean Mount */}
      <ProductFormModal
        key={`${editingProduct?.id ?? "create-new"}-${isFormSheetOpen}`}
      />

      {/* 6. Quick Stock-In Drawer */}
      <StockInSheet />
    </div>
  );
}
