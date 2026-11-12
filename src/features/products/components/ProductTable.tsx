"use client";

// ============================================================================
// ProductTable: Responsive Product Catalog Table with Multi-Units & Stock Badges
// ============================================================================

import React from "react";
import {
  Package,
  Edit3,
  Power,
  Trash2,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Plus,
} from "lucide-react";
import { ProductListItem } from "../types/product.types";
import { useProductStore } from "../stores/product.store";
import { useProductMutations } from "../hooks/useProducts";
import { formatLak } from "@/utils/formatLakCurrency";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";
import { useInventoryStore } from "@/features/inventory";

interface ProductTableProps {
  products: ProductListItem[];
  isLoading: boolean;
}

export function ProductTable({ products, isLoading }: ProductTableProps) {
  const openEditSheet = useProductStore((s) => s.openEditSheet);
  const openCreateSheet = useProductStore((s) => s.openCreateSheet);
  const { toggleProductActive, deleteProduct, isSubmitting } = useProductMutations();

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">ກຳລັງໂຫຼດລາຍການສິນຄ້າ...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ບໍ່ພົບລາຍການສິນຄ້າ</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          ບໍ່ມີສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຍັງບໍ່ໄດ້ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າສູ່ລະບົບ
        </p>
        <button
          type="button"
          onClick={openCreateSheet}
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>ເພີ່ມສິນຄ້າທຳອິດ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">ສິນຄ້າ</th>
              <th className="py-3 px-3">ບາໂຄດ / SKU</th>
              <th className="py-3 px-3">ໝວດໝູ່</th>
              <th className="py-3 px-3">ຫົວໜ່ວຍຂາຍ (Packaging)</th>
              <th className="py-3 px-3 text-right">ລາຄາຂາຍ / ຕົ້ນທຶນ</th>
              <th className="py-3 px-3 text-center">ສະຕັອກຄົງເຫຼືອ</th>
              <th className="py-3 px-3 text-center">ສະຖານະ</th>
              <th className="py-3 px-4 text-center">ຈັດການ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {products.map((prod) => {
              const secondaryUnits = prod.units?.filter((u) => !u.is_base_unit) || [];
              const margin = prod.selling_price - prod.cost_price;
              const marginPct =
                prod.selling_price > 0
                  ? Math.round((margin / prod.selling_price) * 100)
                  : 0;

              return (
                <tr
                  key={prod.id}
                  className={`group transition-colors ${
                    prod.is_active ? "hover:bg-slate-50/70" : "bg-slate-50/30 opacity-75"
                  }`}
                >
                  {/* 1. Product Thumbnail & Names */}
                  <td className="py-2.5 px-4 min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <ProductThumbnail
                        src={prod.image_url}
                        alt={prod.name_lo}
                        name={prod.name_lo}
                        className="h-10 w-10 rounded-lg shrink-0 border border-zinc-200/70 overflow-hidden"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 leading-tight">
                            {prod.name_lo}
                          </span>
                          {prod.is_weighing && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800">
                              <Scale className="h-2 w-2" />
                              <span>ຊັ່ງກິໂລ</span>
                            </span>
                          )}
                          {prod.is_perishable && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1 py-0.2 text-[8px] font-bold text-rose-800">
                              <Clock className="h-2 w-2" />
                              <span>FEFO</span>
                            </span>
                          )}
                        </div>

                        {prod.name_en && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {prod.name_en}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Barcode & SKU */}
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-bold text-slate-700 text-xs">
                      {prod.barcode}
                    </div>
                    {prod.sku && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{prod.sku}</div>
                    )}
                  </td>

                  {/* 3. Category */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {prod.category_name || "ທົ່ວໄປ"}
                    </span>
                  </td>

                  {/* 4. Units & Packaging */}
                  <td className="py-2.5 px-3 max-w-[220px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Base Unit Pill */}
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        <span>{prod.base_unit} (1x)</span>
                      </span>

                      {/* Secondary Units Pills */}
                      {secondaryUnits.map((u, idx) => (
                        <span
                          key={u.id || `${u.unit_name}-${u.conversion_rate}-${idx}`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                          title={`ລາຄາ: ${formatLak(u.selling_price)}`}
                        >
                          <span>
                            {u.unit_name} (x{u.conversion_rate})
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 5. Price & Margin */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-extrabold text-slate-900 tabular-nums">
                      {formatLak(prod.selling_price)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                      ທຶນ: {formatLak(prod.cost_price, false)} (
                      <span
                        className={
                          marginPct > 15
                            ? "text-emerald-600 font-bold"
                            : marginPct > 0
                            ? "text-amber-600"
                            : "text-rose-500"
                        }
                      >
                        +{marginPct}%
                      </span>
                      )
                    </div>
                  </td>

                  {/* 6. Stock Count with Quick Stock-In Shortcut */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => useInventoryStore.getState().openStockIn(prod.id)}
                      className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold tabular-nums transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs border ${
                        prod.total_stock <= 5
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
                          : prod.total_stock <= 15
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                      }`}
                      title="ນຳເຂົ້າສະຕັອກດ່ວນ (Quick Stock In)"
                    >
                      <Boxes className="h-3 w-3 shrink-0" />
                      <span>
                        {prod.total_stock} {prod.base_unit}
                      </span>
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-white text-emerald-700 border border-emerald-300 opacity-70 group-hover:opacity-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                        <Plus className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    </button>
                  </td>

                  {/* 7. Active Status */}
                  <td className="py-2.5 px-3 text-center">
                    {prod.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>ເປີດຂາຍ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        <span>ປິດຂາຍ</span>
                      </span>
                    )}
                  </td>

                  {/* 8. Actions */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditSheet(prod)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        title="ແກ້ໄຂສິນຄ້າ"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleProductActive(prod.id, !prod.is_active)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                          prod.is_active
                            ? "border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title={prod.is_active ? "ປິດການຂາຍຊົ່ວຄາວ" : "ເປີດການຂາຍຄືນ"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສິນຄ້າ "${prod.name_lo}"?\n\n(ໝາຍເຫດ: ຫາກສິນຄ້າເຄີຍມີປະຫວັດການຂາຍ ລະບົບຈະບັນທຶກຊື່ສິນຄ້າ ແລະ ຮັກສາປະຫວັດໃບບິນໄວ້ຢ່າງຄົບຖ້ວນ)`
                          );
                          if (confirmed) {
                            await deleteProduct(prod.id);
                          }
                        }}
                        disabled={isSubmitting}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                        title="ລຶບສິນຄ້າ (Delete)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

