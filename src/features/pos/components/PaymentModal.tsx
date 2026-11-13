"use client";

// ============================================================================
// Payment Modal: Lao Kip Cash Tender, Physical Kip Rounding (500₭/1,000₭),
// Split Tender (Cash + LAO QR), and Thermal Print Adapter
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Banknote,
  QrCode,
  WalletCards,
  CheckCircle,
  Printer,
  ArrowRight,
  X,
  Sparkles,
  Calculator,
} from "lucide-react";
import { formatLak, getSmartCashSuggestions } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { lo } from "@/constants/locales/lo";
import { usePosStore } from "../stores/pos.store";
import { posApi } from "../api/pos.api";
import { ThermalPrinterAdapter, ReceiptData } from "@/utils/printer.adapter";
import { DEFAULT_STORE } from "../constants/pos.constants";
import { roundToLaoKip } from "../utils/pos.util";
import { useAuth } from "@/features/auth";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { user } = useAuth();
  const cart = usePosStore((s) => s.cart);
  const cashier = usePosStore((s) => s.cashier);
  const clearCart = usePosStore((s) => s.clearCart);
  const totals = usePosStore((s) => s.totals);
  const { subtotal, totalDiscount, vatAmount, finalTotal } = totals;

  // Rounding Mode: 500 (standard), 1000, 0 (exact / no rounding)
  const [roundingStep, setRoundingStep] = useState<500 | 1000 | 0>(500);

  // Payment Tabs: cash | lao_qr | mixed (split tender)
  const [activeTab, setActiveTab] = useState<"cash" | "lao_qr" | "mixed">("cash");

  // Cash Tender State
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Mixed Tender State: cash portion & remaining QR
  const [splitCashPortion, setSplitCashPortion] = useState<number>(0);

  // Manual Cash Discount
  const [cashDiscount, setCashDiscount] = useState<number>(0);

  const [qrStatus, setQrStatus] = useState<"awaiting" | "confirmed">("awaiting");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);

  // Compute net payable total after discount and rounding
  const netTotalBeforeRounding = Math.max(0, finalTotal - cashDiscount);
  const roundedPayableTotal =
    roundingStep > 0
      ? roundToLaoKip(netTotalBeforeRounding, roundingStep as 500 | 1000)
      : netTotalBeforeRounding;
  const roundingDifference = roundedPayableTotal - netTotalBeforeRounding;

  useEffect(() => {
    if (isOpen) {
      setCashDiscount(0);
      const initialTotal =
        roundingStep > 0 ? roundToLaoKip(finalTotal, roundingStep as 500 | 1000) : finalTotal;
      setCashTendered(initialTotal);
      setSplitCashPortion(Math.floor(initialTotal / 2 / 1000) * 1000);
      setQrStatus("awaiting");
      setIsCompleted(false);
      setIsProcessing(false);
      setLastCompletedOrder(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations for Single Cash mode
  const changeDue = Math.max(0, cashTendered - roundedPayableTotal);
  const isCashSufficient = cashTendered >= roundedPayableTotal;

  // Calculations for Split / Mixed mode
  const splitQrPortion = Math.max(0, roundedPayableTotal - splitCashPortion);
  const isSplitValid =
    splitCashPortion > 0 &&
    splitQrPortion > 0 &&
    splitCashPortion < roundedPayableTotal;

  // Standard Lao physical banknote denominations
  const STANDARD_LAO_DENOMINATIONS = [20000, 50000, 100000, 200000, 500000];
  const smartSuggestions = getSmartCashSuggestions(roundedPayableTotal);

  const handleFinalizeTransaction = async (shouldPrint: boolean) => {
    setIsProcessing(true);
    try {
      const orderId = crypto.randomUUID();
      const orderNumber = `INV-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

      const activeCashierName = user?.full_name_lo || cashier.name;
      const activeCashierId = user?.id || cashier.id;
      const activeStoreId = user?.store_id || DEFAULT_STORE.id;

      // Determine payment method and cash/change values
      let finalPaymentMethod: "cash" | "lao_qr" | "mixed" = activeTab;
      let finalCashTendered = roundedPayableTotal;
      let finalChangeAmount = 0;
      let orderNotes: string | undefined = undefined;

      if (activeTab === "cash") {
        finalCashTendered = cashTendered;
        finalChangeAmount = changeDue;
        if (roundingDifference !== 0) {
          orderNotes = `Lao Kip Rounding: ${roundingDifference > 0 ? "+" : ""}${roundingDifference} LAK`;
        }
      } else if (activeTab === "lao_qr") {
        finalCashTendered = roundedPayableTotal;
        finalChangeAmount = 0;
      } else if (activeTab === "mixed") {
        finalCashTendered = splitCashPortion;
        finalChangeAmount = 0;
        orderNotes = `Mixed Tender: Cash ${formatLak(splitCashPortion)} + LAO QR ${formatLak(splitQrPortion)}`;
      }

      const orderPayload = {
        id: orderId,
        store_id: activeStoreId,
        shift_id: cashier.shiftNumber,
        cashier_id: activeCashierId,
        cashier_name: activeCashierName,
        order_number: orderNumber,
        subtotal,
        discount_amount: totalDiscount + cashDiscount,
        vat_amount: vatAmount,
        final_total: roundedPayableTotal,
        payment_method: finalPaymentMethod,
        cash_tendered: finalCashTendered,
        change_amount: finalChangeAmount,
        status: "completed" as const,
        offline_created_at: nowIso,
        notes: orderNotes,
        items: cart.map((item) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          batch_id: item.allocatedBatch?.id,
          unit_name: item.selectedUnit.unit_name,
          conversion_rate: item.selectedUnit.conversion_rate,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          subtotal_price: item.subtotalPrice,
          discount_amount: item.discountAmount,
          total_price: item.totalPrice,
        })),
      };

      // Submit via atomic RPC or offline sync engine
      await posApi.submitOrder(orderPayload);

      setLastCompletedOrder(orderPayload);
      setIsCompleted(true);

      // Print thermal receipt if requested
      if (shouldPrint) {
        const receiptData: ReceiptData = {
          orderNumber,
          dateTime: new Date().toLocaleString("en-GB"),
          cashierName: activeCashierName,
          items: cart.map((item) => ({
            name: item.name,
            unitName: item.selectedUnit.unit_name,
            qty: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          subtotal,
          discountAmount: totalDiscount + cashDiscount,
          vatAmount,
          finalTotal: roundedPayableTotal,
          paymentMethod: activeTab,
          cashTendered: finalCashTendered,
          changeAmount: finalChangeAmount,
          storeName: user?.store_name_lo || DEFAULT_STORE.name_lo,
          storeBranch: user?.store_branch || DEFAULT_STORE.branch,
          storeTel: DEFAULT_STORE.phone,
          storeTaxCode: DEFAULT_STORE.taxCode,
        };
        await ThermalPrinterAdapter.printReceipt(receiptData);
      }

      // Deduct batch inventory in memory & clear active cart
      usePosStore.getState().deductCartInventory(cart);
      clearCart();
      onPaymentSuccess?.();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {lo.payment.modalTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {user?.store_name_lo || DEFAULT_STORE.name_lo} • {cashier.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isCompleted ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-600/20">
              <CheckCircle className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                {lo.payment.paymentSuccess}
              </h3>
              <p className="text-xs text-slate-500 font-mono font-bold">
                ເລກທີບິນ: {lastCompletedOrder?.order_number}
              </p>
            </div>

            {/* Final Total Paid Display */}
            <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-200 w-full text-center">
              <span className="text-xs text-emerald-800 font-bold block">
                ຍອດຊຳລະເງິນທັງໝົດ
              </span>
              <div className="text-3xl font-black text-emerald-900 tabular-nums mt-1">
                {formatLak(lastCompletedOrder?.final_total || 0)}
              </div>
            </div>

            {/* Change Due Display */}
            {lastCompletedOrder?.payment_method === "cash" && (lastCompletedOrder?.change_amount > 0) && (
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 w-full text-center">
                <span className="text-xs text-slate-500 font-bold block">
                  {lo.payment.cashChange}
                </span>
                <div className="text-2xl font-black text-slate-900 tabular-nums mt-0.5 text-emerald-700">
                  {formatLak(lastCompletedOrder.change_amount)}
                </div>
              </div>
            )}

            {/* Split breakdown confirmation */}
            {lastCompletedOrder?.payment_method === "mixed" && (
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 w-full text-xs space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>ເງິນສົດ:</span>
                  <span className="font-bold text-slate-900">{formatLak(lastCompletedOrder.cash_tendered)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>ໂອນ LAO QR:</span>
                  <span className="font-bold text-emerald-700">{formatLak((lastCompletedOrder.final_total || 0) - (lastCompletedOrder.cash_tendered || 0))}</span>
                </div>
              </div>
            )}

            <div className="flex w-full gap-2.5 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!lastCompletedOrder) return;
                  const activeCashierName = user?.full_name_lo || cashier.name;
                  const receiptData: ReceiptData = {
                    orderNumber: lastCompletedOrder.order_number,
                    dateTime: new Date(lastCompletedOrder.offline_created_at || Date.now()).toLocaleString("en-GB"),
                    cashierName: activeCashierName,
                    items: (lastCompletedOrder.items || []).map((item: any) => ({
                      name: item.product_name,
                      unitName: item.unit_name,
                      qty: item.quantity,
                      unitPrice: item.unit_price,
                      totalPrice: item.total_price,
                    })),
                    subtotal: lastCompletedOrder.subtotal,
                    discountAmount: lastCompletedOrder.discount_amount,
                    vatAmount: lastCompletedOrder.vat_amount,
                    finalTotal: lastCompletedOrder.final_total,
                    paymentMethod: lastCompletedOrder.payment_method,
                    cashTendered: lastCompletedOrder.cash_tendered,
                    changeAmount: lastCompletedOrder.change_amount,
                    storeName: user?.store_name_lo || DEFAULT_STORE.name_lo,
                    storeBranch: user?.store_branch || DEFAULT_STORE.branch,
                    storeTel: DEFAULT_STORE.phone,
                    storeTaxCode: DEFAULT_STORE.taxCode,
                  };
                  await ThermalPrinterAdapter.printReceipt(receiptData);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>ພິມບິນອີກຄັ້ງ</span>
              </button>

              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              >
                ປິດ (ຂາຍລາຍການຕໍ່ໄປ)
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Total Due Banner with Kip Rounding Indicator */}
            <div className="my-3.5 rounded-2xl bg-emerald-50/90 p-3.5 border border-emerald-100 text-center">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 px-1">
                <span>{lo.payment.totalDue}</span>
                {roundingDifference !== 0 && (
                  <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded">
                    ປັດເສດ: {roundingDifference > 0 ? "+" : ""}{formatLak(roundingDifference)}
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 tabular-nums mt-0.5">
                {formatLak(roundedPayableTotal)}
              </div>
            </div>

            {/* Rounding Step Selector Pills */}
            <div className="mb-3 flex items-center justify-between gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-500 pl-1.5 flex items-center gap-1">
                <Calculator className="h-3 w-3 text-emerald-600" />
                <span>ປັດເສດເງິນກີບ:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRoundingStep(500)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    roundingStep === 500
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  500 ₭ (ມາດຕະຖານ)
                </button>
                <button
                  type="button"
                  onClick={() => setRoundingStep(1000)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    roundingStep === 1000
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  1,000 ₭
                </button>
                <button
                  type="button"
                  onClick={() => setRoundingStep(0)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    roundingStep === 0
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ບໍ່ປັດ
                </button>
              </div>
            </div>

            {/* Optional Manual Cash Discount Input */}
            <div className="mb-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-900">
                  ສ່ວນຫຼຸດເງິນສົດພິເສດ (Cash Discount):
                </span>
                {cashDiscount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCashDiscount(0);
                      const newPayable = roundingStep > 0 ? roundToLaoKip(finalTotal, roundingStep as 500 | 1000) : finalTotal;
                      setCashTendered(newPayable);
                    }}
                    className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    ຍົກເລີກສ່ວນຫຼຸດ
                  </button>
                )}
              </div>
              <KipCurrencyInput
                value={cashDiscount}
                onValueChange={(val) => {
                  setCashDiscount(val);
                  const newNet = Math.max(0, finalTotal - val);
                  const newPayable = roundingStep > 0 ? roundToLaoKip(newNet, roundingStep as 500 | 1000) : newNet;
                  setCashTendered(newPayable);
                }}
                placeholder="0"
                className="h-8 text-xs font-bold text-emerald-800"
              />
            </div>
            {/* 3 Payment Tabs: Cash | LAO QR | Mixed Split */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("cash")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "cash"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span>{lo.payment.methodCash}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("lao_qr")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "lao_qr"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>LAO QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mixed")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "mixed"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <WalletCards className="h-4 w-4" />
                <span>ຈ່າຍຮ່ວມ (ສົດ+QR)</span>
              </button>
            </div>

            {/* TAB 1: CASH ONLY */}
            {activeTab === "cash" && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lo.payment.cashTendered}
                  </label>
                  <KipCurrencyInput
                    value={cashTendered}
                    onValueChange={(val) => setCashTendered(val)}
                    autoFocus
                    className="h-12 text-2xl font-black text-right text-slate-900 border-2 border-emerald-500/80 shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Fast Denomination Buttons: Exact, 20k, 50k, 100k, 200k, 500k */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    ເລືອກດ່ວນຕາມໃບເງິນ (Fast Denominations):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {/* Exact Cash Button */}
                    <button
                      type="button"
                      onClick={() => setCashTendered(roundedPayableTotal)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        cashTendered === roundedPayableTotal
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      }`}
                    >
                      ພໍດີ ({formatLak(roundedPayableTotal)})
                    </button>

                    {/* Standard Lao Banknotes */}
                    {STANDARD_LAO_DENOMINATIONS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashTendered(amount)}
                        className={`rounded-xl px-2 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          cashTendered === amount
                            ? "bg-slate-800 text-white shadow-2xs"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {formatLak(amount)}
                      </button>
                    ))}

                    {/* Smart Suggested amounts */}
                    {smartSuggestions
                      .filter((s) => !STANDARD_LAO_DENOMINATIONS.includes(s) && s !== roundedPayableTotal)
                      .slice(0, 2)
                      .map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setCashTendered(amount)}
                          className="rounded-xl px-2 py-1.5 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          {formatLak(amount)}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {lo.payment.cashChange}:
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-extrabold tabular-nums ${
                      isCashSufficient ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {isCashSufficient ? formatLak(changeDue) : lo.payment.notEnoughCash}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: FULL LAO QR / BCEL ONE */}
            {activeTab === "lao_qr" && (
              <div className="flex flex-col items-center justify-center p-3.5 border border-dashed border-slate-300 rounded-2xl bg-slate-50/70 text-center">
                <div className="mb-2 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  LAO QR - LAPNet Standard (BCEL OnePay / LDB / JDB)
                </div>

                <div className="relative flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-200 my-1">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-slate-900 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          i % 2 === 0 || i % 5 === 0 ? "bg-white" : "bg-slate-900"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg bg-white px-2 py-1 text-[11px] font-black text-emerald-700 shadow-md border border-emerald-200">
                      BCEL One
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-800 mt-1">
                  ຍອດໂອນ: <span className="text-emerald-700 text-sm">{formatLak(roundedPayableTotal)}</span>
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-600">
                  {qrStatus === "awaiting" ? (
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      {lo.payment.qrAwaiting}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle className="h-4 w-4" />
                      {lo.payment.qrSuccess}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setQrStatus("confirmed")}
                  className="mt-2 text-xs text-emerald-700 underline font-semibold cursor-pointer"
                >
                  [ຈຳລອງ] ກົດເພື່ອຢືນຢັນການໂອນເງິນ
                </button>
              </div>
            )}

            {/* TAB 3: SPLIT TENDER (CASH + LAO QR) */}
            {activeTab === "mixed" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-medium">
                  💡 ລູກຄ້າຈ່າຍເງິນສົດບາງສ່ວນ ແລະ ສ່ວນທີ່ເຫຼືອໂອນຜ່ານ LAO QR
                </div>

                {/* Cash Portion Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    1. ສ່ວນຮັບເງິນສົດ (Cash Received):
                  </label>
                  <KipCurrencyInput
                    value={splitCashPortion}
                    onValueChange={(val) => setSplitCashPortion(val)}
                    className="h-10 text-base font-extrabold text-right text-slate-900"
                  />
                  {/* Quick Preset Buttons for Split */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSplitCashPortion(amt)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          splitCashPortion === amt
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {formatLak(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remaining QR Portion */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      2. ສ່ວນທີ່ເຫຼືອໂອນ LAO QR (Transfer QR):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      (ລວມທັງໝົດ: {formatLak(roundedPayableTotal)})
                    </span>
                  </div>
                  <KipCurrencyInput
                    value={splitQrPortion}
                    onValueChange={(val) => {
                      const newCash = Math.max(0, roundedPayableTotal - val);
                      setSplitCashPortion(newCash);
                    }}
                    className="h-10 text-base font-extrabold text-right text-emerald-800 border-emerald-400 bg-emerald-50/30"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons: Print Receipt or Complete Directly */}
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeTransaction(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>{lo.payment.printReceipt}</span>
              </button>

              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeTransaction(false)}
                className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <span>{lo.payment.completeWithoutPrint}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
