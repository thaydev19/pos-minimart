"use client";

// ============================================================================
// StockOverviewTable: Inventory Table with FEFO Expiry Tracking & Quick Actions
// ============================================================================

import React, { memo, useMemo } from "react";
import {
  Boxes,
  Plus,
  Layers,
  ClipboardList,
  Scale,
} from "lucide-react";
import { InventoryProductItem } from "../types/inventory.types";
import { useInventoryStore } from "../stores/inventory.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { ExpiryBadge } from "./ExpiryBadge";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";
import { useVirtualTableWindow } from "@/hooks/useVirtualTableWindow";

const ROW_HEIGHT = 66;

interface StockOverviewTableProps {
  items: InventoryProductItem[];
  isLoading: boolean;
}

const StockOverviewRow = memo(function StockOverviewRow({
  prod,
}: {
  prod: InventoryProductItem;
}) {
  const activeBatchesCount = prod.batches.reduce(
    (count, b) => (b.quantity_on_hand > 0 ? count + 1 : count),
    0
  );
  const nextBatch = prod.fefo_next_batch;

  const formattedExpiry = nextBatch?.expiry_date
    ? (() => {
        const parts = nextBatch.expiry_date.split("-");
        return parts.length === 3
          ? `${parts[2]}/${parts[1]}/${parts[0]}`
          : nextBatch.expiry_date;
      })()
    : null;

  return (
    <tr className="h-[66px] hover:bg-slate-50/70 group">
      {/* 1. Product Name & Image */}
      <td className="py-1.5 px-3 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 max-h-[54px] overflow-hidden">
          <ProductThumbnail
            src={prod.image_url}
            alt={prod.name_lo}
            name={prod.name_lo}
            className="h-9 w-9 rounded-lg shrink-0 border border-zinc-200/70 overflow-hidden"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 leading-tight line-clamp-1">
                {prod.name_lo}
              </span>
              {prod.is_weighing && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800 whitespace-nowrap shrink-0">
                  <Scale className="h-2 w-2" />
                  <span>ຊັ່ງກິໂລ</span>
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

      {/* 2. Barcode & Category */}
      <td className="py-1.5 px-2 overflow-hidden">
        <div className="font-mono font-bold text-slate-700 text-[11px] truncate" title={prod.barcode}>
          {prod.barcode}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={prod.category_name || "ທົ່ວໄປ"}>
          {prod.category_name || "ທົ່ວໄປ"}
        </div>
      </td>

      {/* 3. Total Stock */}
      <td className="py-1.5 px-2 text-right overflow-hidden">
        <div
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-extrabold tabular-nums whitespace-nowrap ${
            prod.total_stock <= 5
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : prod.total_stock <= 10
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-slate-100 text-slate-900 border border-slate-200/60"
          }`}
        >
          <span>
            {prod.total_stock} {prod.base_unit}
          </span>
        </div>

        <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
          ມີ {activeBatchesCount} ລັອດໃນສາງ
        </div>
      </td>

      {/* 4. Nearest FEFO Expiry */}
      <td className="py-1.5 px-2 overflow-hidden">
        {nextBatch && formattedExpiry ? (
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-zinc-900 text-[11px] tabular-nums">
                {formattedExpiry}
              </span>
              <ExpiryBadge
                expiryDate={nextBatch.expiry_date}
                daysUntilExpiry={nextBatch.days_until_expiry}
                status={nextBatch.status}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-medium truncate">
              ລັອດນີ້ເຫຼືອ: {nextBatch.quantity_on_hand} {prod.base_unit}
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
            ບໍ່ມີວັນໝົດອາຍຸ
          </span>
        )}
      </td>

      {/* 5. Cost & Inventory Value */}
      <td className="py-1.5 px-2 text-right overflow-hidden">
        <div className="font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
          {formatLak(prod.total_cost_value)}
        </div>
        <div className="text-[10px] text-slate-400 tabular-nums mt-0.5 truncate">
          ທຶນ: {formatLak(prod.latest_cost_price, false)}/{prod.base_unit}
        </div>
      </td>

      {/* 6. Quick Action Buttons */}
      <td className="py-1.5 px-2 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
          <button
            type="button"
            onClick={() => useInventoryStore.getState().openStockIn(prod.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
            title="ນຳເຂົ້າສິນຄ້າລັອດໃໝ່"
          >
            <Plus className="h-3 w-3 shrink-0" />
            <span>ນຳເຂົ້າ</span>
          </button>

          <button
            type="button"
            onClick={() => useInventoryStore.getState().openBatchDetail(prod)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            title="ເບິ່ງລາຍລະອຽດທຸກລັອດ (FEFO)"
          >
            <Layers className="h-3 w-3 shrink-0" />
            <span>ລັອດ ({activeBatchesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const store = useInventoryStore.getState();
              if (nextBatch) {
                store.openAdjustment(prod, nextBatch);
              } else {
                store.openBatchDetail(prod);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            title="ກວດນັບ / ປັບຍອດສະຕັອກ"
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export function StockOverviewTable({ items, isLoading }: StockOverviewTableProps) {
  const { tbodyRef, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } =
    useVirtualTableWindow(items.length, ROW_HEIGHT, 8);
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">ກຳລັງໂຫຼດຂໍ້ມູນສາງສິນຄ້າ...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ບໍ່ພົບລາຍການສິນຄ້າໃນສາງ</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          ບໍ່ມີສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຍັງບໍ່ມີການນຳເຂົ້າສິນຄ້າ
        </p>
        <button
          type="button"
          onClick={() => useInventoryStore.getState().openStockIn()}
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>ນຳເຂົ້າສິນຄ້າໃໝ່ (Stock In)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
      <div className="overflow-x-auto touch-pan-x touch-pan-y overscroll-x-contain">
        <table className="w-full min-w-[860px] lg:min-w-0 lg:table-fixed text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 lg:w-[25%]">ສິນຄ້າ</th>
              <th className="py-2.5 px-2 lg:w-[13%] whitespace-nowrap">ບາໂຄດ / ໝວດໝູ່</th>
              <th className="py-2.5 px-2 lg:w-[13%] text-right whitespace-nowrap">ສະຕັອກຄົງເຫຼືອ</th>
              <th className="py-2.5 px-2 lg:w-[19%] whitespace-nowrap">ວັນໝົດອາຍຸໃກ້ສຸດ</th>
              <th className="py-2.5 px-2 lg:w-[13%] text-right whitespace-nowrap">ຕົ້ນທຶນ / ມູນຄ່າລວມ</th>
              <th className="py-2.5 px-2.5 lg:w-[17%] text-center whitespace-nowrap">ຈັດການສາງ</th>
            </tr>
          </thead>

          <tbody ref={tbodyRef} className="divide-y divide-zinc-100">
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={6} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
            {visibleItems.map((prod) => (
              <StockOverviewRow key={prod.id} prod={prod} />
            ))}
            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={6} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

