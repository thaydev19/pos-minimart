"use client";

// ============================================================================
// OpenShiftDialog: Starting Float Cash Registration Modal
// ============================================================================

import React, { useState } from "react";
import { X, Coins, Sparkles, Save, Loader2, AlertCircle } from "lucide-react";
import { useShiftStore } from "../stores/shift.store";
import { useShiftMutations } from "../hooks/useShiftMutations";
import { STARTING_CASH_PRESETS } from "../constants/shift.constants";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";

export function OpenShiftDialog() {
  const isOpenShiftModalOpen = useShiftStore((s) => s.isOpenShiftModalOpen);
  const closeOpenShiftModal = useShiftStore((s) => s.closeOpenShiftModal);
  const activeShift = useShiftStore((s) => s.activeShift);
  const { openShift, isSubmitting, errorMessage, clearError } = useShiftMutations();

  const [openingCash, setOpeningCash] = useState<number>(500000);
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpenShiftModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (activeShift) {
      setFormError("ມີກະຂາຍເຄື່ອງກຳລັງເປີດຢູ່ແລ້ວ. ບໍ່ສາມາດເປີດກະຊ້ອນກັນໄດ້.");
      return;
    }

    if (openingCash < 0) {
      setFormError("ເງິນທອນເລີ່ມຕົ້ນບໍ່ສາມາດຕິດລົບໄດ້");
      return;
    }

    await openShift(openingCash, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && closeOpenShiftModal()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                ເປີດກະຂາຍເຄື່ອງໃໝ່ (Open Shift)
              </h3>
              <p className="text-[10px] text-slate-500">
                ກວດນັບ ແລະ ປ້ອນເງິນທອນເລີ່ມຕົ້ນໃນເກ໊ະ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeOpenShiftModal}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {(formError || errorMessage) && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-snug">{formError || errorMessage}</div>
            </div>
          )}

          {/* Opening Cash Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ເງິນທອນເລີ່ມຕົ້ນໃນເກ໊ະ (Opening Cash Float)
            </label>
            <KipCurrencyInput
              required
              value={openingCash}
              onValueChange={(val) => setOpeningCash(val)}
              placeholder="500.000"
              className="h-11 text-base font-extrabold text-slate-900"
            />

            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 pt-1">
              {STARTING_CASH_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setOpeningCash(amount)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                    openingCash === amount
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatLak(amount, false)} ₭
                </button>
              ))}
            </div>
          </div>

          {/* Shift Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              ໝາຍເຫດ (ທາງເລືອກ)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ເຊັ່ນ: ກະເຊົ້າ, ປ່ຽນກະກັບພະນັກງານ..."
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={closeOpenShiftModal}
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
              <span>{isSubmitting ? "ກຳລັງເປີດກະ..." : "ຢືນຢັນເປີດກະ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

