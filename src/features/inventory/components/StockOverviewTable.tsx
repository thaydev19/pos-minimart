"use client";

// ============================================================================
// StockOverviewTable: Inventory Table with FEFO Expiry Tracking & Quick Actions
// ============================================================================

import React from "react";
import {
  Boxes,
  Plus,
  Layers,
  ClipboardList,
  Scale,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";
import { InventoryProductItem } from "../types/inventory.types";
import { useInventoryStore } from "../stores/inventory.store";
import { formatStockDisplay } from "../utils/inventory.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { ExpiryBadge } from "./ExpiryBadge";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";

interface StockOverviewTableProps {
  items: InventoryProductItem[];
  isLoading: boolean;
}

export function StockOverviewTable({ items, isLoading }: StockOverviewTableProps) {
  const openStockIn = useInventoryStore((s) => s.openStockIn);
  const openBatchDetail = useInventoryStore((s) => s.openBatchDetail);
  const openAdjustment = useInventoryStore((s) => s.openAdjustment);

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
          onClick={() => openStockIn()}
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>ນຳເຂົ້າສິນຄ້າໃໝ່ (Stock In)</span>
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
              <th className="py-3 px-3">ບາໂຄດ / ໝວດໝູ່</th>
              <th className="py-3 px-3 text-right">ສະຕັອກຄົງເຫຼືອ</th>
              <th className="py-3 px-3">ວັນໝົດອາຍຸໃກ້ສຸດ (Expiry & Status)</th>
              <th className="py-3 px-3 text-right">ຕົ້ນທຶນ / ມູນຄ່າລວມ</th>
              <th className="py-3 px-4 text-center">ຈັດການສາງ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {items.map((prod) => {
              const activeBatches = prod.batches.filter((b) => b.quantity_on_hand > 0);
              const nextBatch = prod.fefo_next_batch;
              const formattedStock = formatStockDisplay(
                prod.total_stock,
                prod.base_unit,
                prod.units
              );

              return (
                <tr
                  key={prod.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* 1. Product Name & Image */}
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
                  <td className="py-2.5 px-3">
                    <div className="font-mono font-bold text-slate-700 text-xs">
                      {prod.barcode}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {prod.category_name || "ທົ່ວໄປ"}
                    </div>
                  </td>

                  {/* 3. Total Stock (Unified Base Unit Only) */}
                  <td className="py-2.5 px-3 text-right">
                    <div
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold tabular-nums ${
                        prod.total_stock <= 5
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : prod.total_stock <= 10
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-900 border border-slate-200/60"
                      }`}
                    >
                      {/* <Boxes className="h-3.5 w-3.5 shrink-0" /> */}
                      <span>
                        {prod.total_stock} {prod.base_unit}
                      </span>
                    </div>

                    <div className="text-[10.5px] text-slate-400 mt-0.5">
                      ມີ {activeBatches.length} ລັອດໃນສາງ
                    </div>
                  </td>

                  {/* 4. Nearest FEFO Expiry (Date DD/MM/YYYY + Status Badge, No LOT-... text) */}
                  <td className="py-2.5 px-3">
                    {nextBatch && nextBatch.expiry_date ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900 text-xs tabular-nums">
                            {(() => {
                              const parts = nextBatch.expiry_date.split("-");
                              if (parts.length === 3) {
                                return `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                              return nextBatch.expiry_date;
                            })()}
                          </span>
                          <ExpiryBadge
                            expiryDate={nextBatch.expiry_date}
                            daysUntilExpiry={nextBatch.days_until_expiry}
                            status={nextBatch.status}
                          />
                        </div>
                        <div className="text-xs text-zinc-500 font-medium">
                          ລັອດນີ້ເຫຼືອ: {nextBatch.quantity_on_hand} {prod.base_unit}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                        ບໍ່ມີວັນໝົດອາຍຸ
                      </span>
                    )}
                  </td>

                  {/* 5. Cost & Inventory Value */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-extrabold text-slate-900 tabular-nums">
                      {formatLak(prod.total_cost_value)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                      ທຶນ: {formatLak(prod.latest_cost_price, false)}/{prod.base_unit}
                    </div>
                  </td>

                  {/* 6. Quick Action Buttons */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Stock in quick button */}
                      <button
                        type="button"
                        onClick={() => openStockIn(prod.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                        title="ນຳເຂົ້າສິນຄ້າລັອດໃໝ່"
                      >
                        <Plus className="h-3 w-3" />
                        <span>ນຳເຂົ້າ</span>
                      </button>

                      {/* Batches view button */}
                      <button
                        type="button"
                        onClick={() => openBatchDetail(prod)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        title="ເບິ່ງລາຍລະອຽດທຸກລັອດ (FEFO)"
                      >
                        <Layers className="h-3 w-3" />
                        <span>ລັອດ ({activeBatches.length})</span>
                      </button>

                      {/* Audit / Count adjustment button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (nextBatch) {
                            openAdjustment(prod, nextBatch);
                          } else {
                            openBatchDetail(prod);
                          }
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                        title="ກວດນັບ / ປັບຍອດສະຕັອກ"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
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

