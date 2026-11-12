"use client";

// ============================================================================
// VoidOrderDialog: Controlled Order Cancellation with Manager PIN & Stock Restore
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Ban,
  Lock,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useOrderStore } from "../stores/order.store";
import { useOrderMutations } from "../hooks/useOrderMutations";
import { VOID_ORDER_REASONS } from "../constants/order.constants";
import { formatLak } from "@/utils/formatLakCurrency";

export function VoidOrderDialog() {
  const orderForVoid = useOrderStore((s) => s.orderForVoid);
  const closeVoidDialog = useOrderStore((s) => s.closeVoidDialog);
  const { voidOrder, isSubmitting, errorMessage, clearError } = useOrderMutations();

  const [selectedReason, setSelectedReason] = useState<string>(
    VOID_ORDER_REASONS[0].label_lo
  );
  const [managerPin, setManagerPin] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!orderForVoid) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!managerPin.trim()) {
      setFormError("ກະລຸນາປ້ອນລະຫັດ PIN ຜູ້ຈັດການເພື່ອຢືນຢັນການຍົກເລີກ");
      return;
    }

    const success = await voidOrder({
      order_id: orderForVoid.id,
      reason: selectedReason,
      manager_pin: managerPin.trim(),
      notes: notes.trim() || undefined,
    });

    if (success) {
      setManagerPin("");
      setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && closeVoidDialog()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                ຍົກເລີກບິນ #{orderForVoid.order_number}
              </h3>
              <p className="text-[10px] text-slate-500">
                ຄືນສະຕັອກສິນຄ້າທັງໝົດເຂົ້າສາງ ແລະ ບັນທຶກ Audit Log
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeVoidDialog}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
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

          {/* Warning Card */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 space-y-1 text-xs text-rose-900">
            <div className="font-bold flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
              <span>ຄຳເຕືອນການຍົກເລີກບິນ:</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              ຍອດເງິນ <strong>{formatLak(orderForVoid.final_total)}</strong> ຈະຖືກຫັກອອກຈາກຍອດຂາຍ,
              ແລະ ສິນຄ້າທັງໝົດ <strong>({orderForVoid.items?.length || 0} ລາຍການ)</strong> ຈະຖືກຄືນເຂົ້າສະຕັອກສາງຕາມລັອດເກົ່າອັດຕະໂນມັດ.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              ສາເຫດການຍົກເລີກ (Void Reason)
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
            >
              {VOID_ORDER_REASONS.map((r) => (
                <option key={r.code} value={r.label_lo}>
                  {r.label_lo} - {r.description_lo}
                </option>
              ))}
            </select>
          </div>

          {/* Manager PIN Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>ລະຫັດ PIN ຜູ້ຈັດການ (Manager PIN)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ຄ່າເລີ່ມຕົ້ນ: 1234</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="••••"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-center text-lg font-mono font-extrabold tracking-widest text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              ໝາຍເຫດເພີ່ມເຕີມ (ທາງເລືອກ)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
              className="h-8 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={closeVoidDialog}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "ກຳລັງຍົກເລີກ..." : "ຢືນຢັນຍົກເລີກບິນ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

