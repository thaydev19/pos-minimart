"use client";

// ============================================================================
// BatchDetailDrawer: List of All Batches for a Product in FEFO Order
// Includes Clearance Sale Toggles & Physical Adjustment Actions
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Layers,
  Calendar,
  AlertTriangle,
  Tag,
  ClipboardList,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useInventoryStore } from "../stores/inventory.store";
import { useStockMutations } from "../hooks/useStockMutations";
import { BatchDetail } from "../types/inventory.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { ExpiryBadge } from "./ExpiryBadge";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";

export function BatchDetailDrawer() {
  const selectedProduct = useInventoryStore((s) => s.selectedProductForBatchView);
  const closeBatchDetail = useInventoryStore((s) => s.closeBatchDetail);
  const openAdjustment = useInventoryStore((s) => s.openAdjustment);
  const { toggleClearance } = useStockMutations();

  // Local state for editing clearance price
  const [editingClearanceId, setEditingClearanceId] = useState<string | null>(null);
  const [clearancePriceInput, setClearancePriceInput] = useState<number>(0);

  if (!selectedProduct) return null;

  const batches = selectedProduct.batches || [];
  const activeBatches = batches.filter((b) => b.quantity_on_hand > 0);

  const handleStartClearance = (batch: BatchDetail) => {
    setEditingClearanceId(batch.id);
    setClearancePriceInput(
      batch.clearance_price || Math.round(selectedProduct.selling_price * 0.7)
    );
  };

  const handleSaveClearance = async (batchId: string) => {
    await toggleClearance(batchId, true, clearancePriceInput);
    setEditingClearanceId(null);
  };

  const handleCancelClearance = async (batchId: string) => {
    await toggleClearance(batchId, false);
    setEditingClearanceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeBatchDetail}
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ລາຍການລັອດສິນຄ້າ (FEFO Batches)
              </h3>
              <p className="text-[10px] text-slate-500">
                ຈັດລຽງຕາມວັນໝົດອາຍຸກ່ອນ (First-Expired, First-Out)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeBatchDetail}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product Overview Summary */}
        <div className="border-b border-zinc-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center gap-3">
            <ProductThumbnail
              src={selectedProduct.image_url}
              alt={selectedProduct.name_lo}
              name={selectedProduct.name_lo}
              className="h-12 w-12 rounded-xl shrink-0 border border-zinc-200/80 overflow-hidden"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
                {selectedProduct.name_lo}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                <span>ບາໂຄດ: {selectedProduct.barcode}</span>
                <span>•</span>
                <span>
                  ລາຄາຂາຍ: {formatLak(selectedProduct.selling_price)}/{selectedProduct.base_unit}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                {selectedProduct.total_stock} {selectedProduct.base_unit}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeBatches.length} ລັອດມີສະຕັອກ
              </div>
            </div>
          </div>
        </div>

        {/* Batches List in FEFO Order */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {batches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
              <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">ຍັງບໍ່ມີຂໍ້ມູນລັອດສິນຄ້າ</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ກົດປຸ່ມນຳເຂົ້າສິນຄ້າເພື່ອສ້າງລັອດທຳອິດ
              </p>
            </div>
          ) : (
            batches.map((batch, idx) => {
              const isSellingNow = idx === 0 && batch.quantity_on_hand > 0;
              const isZeroStock = batch.quantity_on_hand <= 0;

              return (
                <div
                  key={batch.id}
                  className={`rounded-2xl border p-3.5 space-y-2.5 transition-all shadow-2xs ${
                    isSellingNow
                      ? "border-emerald-300 bg-emerald-50/20 ring-2 ring-emerald-500/10"
                      : isZeroStock
                      ? "border-zinc-200/60 bg-slate-50/50 opacity-60"
                      : "border-zinc-200/90 bg-white"
                  }`}
                >
                  {/* Batch Top Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {batch.batch_number}
                      </span>
                      {isSellingNow && (
                        <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-2xs">
                          ກຳລັງຂາຍ (FEFO Next)
                        </span>
                      )}
                      {batch.is_clearance && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-2xs">
                          <Flame className="h-2.5 w-2.5" />
                          <span>ເລັ່ງຂາຍເລາະລັອດ</span>
                        </span>
                      )}
                    </div>

                    <ExpiryBadge
                      expiryDate={batch.expiry_date}
                      daysUntilExpiry={batch.days_until_expiry}
                      status={batch.status}
                    />
                  </div>

                  {/* Batch Details Grid */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ວັນໝົດອາຍຸ</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {batch.expiry_date}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">ຈຳນວນໃນສາງ</span>
                      <span className="font-extrabold text-slate-900 tabular-nums text-xs">
                        {batch.quantity_on_hand} {selectedProduct.base_unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">ລາຄາຕົ້ນທຶນ</span>
                      <span className="font-bold text-slate-700 tabular-nums text-xs">
                        {formatLak(batch.cost_price)}
                      </span>
                    </div>
                  </div>

                  {/* Clearance Sale Section */}
                  {editingClearanceId === batch.id ? (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2 text-xs">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-amber-900 block">
                          ກຳນົດລາຄາເລັ່ງຂາຍ (₭):
                        </label>
                        <KipCurrencyInput
                          value={clearancePriceInput}
                          onValueChange={(val) => setClearancePriceInput(val)}
                          className="h-7 border-amber-300 text-xs font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveClearance(batch.id)}
                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                      >
                        ບັນທຶກ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingClearanceId(null)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        ຍົກເລີກ
                      </button>
                    </div>
                  ) : batch.is_clearance ? (
                    <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200/80 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                        <Flame className="h-3.5 w-3.5" />
                        <span>
                          ລາຄາເລັ່ງຂາຍ: {formatLak(batch.clearance_price || 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelClearance(batch.id)}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        ຍົກເລີກໂປຣ
                      </button>
                    </div>
                  ) : null}

                  {/* Actions for this batch */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    {!batch.is_clearance && (
                      <button
                        type="button"
                        onClick={() => handleStartClearance(batch)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                        title="ຕັ້ງລາຄາພິເສດເພື່ອເລັ່ງຂາຍລັອດໃກ້ໝົດອາຍຸ"
                      >
                        <Tag className="h-3 w-3" />
                        <span>ເລັ່ງຂາຍ (Clearance)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openAdjustment(selectedProduct, batch)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ClipboardList className="h-3 w-3 text-slate-500" />
                      <span>ກວດນັບ / ປັບຍອດ</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

