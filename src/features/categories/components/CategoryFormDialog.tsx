"use client";

// ============================================================================
// Category Form Dialog: Add & Edit Category Modal (Lao Language)
// Architecture: Zero-useEffect pattern via React key re-mounting
// Visual Lucide Icon Picker & Color Palettes
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  X,
  Check,
  AlertCircle,
  Save,
  Tags,
  MoreHorizontal,
  ChevronUp,
  Search,
} from "lucide-react";
import { useCategoryStore } from "../stores/category.store";
import { useCategoryMutations } from "../hooks/useCategories";
import { CategoryItem } from "../types/category.types";
import {
  DEFAULT_CATEGORY_ICONS,
  CATEGORY_ICON_OPTIONS,
  CATEGORY_ICON_GROUPS,
  CATEGORY_COLOR_OPTIONS,
} from "../constants/category.constants";
import {
  getCategoryIconComponent,
  getCategoryColorStyle,
} from "../utils/category.util";
import { CategoryBadge } from "./CategoryBadge";

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
  const [icon, setIcon] = useState(category?.icon?.split(":")[0] || "LayoutGrid");
  const [color, setColor] = useState(category?.color || "emerald");
  const [sortOrder, setSortOrder] = useState<number>(category?.sort_order ?? 0);
  const [clientError, setClientError] = useState<string | null>(null);

  // Icon picker state: default 2 rows (11 icons + 1 More button) vs expanded full grid
  const [isMoreIconsOpen, setIsMoreIconsOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const colorStyle = getCategoryColorStyle(color);

  // Compute icons to display in default 2 rows (slot 1 to 11)
  const defaultRowIcons = useMemo(() => {
    const list = [...DEFAULT_CATEGORY_ICONS];
    // If the active icon is outside the default 11 icons, ensure it's visible in slot 11
    const isInDefault = list.some((item) => item.id === icon);
    if (!isInDefault) {
      const customMatch = CATEGORY_ICON_OPTIONS.find((item) => item.id === icon);
      if (customMatch) {
        list[list.length - 1] = customMatch;
      } else {
        list[list.length - 1] = {
          id: icon,
          name_lo: icon,
          group: "general",
        };
      }
    }
    return list;
  }, [icon]);

  // Compute filtered icons for expanded mode with group tabs & smart search
  const filteredExpandedIcons = useMemo(() => {
    return CATEGORY_ICON_OPTIONS.filter((opt) => {
      // 1. Group match
      if (activeGroup !== "all" && opt.group !== activeGroup) {
        return false;
      }
      // 2. Search match
      if (!iconSearch.trim()) return true;
      const q = iconSearch.toLowerCase();
      return (
        opt.id.toLowerCase().includes(q) ||
        opt.name_lo.toLowerCase().includes(q) ||
        (opt.keywords && opt.keywords.toLowerCase().includes(q))
      );
    });
  }, [activeGroup, iconSearch]);

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

        {/* Visual Lucide Icon Selector: 2 Rows Default + "More" Button for Extended Collection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-700 font-bold">
              ເລືອກໄອຄອນໝວດໝູ່ (Icon)
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              {isMoreIconsOpen
                ? `${filteredExpandedIcons.length} ໄອຄອນ`
                : "ສະແດງ 2 ແຖວຫຼັກ (ກົດເພີ່ມເຕີມເພື່ອເລືອກທັງໝົດ)"}
            </span>
          </div>

          {!isMoreIconsOpen ? (
            /* Default Compact 2-Row Display (11 primary icons + 1 "More" button - Pure Icon Only) */
            <div className="grid grid-cols-6 gap-2 p-1.5 border border-slate-100 rounded-xl bg-slate-50/50">
              {defaultRowIcons.map((opt) => {
                const isSelected = icon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    className={`flex items-center justify-center h-11 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? colorStyle.activeBtnClass
                        : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    title={opt.name_lo}
                  >
                    {getCategoryIconComponent(opt.id, "h-5 w-5")}
                  </button>
                );
              })}

              {/* Slot 12: "More" Button */}
              <button
                type="button"
                onClick={() => setIsMoreIconsOpen(true)}
                className="flex items-center justify-center h-11 rounded-xl transition-all cursor-pointer border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 group shadow-2xs"
                title="ເລືອກໄອຄອນເພີ່ມເຕີມ..."
              >
                <MoreHorizontal className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            /* Expanded Collection (Nearly 100 icons with group filters & search - Pure Icon Only) */
            <div className="space-y-2 p-2.5 border border-slate-200 rounded-xl bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="ຄົ້ນຫາໄອຄອນ (cookie, cup, beer, milk, ຢາ, ເຂົ້າໜົມ...)..."
                    className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 bg-white"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreIconsOpen(false);
                    setIconSearch("");
                    setActiveGroup("all");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>ຍຸບລົງ</span>
                </button>
              </div>

              {/* Group Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {CATEGORY_ICON_GROUPS.map((grp) => {
                  const isGrpActive = activeGroup === grp.id;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setActiveGroup(grp.id)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all cursor-pointer ${
                        isGrpActive
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      {grp.name_lo}
                    </button>
                  );
                })}
              </div>

              {/* Grid of Icons (Pure Icon, Clean & Compact) */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto p-1">
                {filteredExpandedIcons.map((opt) => {
                  const isSelected = icon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIcon(opt.id)}
                      className={`flex items-center justify-center h-10 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? colorStyle.activeBtnClass
                          : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      title={`${opt.id} - ${opt.name_lo}`}
                    >
                      {getCategoryIconComponent(opt.id, "h-5 w-5")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                    } ${
                      isSelected
                        ? "ring-3 ring-offset-2 ring-slate-800 scale-110 shadow-xs"
                        : "hover:scale-105"
                    }`}
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

        {/* Live Preview of Selected Icon & Color */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              ຕົວຢ່າງການສະແດງຜົນ (Live Preview):
            </span>
            <CategoryBadge
              name={nameLo.trim() || "ຊື່ໝວດໝູ່"}
              icon={icon}
              color={color}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            ສີ & ໄອຄອນຈະສະແດງແບບນີ້ໃນໜ້າ POS
          </span>
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
