"use client";

// ============================================================================
// CloseShiftBlindDialog: Blind Cash Drawer Count & Reconciliation Report
// 2-Column Denominations (100k - 500 Kip) + Direct Cash Entry Mode
// Compact UI for 1366x768 POS Displays + 80mm Z-Report Thermal Slip Print
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
  TrendingUp,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { useShiftStore } from "../stores/shift.store";
import { useShiftMutations } from "../hooks/useShiftMutations";
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
import { ShiftZReport80mmTemplate } from "./ShiftZReport80mmTemplate";

const LEFT_DENOMINATIONS = [100000, 50000, 20000, 10000] as const;
const RIGHT_DENOMINATIONS = [5000, 2000, 1000, 500] as const;

type EntryMode = "denominations" | "direct";

export function CloseShiftBlindDialog() {
  const isCloseShiftModalOpen = useShiftStore((s) => s.isCloseShiftModalOpen);
  const closeCloseShiftModal = useShiftStore((s) => s.closeCloseShiftModal);
  const activeShift = useShiftStore((s) => s.activeShift);
  const setLastClosingSummary = useShiftStore((s) => s.setLastClosingSummary);

  const { closeShiftBlind, isSubmitting, errorMessage } = useShiftMutations();

  // Mode: counting by bills vs direct total
  const [entryMode, setEntryMode] = useState<EntryMode>("denominations");

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
    entryMode === "direct"
      ? (manualCashTotal ?? 0)
      : totalCountedCash;

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

  const handleResetCounts = () => {
    setCounts(getInitialDenominationCounts());
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

  const renderDenomRow = (denom: number) => {
    const qty = counts[denom] || 0;
    const lineTotal = denom * qty;

    return (
      <div
        key={denom}
        className="flex items-center justify-between gap-1.5 px-2 py-1 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors"
      >
        <div className="w-18 shrink-0 font-bold text-slate-800 text-xs">
          {formatLak(denom, false)} ₭
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleQuickAdd(denom, -1)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            -
          </button>

          <input
            type="number"
            min="0"
            value={qty || ""}
            onChange={(e) => handleCountChange(denom, e.target.value)}
            placeholder="0"
            className="h-6.5 w-12 rounded-lg border border-slate-200 bg-white text-center font-extrabold text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />

          <button
            type="button"
            onClick={() => handleQuickAdd(denom, 1)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            +
          </button>
        </div>

        <div className="w-20 text-right font-bold text-slate-900 tabular-nums text-xs">
          {formatLak(lineTotal)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 receipt-modal-backdrop">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && handleFinish()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 receipt-modal-card">
        {/* Header */}
        <div className="flex h-13 items-center justify-between border-b border-zinc-200/80 px-4 sm:px-5 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                {summaryResult
                  ? "ໃບສະຫຼຸບປິດກະຂາຍເຄື່ອງ (Z-Report / Shift Closing)"
                  : "ປິດກະຂາຍເຄື່ອງ (Blind Close Reconciliation)"}
              </h3>
              <p className="text-[10px] text-slate-500">
                {summaryResult
                  ? "ກວດສອບຜົນການປິດກະ ແລະ ພິມໃບສະຫຼຸບມອບເງິນ"
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
          // VIEW 2: POST-CLOSING RECONCILIATION SUMMARY & 80MM PRINT
          // ==================================================================
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 receipt-modal-body">
            {/* Reconciliation Banner */}
            <div
              className={`rounded-2xl border p-3.5 text-center ${
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
                    <span>ຍອດເງິນສົດກົງກັນພໍດີ (Balanced - ບໍ່ມີສ່ວນຕ່າງ)</span>
                  </>
                ) : summaryResult.discrepancy > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span>ຍອດເງິນສົດເກີນ (Cash Surplus - ເງິນເກີນໃນເກ໊ະ)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>ຍອດເງິນສົດຂາດ (Cash Shortage - ເງິນຂາດໃນເກ໊ະ)</span>
                  </>
                )}
              </div>

              <div
                className={`text-2xl font-black tabular-nums tracking-tight ${
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

            {/* Reconciliation Breakdown Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl border border-zinc-200 bg-slate-50/60 p-2.5">
                <span className="text-[10px] text-slate-500 block">ເງິນເລີ່ມຕົ້ນ</span>
                <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                  {formatLak(summaryResult.opening_cash)}
                </span>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5">
                <span className="text-[10px] text-emerald-700 block">ຍອດຂາຍເງິນສົດ</span>
                <span className="font-extrabold text-emerald-800 tabular-nums text-sm">
                  +{formatLak(summaryResult.cash_sales)}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-slate-50/60 p-2.5">
                <span className="text-[10px] text-slate-600 block">ເງິນຄວນມີ (Expected)</span>
                <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                  {formatLak(summaryResult.expected_cash)}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-300 bg-zinc-100/70 p-2.5">
                <span className="text-[10px] text-slate-700 font-bold block">ເງິນນັບໄດ້ (Actual)</span>
                <span className="font-black text-slate-950 tabular-nums text-sm">
                  {formatLak(summaryResult.actual_cash)}
                </span>
              </div>
            </div>

            {/* Non-cash & order count summary */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>ຍອດໂອນ LAO QR (Transfer Sales):</span>
                <span className="font-extrabold text-indigo-700 tabular-nums">
                  {formatLak(summaryResult.transfer_sales)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>ລວມຍອດຂາຍທັງໝົດໃນກະ (Cash + Transfer):</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  {formatLak(summaryResult.cash_sales + summaryResult.transfer_sales)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-zinc-100">
                <span>ຈຳນວນບິນທີ່ຂາຍໄດ້ທັງໝົດ:</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {summaryResult.order_count} ບິນ
                </span>
              </div>
              {summaryResult.shift.notes && (
                <div className="flex justify-between items-center text-slate-500">
                  <span>ໝາຍເຫດປິດກະ:</span>
                  <span className="font-medium text-slate-700">{summaryResult.shift.notes}</span>
                </div>
              )}
            </div>

            {/* Printable 80mm Z-Report Container (Rendered during window.print()) */}
            <ShiftZReport80mmTemplate
              summary={summaryResult}
              className="hidden print:block"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                <span>ພິມໃບສະຫຼຸບປິດກະ (80mm)</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>ສຳເລັດ</span>
              </button>
            </div>
          </div>
        ) : (
          // ==================================================================
          // VIEW 1: COMPACT BLIND COUNTING ENTRY FORM (1366x768 OPTIMIZED)
          // ==================================================================
          <form onSubmit={handleSubmitClose} className="flex-1 overflow-y-auto p-4 space-y-3 receipt-modal-body">
            {/* Rule notice */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/90 px-3 py-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-[11px] leading-tight">
                  <strong>ກົດລະບຽບ Blind Close:</strong> ນັບເງິນສົດຕົວຈິງໃນເກ໊ະ (ເຊື່ອງຍອດຂາຍຈົນກວ່າຈະກົດຢືນຢັນ)
                </span>
              </div>
              {entryMode === "denominations" && (
                <button
                  type="button"
                  onClick={handleResetCounts}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="ລ້າງຄ່ານັບເງິນທັງໝົດເປັນ 0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>ຣີເຊັດ</span>
                </button>
              )}
            </div>

            {(formError || errorMessage) && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1 leading-snug">{formError || errorMessage}</div>
              </div>
            )}

            {/* Segmented Mode Toggle: 2 Choices */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setEntryMode("denominations")}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  entryMode === "denominations"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>ນັບຕາມໃບເງິນ (ແຍກຕາມມູນຄ່າ)</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("direct")}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  entryMode === "direct"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Coins className="h-3.5 w-3.5" />
                <span>ປ້ອນຍອດລວມໂດຍກົງ (ນັບລວມແລ້ວ)</span>
              </button>
            </div>

            {/* Mode 1: Denominations 2-Column Grid */}
            {entryMode === "denominations" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {/* Left Column: 100k, 50k, 20k, 10k */}
                  <div className="space-y-1.5">
                    {LEFT_DENOMINATIONS.map((d) => renderDenomRow(d))}
                  </div>

                  {/* Right Column: 5k, 2k, 1k, 500 */}
                  <div className="space-y-1.5">
                    {RIGHT_DENOMINATIONS.map((d) => renderDenomRow(d))}
                  </div>
                </div>

                {/* Counted Total Banner */}
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">
                      ຍອດເງິນສົດນັບໄດ້ຕົວຈິງ (Actual Counted):
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-900 tabular-nums">
                    {formatLak(totalCountedCash)}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Direct Cash Total Input */}
            {entryMode === "direct" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1.5">
                <label className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>ປ້ອນຍອດເງິນສົດລວມຕົວຈິງໃນເກ໊ະ (Total Cash):</span>
                  <span className="text-[10px] text-emerald-700 font-normal">ປ້ອນຍອດທີ່ນັບໄດ້ຈາກພາຍນອກ</span>
                </label>
                <KipCurrencyInput
                  value={manualCashTotal ?? 0}
                  onValueChange={(val) => setManualCashTotal(val)}
                  placeholder="0"
                  className="h-10 text-base font-extrabold text-slate-900 bg-white"
                  autoFocus
                />
              </div>
            )}

            {/* Horizontal Row: QR Transfer + Notes side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Transfer Sales */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <QrCode className="h-3 w-3 text-indigo-600" />
                  <span>ຍອດໂອນ LAO QR (ແອັບທະນາຄານ):</span>
                </label>
                <KipCurrencyInput
                  value={transferSales}
                  onValueChange={(val) => setTransferSales(val)}
                  placeholder="0"
                  className="h-8.5 text-xs font-bold text-slate-900"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  ໝາຍເຫດປິດກະ (Audit Notes)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ເຊັ່ນ: ເງິນທອນຄົບ, ມອບໃຫ້ເຈົ້າຂອງຮ້ານ..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleFinish}
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
