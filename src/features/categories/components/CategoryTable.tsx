"use client";

// ============================================================================
// Category Table Component: Lists all categories with product count & safe deletion
// ============================================================================

import React, { useState } from "react";
import { Edit2, Trash2, Package, AlertTriangle, ArrowUpDown, Info } from "lucide-react";
import { CategoryItem } from "../types/category.types";
import { useCategoryStore } from "../stores/category.store";
import { useCategoryMutations } from "../hooks/useCategories";
import { CategoryBadge } from "./CategoryBadge";

interface CategoryTableProps {
  categories: CategoryItem[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const openEditModal = useCategoryStore((s) => s.openEditModal);
  const { deleteCategory, isSubmitting } = useCategoryMutations();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [guardAlert, setGuardAlert] = useState<{
    open: boolean;
    name: string;
    count: number;
  }>({ open: false, name: "", count: 0 });

  const handleDeleteClick = async (cat: CategoryItem) => {
    if (cat.product_count && cat.product_count > 0) {
      setGuardAlert({
        open: true,
        name: cat.name_lo,
        count: cat.product_count,
      });
      return;
    }

    if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝວດໝູ່ "${cat.name_lo}"?`)) {
      setDeletingId(cat.id);
      try {
        await deleteCategory(cat.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden select-none">
        <div className="overflow-x-auto touch-pan-x touch-pan-y overscroll-x-contain">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-slate-50/70 text-[11px] text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4 w-16 text-center">ລຳດັບ</th>
                <th className="py-3 px-4">ໝວດໝູ່ສິນຄ້າ</th>
                <th className="py-3 px-4">ຊື່ພາສາອັງກິດ</th>
                <th className="py-3 px-4 text-center">ຈຳນວນສິນຄ້າໃນໝວດ</th>
                <th className="py-3 px-4 text-center w-28">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">ບໍ່ມີຂໍ້ມູນໝວດໝູ່</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60">
                    {/* Sort Order */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                      {cat.sort_order ?? 0}
                    </td>

                    {/* Category Badge & Icon */}
                    <td className="py-3 px-4">
                      <CategoryBadge
                        name={cat.name_lo}
                        icon={cat.icon}
                        color={cat.color}
                      />
                    </td>

                    {/* English Name */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {cat.name_en || "-"}
                    </td>

                    {/* Product Count */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                          cat.product_count && cat.product_count > 0
                            ? "bg-slate-100 text-slate-800"
                            : "bg-slate-50 text-slate-400 border border-slate-200/60"
                        }`}
                      >
                        <Package className="h-3 w-3 text-slate-400" />
                        <span>{cat.product_count || 0} ລາຍການ</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="ແກ້ໄຂ"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(cat)}
                          disabled={isSubmitting && deletingId === cat.id}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                          title="ລຶບ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Count Guard Alert Dialog */}
      {guardAlert.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/55"
            onClick={() => setGuardAlert({ open: false, name: "", count: 0 })}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-xl z-10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">
                  ບໍ່ສາມາດລຶບໝວດໝູ່ນີ້ໄດ້!
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ໝວດໝູ່ <strong>&quot;{guardAlert.name}&quot;</strong> ຍັງມີສິນຄ້າທີ່ກຳລັງເປີດຂາຍຢູ່ <strong>{guardAlert.count} ລາຍການ</strong>.
                </p>
                <p className="text-[11px] text-slate-500 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200/70">
                  💡 <strong>ຄຳແນະນຳ:</strong> ກະລຸນາເຂົ້າໄປທີ່ເມນູ <strong>&quot;ສິນຄ້າ & ຫົວໜ່ວຍ&quot;</strong> ເພື່ອຍ້າຍສິນຄ້າເຫຼົ່ານີ້ໄປໝວດໝູ່ອື່ນກ່ອນດຳເນີນການລຶບ.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setGuardAlert({ open: false, name: "", count: 0 })}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ເຂົ້າໃຈແລ້ວ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

