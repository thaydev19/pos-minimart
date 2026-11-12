"use client";

// ============================================================================
// Category Form Dialog: Add & Edit Category Modal (Lao Language)
// Architecture: Zero-useEffect pattern via React key re-mounting
// Visual Lucide Icon Picker & Color Palettes
// ============================================================================

import React, { useState } from "react";
import { X, Check, AlertCircle, Save, Tags } from "lucide-react";
import { useCategoryStore } from "../stores/category.store";
import { useCategoryMutations } from "../hooks/useCategories";
import { CategoryItem } from "../types/category.types";
import {
  CATEGORY_ICON_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
} from "../constants/category.constants";
import { getCategoryIconComponent } from "../utils/category.util";

interface CategoryFormContentProps {
  category: CategoryItem | null;
  onClose: () => void;
}

function CategoryFormContent({ category, onClose }: CategoryFormContentProps) {
  const { createCategory, updateCategory, isSubmitting, errorMessage } =
    useCategoryMutations();

  // Pure initial state from props — zero useEffect required!
  const [nameLo, setNameLo] = useState(category ? category.name_lo : "");
  const [nameEn, setNameEn] = useState(category?.name_en || "");
  const [icon, setIcon] = useState(category?.icon || "LayoutGrid");
  const [color, setColor] = useState(category?.color || "emerald");
  const [sortOrder, setSortOrder] = useState<number>(category?.sort_order ?? 0);
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameLo.trim()) {
      setClientError("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ (ພາສາລາວ)");
      return;
    }

    setClientError(null);
    const payload = {
      name_lo: nameLo.trim(),
      name_en: nameEn.trim() || undefined,
      icon,
      color,
      sort_order: Number(sortOrder) || 0,
    };

    if (category) {
      await updateCategory(category.id, payload);
    } else {
      await createCategory(payload);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
            <Tags className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {category ? "ແກ້ໄຂໝວດໝູ່ສິນຄ້າ" : "ເພີ່ມໝວດໝູ່ສິນຄ້າໃໝ່"}
            </h3>
            <p className="text-[10px] text-slate-500">
              ກຳນົດຊື່, ໄອຄອນ ແລະ ສີເພື່ອສະແດງໃນລະບົບ POS
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Error Alert */}
      {(clientError || errorMessage) && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{clientError || errorMessage}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Lao & English Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ຊື່ໝວດໝູ່ (ພາສາລາວ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nameLo}
              onChange={(e) => setNameLo(e.target.value)}
              placeholder="ຕົວຢ່າງ: ເຄື່ອງດື່ມ, ອາຫານ..."
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ຊື່ພາສາອັງກິດ (ທາງເລືອກ)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Beverages, Snacks..."
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all"
            />
          </div>
        </div>

        {/* Visual Lucide Icon Selector */}
        <div>
          <label className="block text-xs text-slate-700 font-bold mb-1.5">
            ເລືອກໄອຄອນໝວດໝູ່ (Icon)
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
            {CATEGORY_ICON_OPTIONS.map((opt) => {
              const isSelected = icon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {getCategoryIconComponent(opt.id, "h-5 w-5 mb-1")}
                  <span className="text-[9px] font-semibold text-center truncate max-w-full">
                    {opt.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palettes & Sort Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              ສີແທັກ (Color Theme)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
                      c.dotClass
                    } ${isSelected ? "ring-3 ring-offset-2 ring-emerald-600" : ""}`}
                    title={c.name_lo}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ລຳດັບສະແດງຜົນ (Sort Order)
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600 tabular-nums"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກໝວດໝູ່"}</span>
          </button>
        </div>
      </form>
    </>
  );
}

export function CategoryFormDialog() {
  const isFormOpen = useCategoryStore((s) => s.isFormOpen);
  const editingCategory = useCategoryStore((s) => s.editingCategory);
  const closeModal = useCategoryStore((s) => s.closeModal);

  if (!isFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeModal}
      />

      {/* Dialog Modal Container with Key-based Reset (Zero-useEffect) */}
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200/90 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <CategoryFormContent
          key={`${editingCategory?.id || "create-new"}-${isFormOpen}`}
          category={editingCategory}
          onClose={closeModal}
        />
      </div>
    </div>
  );
}
