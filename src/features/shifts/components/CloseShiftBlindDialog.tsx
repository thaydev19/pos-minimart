"use client";

// ============================================================================
// CloseShiftBlindDialog: Blind Cash Drawer Count & Reconciliation Report
// Denomination Counter (100k - 1k Kip) + 80mm Shift Closing Summary Print
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Lock,
  Coins,
  Calculator,
  Save,
  Loader2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileCheck,
} from "lucide-react";
import { useShiftStore } from "../stores/shift.store";
import { useShiftMutations } from "../hooks/useShiftMutations";
import { LAO_KIP_DENOMINATIONS } from "../constants/shift.constants";
import {
  CashDenominationCount,
  ShiftClosingSummary,
} from "../types/shift.types";
import {
  getInitialDenominationCounts,
  calculateDenominationsTotal,
} from "../utils/shift.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { useAuth } from "@/features/auth";

export function CloseShiftBlindDialog() {
  const { user } = useAuth();
  const isCloseShiftModalOpen = useShiftStore((s) => s.isCloseShiftModalOpen);
  const closeCloseShiftModal = useShiftStore((s) => s.closeCloseShiftModal);
  const activeShift = useShiftStore((s) => s.activeShift);
  const lastClosingSummary = useShiftStore((s) => s.lastClosingSummary);
  const setLastClosingSummary = useShiftStore((s) => s.setLastClosingSummary);

  const { closeShiftBlind, isSubmitting, errorMessage } = useShiftMutations();

  // Denominations count
  const [counts, setCounts] = useState<CashDenominationCount>(
    getInitialDenominationCounts()
  );
  const [manualCashTotal, setManualCashTotal] = useState<number | null>(null);
  const [transferSales, setTransferSales] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Result state
  const [summaryResult, setSummaryResult] = useState<ShiftClosingSummary | null>(null);

  if (!isCloseShiftModalOpen) return null;

  const totalCountedCash = calculateDenominationsTotal(counts);
  const effectiveActualCash =
    manualCashTotal !== null ? manualCashTotal : totalCountedCash;

  const handleCountChange = (denom: number, value: string) => {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    setCounts((prev) => ({ ...prev, [denom]: qty }));
  };

  const handleQuickAdd = (denom: number, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta),
    }));
  };

  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeShift) {
      setFormError("ບໍ່ພົບຂໍ້ມູນກະທີ່ກຳລັງເປີດຢູ່");
      return;
    }

    const summary = await closeShiftBlind({
      shift_id: activeShift.id,
      counts,
      transfer_sales_entered: transferSales,
      actual_cash_entered: effectiveActualCash,
      notes: notes.trim() || undefined,
    });

    if (summary) {
      setSummaryResult(summary);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinish = () => {
    setSummaryResult(null);
    setLastClosingSummary(null);
    closeCloseShiftModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && handleFinish()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                {summaryResult
                  ? "ໃບສະຫຼຸບປິດກະຂາຍເຄື່ອງ (Shift Report)"
                  : "ປິດກະຂາຍເຄື່ອງ (Blind Close Reconciliation)"}
              </h3>
              <p className="text-[10px] text-slate-500">
                {summaryResult
                  ? "ກວດສອບ ແລະ ພິມໃບສະຫຼຸບກະ"
                  : "ນັບເງິນສົດຕົວຈິງໃນເກ໊ະ (ເຊື່ອງຍອດຂາຍເພື່ອຄວາມໂປ່ງໃສ)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        {summaryResult ? (
          // ==================================================================
          // VIEW 2: POST-CLOSING RECONCILIATION SUMMARY & PRINT
          // ==================================================================
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Reconciliation Banner */}
            <div
              className={`rounded-2xl border p-4 text-center ${
                summaryResult.discrepancy === 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : summaryResult.discrepancy > 0
                  ? "bg-amber-50 border-amber-300 text-amber-950"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1 font-bold text-xs">
                {summaryResult.discrepancy === 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>ຍອດເງິນສົດກົງກັນພໍດີ (Balanced)</span>
                  </>
                ) : summaryResult.discrepancy > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>ຍອດເງິນສົດເກີນ (Cash Surplus)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>ຍອດເງິນສົດຂາດ (Cash Shortage)</span>
                  </>
                )}
              </div>

              <div
                className={`text-2xl font-extrabold tabular-nums ${
                  summaryResult.discrepancy === 0
                    ? "text-emerald-700"
                    : summaryResult.discrepancy > 0
                    ? "text-amber-700"
                    : "text-rose-600"
                }`}
              >
                {summaryResult.discrepancy > 0 ? "+" : ""}
                {formatLak(summaryResult.discrepancy)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                ສ່ວນຕ່າງ: ເງິນນັບໄດ້ຕົວຈິງ ທຽບກັບ ເງິນທີ່ລະບົບຄຳນວນໄດ້
              </p>
            </div>

            {/* Reconciliation Breakdown Card */}
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-zinc-100">
                <span>ເງິນທອນເລີ່ມຕົ້ນ (Opening Cash):</span>
                <span className="font-extrabold text-slate-800 tabular-nums">
                  {formatLak(summaryResult.opening_cash)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-zinc-100">
                <span>ຍອດຂາຍເງິນສົດໃນກະ (Cash Sales):</span>
                <span className="font-extrabold text-emerald-700 tabular-nums">
                  +{formatLak(summaryResult.cash_sales)}
                </span>
              </div>

              <div className="flex justify-between items-center font-bold text-slate-900 bg-slate-50 p-2 rounded-xl">
                <span>ເງິນສົດທີ່ຄວນມີໃນເກ໊ະ (Expected Cash):</span>
                <span className="font-extrabold tabular-nums text-sm">
                  {formatLak(summaryResult.expected_cash)}
                </span>
              </div>

              <div className="flex justify-between items-center font-bold text-slate-900 bg-emerald-50/50 p-2 rounded-xl border border-emerald-200/60">
                <span>ເງິນສົດຕົວຈິງທີ່ນັບໄດ້ (Actual Counted):</span>
                <span className="font-extrabold tabular-nums text-sm text-emerald-900">
                  {formatLak(summaryResult.actual_cash)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500 pt-1">
                <span>ຍອດໂອນ LAO QR (Transfer Sales):</span>
                <span className="font-bold text-slate-700 tabular-nums">
                  {formatLak(summaryResult.transfer_sales)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>ຈຳນວນບິນທີ່ຂາຍໄດ້ທັງໝົດ:</span>
                <span className="font-bold text-slate-700 tabular-nums">
                  {summaryResult.order_count} ບິນ
                </span>
              </div>
            </div>

            {/* 80mm Printable Receipt Container (Hidden on screen, rendered on print) */}
            <div className="hidden print:block font-sans text-slate-900 text-xs space-y-1">
              <div className="text-center pb-2 border-b border-black">
                <div className="font-bold text-sm">{user?.store_name_lo || DEFAULT_STORE.name_lo}</div>
                <div>{user?.store_branch || DEFAULT_STORE.branch}</div>
                <div className="font-bold mt-1">ໃບສະຫຼຸບປິດກະຂາຍເຄື່ອງ (SHIFT REPORT)</div>
                <div>ພະນັກງານ: {user?.full_name_lo || activeShift?.cashier_name || DEFAULT_CASHIER.name}</div>
                <div>ວັນທີ: {new Date(summaryResult.closed_at).toLocaleString()}</div>
              </div>

              <div className="py-2 border-b border-black space-y-1">
                <div className="flex justify-between">
                  <span>ເງິນເລີ່ມຕົ້ນ:</span>
                  <span>{formatLak(summaryResult.opening_cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ຍອດຂາຍເງິນສົດ:</span>
                  <span>{formatLak(summaryResult.cash_sales)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>ເງິນຄວນມີ:</span>
                  <span>{formatLak(summaryResult.expected_cash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>ເງິນນັບໄດ້:</span>
                  <span>{formatLak(summaryResult.actual_cash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>ສ່ວນຕ່າງ:</span>
                  <span>{formatLak(summaryResult.discrepancy)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ຍອດໂອນ QR:</span>
                  <span>{formatLak(summaryResult.transfer_sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ຈຳນວນບິນ:</span>
                  <span>{summaryResult.order_count}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <div>ລາຍເຊັນພະນັກງານ: ........................</div>
                <div>ລາຍເຊັນຜູ້ຈັດການ: ........................</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-4 w-4" />
                <span>ພິມໃບສະຫຼຸບກະ (80mm)</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>ສຳເລັດ</span>
              </button>
            </div>
          </div>
        ) : (
          // ==================================================================
          // VIEW 1: BLIND COUNTING ENTRY FORM
          // ==================================================================
          <form onSubmit={handleSubmitClose} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Notice */}
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200/90 p-3 text-xs text-slate-600">
              <Calculator className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
              <div className="leading-snug">
                <strong>ກົດລະບຽບ Blind Close:</strong> ກະລຸນານັບຈຳນວນໃບເງິນແຕ່ລະໃບໃນເກ໊ະຕົວຈິງ.
                ລະບົບຈະເຊື່ອງຍອດຂາຍຈົນກວ່າທ່ານຈະກົດຢືນຢັນເພື່ອປ້ອງກັນການດັດແປງຕົວເລກ.
              </div>
            </div>

            {(formError || errorMessage) && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1 leading-snug">{formError || errorMessage}</div>
              </div>
            )}

            {/* Denomination Counter Table */}
            <div className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden shadow-2xs">
              <div className="bg-slate-50/80 px-3.5 py-2 border-b border-zinc-200/80 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                <span>ໃບເງິນກີບ (Denomination)</span>
                <span>ຈຳນວນໃບ</span>
                <span className="text-right">ມູນຄ່າລວມ (₭)</span>
              </div>

              <div className="divide-y divide-zinc-100 p-1">
                {LAO_KIP_DENOMINATIONS.map((denom) => {
                  const qty = counts[denom] || 0;
                  const lineTotal = denom * qty;

                  return (
                    <div
                      key={denom}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors"
                    >
                      {/* Face value */}
                      <div className="w-24 shrink-0 font-bold text-slate-800 text-xs">
                        {formatLak(denom, false)} ₭
                      </div>

                      {/* Quantity counter input */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(denom, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={qty || ""}
                          onChange={(e) => handleCountChange(denom, e.target.value)}
                          placeholder="0"
                          className="h-7 w-16 rounded-md border border-slate-200 text-center font-extrabold text-xs text-slate-900 outline-none focus:border-emerald-600"
                        />

                        <button
                          type="button"
                          onClick={() => handleQuickAdd(denom, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-28 text-right font-extrabold text-slate-900 tabular-nums text-xs">
                        {formatLak(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Physical Cash Count Banner & Direct Entry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-700" />
                  <span className="text-xs font-extrabold text-emerald-950">
                    ຍອດເງິນສົດນັບໄດ້ຕົວຈິງ (Actual Cash):
                  </span>
                </div>
                <div className="text-lg font-extrabold text-emerald-900 tabular-nums">
                  {formatLak(effectiveActualCash)}
                </div>
              </div>

              {/* Direct Cash Input Override */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    ຫຼື ປ້ອນຍອດເງິນສົດລວມໂດຍກົງ (Direct Entry):
                  </label>
                  {manualCashTotal !== null && (
                    <button
                      type="button"
                      onClick={() => setManualCashTotal(null)}
                      className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      ໃຊ້ຍອດນັບຕາມໃບເງິນ
                    </button>
                  )}
                </div>
                <KipCurrencyInput
                  value={effectiveActualCash}
                  onValueChange={(val) => setManualCashTotal(val)}
                  placeholder="0"
                  className="h-9 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Transfer check input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-slate-500" />
                <span>ຍອດໂອນ LAO QR ທີ່ກວດສອບໃນແອັບທະນາຄານ (₭ - ທາງເລືອກ):</span>
              </label>
              <KipCurrencyInput
                value={transferSales}
                onValueChange={(val) => setTransferSales(val)}
                placeholder="0"
                className="h-9 text-xs font-bold text-slate-900"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                ໝາຍເຫດປິດກະ (Audit Notes)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ເຊັ່ນ: ເງິນທອນພໍດີ, ມອບເງິນສົດໃຫ້ຜູ້ຈັດການ..."
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={closeCloseShiftModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleSubmitClose}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSubmitting ? "ກຳລັງປະມວນຜົນ..." : "ຢືນຢັນປິດກະ ແລະ ເບິ່ງຜົນ"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
