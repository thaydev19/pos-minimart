"use client";

// ============================================================================
// ProductTable: Responsive Product Catalog Table with Multi-Units & Stock Badges
// ============================================================================

import React, { memo, useCallback, useMemo } from "react";
import {
  Package,
  Edit3,
  Power,
  Trash2,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ClipboardList,
} from "lucide-react";
import { ProductListItem } from "../types/product.types";
import { useProductStore } from "../stores/product.store";
import { useProductMutations } from "../hooks/useProducts";
import { formatLak } from "@/utils/formatLakCurrency";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";
import { useInventoryStore } from "@/features/inventory";
import { useVirtualTableWindow } from "@/hooks/useVirtualTableWindow";

const ROW_HEIGHT = 66;

interface ProductTableProps {
  products: ProductListItem[];
  isLoading: boolean;
}

interface ProductTableRowProps {
  prod: ProductListItem;
  todayStartMs: number;
  isSubmitting: boolean;
  onToggleActive: (id: string, nextActive: boolean) => void;
  onDelete: (prod: ProductListItem) => void;
}

const ProductTableRow = memo(function ProductTableRow({
  prod,
  todayStartMs,
  isSubmitting,
  onToggleActive,
  onDelete,
}: ProductTableRowProps) {
  const secondaryUnits = prod.units?.filter((u) => !u.is_base_unit) || [];
  const packUnit = secondaryUnits.find((u) => u.conversion_rate > 1);
  const margin = prod.selling_price - prod.cost_price;
  const marginPct =
    prod.selling_price > 0
      ? Math.round((margin / prod.selling_price) * 100)
      : 0;

  let actualExpiryStatus: "expired" | "near_expiry" | null = null;
  let minDaysRemaining = Infinity;

  if (prod.is_perishable && prod.batches && prod.batches.length > 0) {
    for (const b of prod.batches) {
      if (b.quantity_on_hand <= 0 || !b.expiry_date) continue;
      const targetTime = new Date(b.expiry_date).getTime();
      const diffDays = Math.ceil((targetTime - todayStartMs) / 86400000);
      if (diffDays < minDaysRemaining) {
        minDaysRemaining = diffDays;
      }
    }

    if (minDaysRemaining <= 0 && minDaysRemaining !== Infinity) {
      actualExpiryStatus = "expired";
    } else if (
      minDaysRemaining <= (prod.warning_days_before_expiry || 15) &&
      minDaysRemaining !== Infinity
    ) {
      actualExpiryStatus = "near_expiry";
    }
  }

  return (
    <tr
      className={`h-[66px] group ${
        prod.is_active ? "hover:bg-slate-50/70" : "bg-slate-50/30 opacity-75"
      }`}
    >
      {/* 1. Product Thumbnail & Names */}
      <td className="py-1.5 px-2.5 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 max-h-[54px] overflow-hidden">
          <ProductThumbnail
            src={prod.image_url}
            alt={prod.name_lo}
            className="h-9 w-9 rounded-xl shrink-0 border border-slate-200/80 overflow-hidden"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-slate-900 leading-tight line-clamp-1">
                {prod.name_lo}
              </span>
              {prod.is_weighing && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800 shrink-0">
                  <Scale className="h-2 w-2" />
                  <span>ຊັ່ງກິໂລ</span>
                </span>
              )}
              {actualExpiryStatus === "expired" && (
                <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 border border-rose-300 px-1.5 py-0.2 text-[8.5px] font-extrabold text-rose-800 shrink-0">
                  <Clock className="h-2 w-2 text-rose-700" />
                  <span>ໝົດອາຍຸແລ້ວ</span>
                </span>
              )}
              {actualExpiryStatus === "near_expiry" && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[8.5px] font-extrabold text-amber-800 shrink-0">
                  <AlertTriangle className="h-2 w-2 text-amber-700" />
                  <span>ໃກ້ໝົດອາຍຸ (ອີກ {minDaysRemaining} ວັນ)</span>
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
      <td className="py-1.5 px-1.5 font-mono overflow-hidden">
        <div className="font-bold text-slate-700 text-[11px] truncate" title={prod.barcode}>
          {prod.barcode}
        </div>
        {prod.sku && (
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={prod.sku}>
            {prod.sku}
          </div>
        )}
      </td>

      {/* 3. Category */}
      <td className="py-1.5 px-1.5 overflow-hidden">
        <span
          className="inline-flex max-w-full items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
          title={prod.category_name || "ທົ່ວໄປ"}
        >
          <span className="truncate">{prod.category_name || "ທົ່ວໄປ"}</span>
        </span>
      </td>

      {/* 4. Units & Packaging */}
      <td className="py-1.5 px-1.5 overflow-hidden">
        <div className="flex items-center gap-1 flex-wrap max-h-[50px] overflow-hidden">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
            <span>{prod.base_unit} (1x)</span>
          </span>

          {secondaryUnits.map((u, idx) => (
            <span
              key={u.id || `${u.unit_name}-${u.conversion_rate}-${idx}`}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap"
              title={`ລາຄາ: ${formatLak(u.selling_price)}`}
            >
              <span>
                {u.unit_name} (x{u.conversion_rate})
              </span>
            </span>
          ))}
        </div>
      </td>

      {/* 5. Selling Price */}
      <td className="py-1.5 px-1.5 text-right overflow-hidden">
        <div className="font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
          {formatLak(prod.selling_price)}
        </div>
        {packUnit ? (
          <div
            className="text-[10px] font-medium text-zinc-500 tabular-nums mt-0.5 truncate"
            title={`${packUnit.unit_name} (x${packUnit.conversion_rate}): ${formatLak(packUnit.selling_price)}`}
          >
            {packUnit.unit_name}(x{packUnit.conversion_rate}): {formatLak(packUnit.selling_price)}
          </div>
        ) : null}
      </td>

      {/* 6. Cost Price & Margin */}
      <td className="py-1.5 px-1.5 text-right overflow-hidden">
        <div className="font-bold text-slate-700 tabular-nums whitespace-nowrap">
          {formatLak(prod.cost_price)}
        </div>
        <div className="text-[10.5px] tabular-nums mt-0.5 font-semibold whitespace-nowrap">
          <span
            className={
              marginPct > 15
                ? "text-emerald-600"
                : marginPct > 0
                ? "text-amber-600"
                : "text-rose-500"
            }
          >
            +{marginPct}%
          </span>
        </div>
      </td>

      {/* 7. Stock Count - Unified Split Pill */}
      <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
        <div
          className={`inline-flex items-center rounded-xl border bg-white overflow-hidden whitespace-nowrap ${
            prod.total_stock <= 0
              ? "border-rose-200/90 bg-rose-50/30"
              : prod.total_stock <= 10
              ? "border-amber-200/90 bg-amber-50/30"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <button
            type="button"
            onClick={() => useInventoryStore.getState().openAdjustmentForProduct(prod.id)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold tabular-nums hover:bg-slate-50 active:bg-slate-100 cursor-pointer whitespace-nowrap"
            title="ກົດເພື່ອປັບຍອດສະຕັອກ (Adjust Stock)"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                prod.total_stock <= 0
                  ? "bg-rose-500"
                  : prod.total_stock <= 10
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span
              className={
                prod.total_stock <= 0
                  ? "text-rose-700 font-extrabold"
                  : prod.total_stock <= 10
                  ? "text-amber-800"
                  : "text-slate-800"
              }
            >
              {prod.total_stock} {prod.base_unit}
            </span>
          </button>

          <span className="h-4 w-px bg-slate-200 shrink-0" />

          <button
            type="button"
            onClick={() => useInventoryStore.getState().openStockIn(prod.id)}
            className="flex h-6 w-6 items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 cursor-pointer"
            title="ນຳເຂົ້າສະຕັອກດ່ວນ (Quick Stock In)"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>
      </td>

      {/* 8. Active Status */}
      <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
        {prod.is_active ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
            <span>ເປີດຂາຍ</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            <span>ປິດຂາຍ</span>
          </span>
        )}
      </td>

      {/* 9. Actions */}
      <td className="py-1.5 px-1 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => useInventoryStore.getState().openAdjustmentForProduct(prod.id)}
            className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer"
            title="ກວດນັບ / ປັບຍອດສະຕັອກ (Adjust Stock)"
          >
            <ClipboardList className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </button>

          <button
            type="button"
            onClick={() => useProductStore.getState().openEditSheet(prod)}
            className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer"
            title="ແກ້ໄຂສິນຄ້າ"
          >
            <Edit3 className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </button>

          <button
            type="button"
            onClick={() => onToggleActive(prod.id, !prod.is_active)}
            className={`flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-lg border cursor-pointer ${
              prod.is_active
                ? "border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
            title={prod.is_active ? "ປິດການຂາຍຊົ່ວຄາວ" : "ເປີດການຂາຍຄືນ"}
          >
            <Power className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(prod)}
            disabled={isSubmitting}
            className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 cursor-pointer disabled:opacity-50"
            title="ລຶບສິນຄ້າ (Delete)"
          >
            <Trash2 className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export function ProductTable({ products, isLoading }: ProductTableProps) {
  const openCreateSheet = useProductStore((s) => s.openCreateSheet);
  const { toggleProductActive, deleteProduct, isSubmitting } = useProductMutations();
  const { tbodyRef, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } =
    useVirtualTableWindow(products.length, ROW_HEIGHT, 8);
  const todayStartMs = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const visibleProducts = useMemo(
    () => products.slice(startIndex, endIndex),
    [products, startIndex, endIndex]
  );

  const handleDelete = useCallback(
    async (prod: ProductListItem) => {
      const confirmed = window.confirm(
        `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສິນຄ້າ "${prod.name_lo}"?\n\n(ໝາຍເຫດ: ຫາກສິນຄ້າເຄີຍມີປະຫວັດການຂາຍ ລະບົບຈະບັນທຶກຊື່ສິນຄ້າ ແລະ ຮັກສາປະຫວັດໃບບິນໄວ້ຢ່າງຄົບຖ້ວນ)`
      );
      if (confirmed) {
        await deleteProduct(prod.id);
      }
    },
    [deleteProduct]
  );

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
    <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
      <div className="overflow-x-auto touch-pan-x touch-pan-y overscroll-x-contain">
        <table className="w-full min-w-[920px] lg:min-w-0 lg:table-fixed text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-2.5 lg:w-[20%]">ສິນຄ້າ</th>
              <th className="py-2.5 px-1.5 lg:w-[10%] whitespace-nowrap">ບາໂຄດ / SKU</th>
              <th className="py-2.5 px-1.5 lg:w-[9%] whitespace-nowrap">ໝວດໝູ່</th>
              <th className="py-2.5 px-1.5 lg:w-[8%] whitespace-nowrap">ຫົວໜ່ວຍຂາຍ</th>
              <th className="py-2.5 px-1.5 lg:w-[11%] text-right whitespace-nowrap">ລາຄາຂາຍ</th>
              <th className="py-2.5 px-1.5 lg:w-[10%] text-right whitespace-nowrap">ຕົ້ນທຶນ & ກຳໄລ</th>
              <th className="py-2.5 px-1.5 lg:w-[11%] text-center whitespace-nowrap">ສະຕັອກຄົງເຫຼືອ</th>
              <th className="py-2.5 px-1.5 lg:w-[7%] text-center whitespace-nowrap">ສະຖານະ</th>
              <th className="py-2.5 px-1.5 lg:w-[14%] text-center whitespace-nowrap">ຈັດການ</th>
            </tr>
          </thead>

          <tbody ref={tbodyRef} className="divide-y divide-zinc-100">
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={9} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
            {visibleProducts.map((prod) => (
              <ProductTableRow
                key={prod.id}
                prod={prod}
                todayStartMs={todayStartMs}
                isSubmitting={isSubmitting}
                onToggleActive={toggleProductActive}
                onDelete={handleDelete}
              />
            ))}
            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={9} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

