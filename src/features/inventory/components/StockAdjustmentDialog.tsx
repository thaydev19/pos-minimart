"use client";

// ============================================================================
// StockAdjustmentDialog: Audit Count Variance & Expiry Write-Off Modal
// Logs audit trail with reasons (Damage, Breakage, Shrinkage, Physical Count)
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Save,
  Loader2,
  HelpCircle,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import { useInventoryStore } from "../stores/inventory.store";
import { useStockMutations } from "../hooks/useStockMutations";
import { ADJUSTMENT_REASONS } from "../constants/inventory.constants";
import { StockAdjustmentFormData } from "../types/inventory.types";

export function StockAdjustmentDialog() {
  const selectedBatchForAdjustment = useInventoryStore(
    (s) => s.selectedBatchForAdjustment
  );
  const closeAdjustment = useInventoryStore((s) => s.closeAdjustment);

  const { adjustStock, isSubmitting, errorMessage, clearError } =
    useStockMutations();

  const [qtyInput, setQtyInput] = useState<string>("0");
  const [selectedReason, setSelectedReason] = useState<string>(
    ADJUSTMENT_REASONS[0].label_lo
  );
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const currentBatchId = selectedBatchForAdjustment?.batch?.id;
  const currentBatchQty = selectedBatchForAdjustment?.batch?.quantity_on_hand;

  useEffect(() => {
    if (currentBatchId !== undefined && currentBatchQty !== undefined) {
      setQtyInput(String(currentBatchQty));
      setSelectedReason(ADJUSTMENT_REASONS[0].label_lo);
      setNotes("");
      setFormError(null);
      clearError();
    }
  }, [currentBatchId, currentBatchQty, clearError]);

  if (!selectedBatchForAdjustment) return null;

  const { product, batch } = selectedBatchForAdjustment;
  const parsedQty = qtyInput === "" ? 0 : Math.max(0, parseInt(qtyInput, 10) || 0);
  const difference = parsedQty - batch.quantity_on_hand;

  const handleStep = (delta: number) => {
    triggerHapticFeedback(15);
    const current = qtyInput === "" ? 0 : parseInt(qtyInput, 10) || 0;
    const next = Math.max(0, current + delta);
    setQtyInput(String(next));
    setFormError(null);
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setQtyInput("");
      setFormError(null);
      return;
    }
    const clean = raw.replace(/[^\d]/g, "");
    if (clean.length > 1 && clean.startsWith("0")) {
      setQtyInput(String(parseInt(clean, 10) || 0));
    } else {
      setQtyInput(clean);
    }
    setFormError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleStep(-1);
    }
  };

  const handleBlur = () => {
    if (qtyInput === "" || isNaN(Number(qtyInput))) {
      setQtyInput("0");
    } else {
      setQtyInput(String(Math.max(0, parseInt(qtyInput, 10))));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalQty = qtyInput === "" ? 0 : parseInt(qtyInput, 10);
    if (isNaN(finalQty) || finalQty < 0) {
      setFormError("ຈຳນວນສະຕັອກຕົວຈິງຕ້ອງເປັນຕົວເລກ ແລະ ບໍ່ສາມາດຕິດລົບໄດ້");
      return;
    }

    if (finalQty === batch.quantity_on_hand) {
      setFormError("ຈຳນວນຕົວຈິງເທົ່າກັບຈຳນວນປັດຈຸບັນ (ບໍ່ມີການປ່ຽນແປງ)");
      return;
    }

    const payload: StockAdjustmentFormData = {
      batch_id: batch.id,
      product_id: product.id,
      product_name: product.name_lo,
      batch_number: batch.batch_number,
      current_quantity: batch.quantity_on_hand,
      adjusted_quantity: finalQty,
      difference: finalQty - batch.quantity_on_hand,
      reason: selectedReason,
      notes: notes.trim() || undefined,
    };

    await adjustStock(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && closeAdjustment()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ກວດນັບ / ປັບຍອດສະຕັອກສິນຄ້າ
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {product.name_lo} (ລັອດ: {batch.batch_number})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAdjustment}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {(formError || errorMessage) && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-snug">{formError || errorMessage}</div>
            </div>
          )}

          {/* Variance Comparison Box */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-center">
            {/* Current */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                ຍອດໃນລະບົບ
              </span>
              <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                {batch.quantity_on_hand} {product.base_unit}
              </span>
            </div>

            {/* Target adjusted */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                ຍອດຕົວຈິງຫຼັງປັບ
              </span>
              <span className="text-sm font-extrabold text-emerald-800 tabular-nums">
                {parsedQty} {product.base_unit}
              </span>
            </div>

            {/* Variance Difference */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                ສ່ວນຕ່າງ (Variance)
              </span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  difference > 0
                    ? "text-emerald-700"
                    : difference < 0
                    ? "text-rose-600"
                    : "text-slate-400"
                }`}
              >
                {difference > 0 ? `+${difference}` : difference} {product.base_unit}
              </span>
            </div>
          </div>

          {/* Adjusted Quantity Input with Quick Stepper & Shortcuts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>ຈຳນວນຕົວຈິງທີ່ກວດນັບໄດ້ ({product.base_unit})</span>
              <span className="text-[10px] text-slate-400">
                ວັນໝົດອາຍຸ: {batch.expiry_date}
              </span>
            </label>

            {/* Stepper Input Row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="ຫຼຸດລົງ 1"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={qtyInput}
                onChange={handleQtyChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-lg font-black text-slate-900 text-center outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all font-mono shadow-2xs"
              />

              <button
                type="button"
                onClick={() => handleStep(1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="ເພີ່ມຂຶ້ນ 1"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Presets / Shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => handleStep(-10)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleStep(10)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setQtyInput("0");
                  setFormError(null);
                }}
                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 active:scale-95 transition-all cursor-pointer shadow-2xs ml-auto"
                title="ຕັ້ງເປັນ 0 (ສິນຄ້າໝົດ/ຂາດສາງ)"
              >
                ຕັ້ງເປັນ 0
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setQtyInput(String(batch.quantity_on_hand));
                  setFormError(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="ຄືນຄ່າເດີມ"
              >
                <RotateCcw className="h-3 w-3 text-slate-400" />
                <span>ຄືນຄ່າເດີມ</span>
              </button>
            </div>
          </div>

          {/* Adjustment Reason Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              ສາເຫດການປັບຍອດ (Audit Reason)
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r.code} value={r.label_lo}>
                  {r.label_lo} - {r.description_lo}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              ໝາຍເຫດເພີ່ມເຕີມ (Audit Notes)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ລະບຸລາຍລະອຽດ ຫຼື ຫຼັກຖານການກວດສອບ..."
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-slate-400">
              * ການປັບຍອດສະຕັອກຈະຖືກບັນທຶກລົງຕາຕະລາງ Audit Logs ອັດຕະໂນມັດເພື່ອຄວາມໂປ່ງໃສ
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={closeAdjustment}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນປັບຍອດສະຕັອກ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

