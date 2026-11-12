"use client";

// ============================================================================
// Categories Backoffice Management Page (ໝວດໝູ່ສິນຄ້າ)
// ============================================================================

import React from "react";
import { Plus, Search, RefreshCw, Tags } from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { useCategoryStore } from "../stores/category.store";
import { CategoryTable } from "../components/CategoryTable";
import { CategoryFormDialog } from "../components/CategoryFormDialog";

export function CategoriesPage() {
  const { categories, totalCount, isLoading, refresh } = useCategories();
  const searchTerm = useCategoryStore((s) => s.searchTerm);
  const setSearchTerm = useCategoryStore((s) => s.setSearchTerm);
  const openCreateModal = useCategoryStore((s) => s.openCreateModal);

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຈັດການໝວດໝູ່ສິນຄ້າ (Categories Management)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ກຳນົດໝວດໝູ່ສິນຄ້າ, ໄອຄອນ ແລະ ສີເພື່ອສະແດງຜົນໃນແຖບຄົ້ນຫາໜ້າຮ້ານ POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="ດຶງຂໍ້ມູນໃໝ່ຈາກ Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            <span>ຣີເຟຣຊ (Sync)</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ເພີ່ມໝວດໝູ່ໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Search Filter Strip */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ໝວດໝູ່..."
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          ທັງໝົດ <strong>{totalCount}</strong> ໝວດໝູ່
        </div>
      </div>

      {/* Main Table */}
      <CategoryTable categories={categories} />

      {/* Category Create/Edit Modal */}
      <CategoryFormDialog />
    </div>
  );
}

