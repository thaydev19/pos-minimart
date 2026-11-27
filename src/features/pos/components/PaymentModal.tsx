"use client";

// ============================================================================
// Payment Modal: Lao Kip Cash Tender, Split Tender (Cash + LAO QR),
// and Thermal Print Adapter
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
  AlertTriangle,
  Database,
  WifiOff,
} from "lucide-react";
import { formatLak, getSmartCashSuggestions } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { lo } from "@/constants/locales/lo";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateProductsAndInventory, invalidateOrders } from "@/constants/queryKeys";
import { usePosStore } from "../stores/pos.store";
import { posApi } from "../api/pos.api";
import { ThermalPrinterAdapter, ReceiptData } from "@/utils/printer.adapter";
import { HardwareService } from "../services/hardware.service";
import { TouchNumpad } from "./TouchNumpad";
import { triggerHapticFeedback } from "@/utils/haptics";
import { DEFAULT_STORE } from "../constants/pos.constants";
import { useAuth } from "@/features/auth";
import { useShiftStore } from "@/features/shifts";
import {
  CustomerPaymentMethod,
  updatePaymentMethodOnCustomerDisplay,
  closePaymentOnCustomerDisplay,
  completePaymentOnCustomerDisplay,
} from "../utils/customerDisplaySync";

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
  const { isOnline } = useOnlineStatus();
  const queryClient = useQueryClient();
  const activeShift = useShiftStore((s) => s.activeShift);
  const cart = usePosStore((s) => s.cart);
  const cashier = usePosStore((s) => s.cashier);
  const clearCart = usePosStore((s) => s.clearCart);
  const totals = usePosStore((s) => s.totals);
  const { subtotal, totalDiscount, vatAmount, finalTotal } = totals;

  // Payment Tabs: cash | lao_qr | mixed (split tender)
  const [activeTab, setActiveTab] = useState<"cash" | "lao_qr" | "mixed">("cash");

  // Cash Tender State
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Mixed Tender State: cash portion & remaining QR
  const [splitCashPortion, setSplitCashPortion] = useState<number>(0);

  // Manual Cash Discount & Active Numpad Target
  const [cashDiscount, setCashDiscount] = useState<number>(0);
  const [numpadTarget, setNumpadTarget] = useState<"cash" | "discount">("cash");

  const [qrStatus, setQrStatus] = useState<"awaiting" | "confirmed">("awaiting");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(5);

  // Compute net payable total after special discount
  const roundedPayableTotal = Math.max(0, finalTotal - cashDiscount);

  const handleDiscountChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, finalTotal));
    setCashDiscount(clamped);
    const newPayable = Math.max(0, finalTotal - clamped);
    setCashTendered(newPayable);
  };

  useEffect(() => {
    if (isOpen) {
      // Anti-fraud: mark that this cart has attempted checkout
      usePosStore.getState().setAttemptedCheckout(true);

      setCashDiscount(0);
      setNumpadTarget("cash");
      setCashTendered(finalTotal);
      setSplitCashPortion(Math.floor(finalTotal / 2 / 1000) * 1000);
      setQrStatus("awaiting");
      setIsCompleted(false);
      setIsProcessing(false);
      setLastCompletedOrder(null);
      setAutoCloseSeconds(5);
    }
  }, [isOpen]);

  // Fast Next-Customer Auto-Close Countdown (5 seconds)
  useEffect(() => {
    if (!isCompleted) return;

    setAutoCloseSeconds(5);
    const interval = setInterval(() => {
      setAutoCloseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted]);

  // Safely close modal outside setState updater when countdown reaches 0
  useEffect(() => {
    if (isCompleted && autoCloseSeconds === 0) {
      onClose();
    }
  }, [isCompleted, autoCloseSeconds, onClose]);

  const handleCloseModal = () => {
    if (!isCompleted) {
      closePaymentOnCustomerDisplay();
    }
    onClose();
  };

  // Synchronize state with Customer Display (Unified State Machine)
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const method: CustomerPaymentMethod =
      activeTab === "lao_qr" ? "QR" : activeTab === "mixed" ? "SPLIT" : "CASH";

    const qrAmount =
      activeTab === "lao_qr"
        ? roundedPayableTotal
        : activeTab === "mixed"
        ? Math.max(0, roundedPayableTotal - splitCashPortion)
        : 0;

    const cashReceived =
      activeTab === "cash"
        ? cashTendered
        : activeTab === "mixed"
        ? splitCashPortion
        : 0;

    const changeAmount =
      activeTab === "cash"
        ? Math.max(0, cashTendered - roundedPayableTotal)
        : 0;

    updatePaymentMethodOnCustomerDisplay({
      isOpen: true,
      method,
      qrPayload: "/QR.png",
      qrAmount,
      cashReceived,
      changeAmount,
      totalAmount: roundedPayableTotal,
    });
  }, [
    isOpen,
    isCompleted,
    activeTab,
    roundedPayableTotal,
    cashTendered,
    splitCashPortion,
  ]);

  // Modal Keyboard Shortcuts: Enter, F9, Space, Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Success state: Enter, Space, Escape to close immediately
      if (isCompleted) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      // 2. Active checkout state
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseModal();
        return;
      }

      const isSufficient = cashTendered >= roundedPayableTotal;
      const splitValid =
        splitCashPortion > 0 &&
        roundedPayableTotal - splitCashPortion > 0 &&
        splitCashPortion < roundedPayableTotal;

      const canSubmit =
        !isProcessing &&
        ((activeTab === "cash" && isSufficient) ||
          activeTab === "lao_qr" ||
          (activeTab === "mixed" && splitValid));

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (canSubmit) {
          handleFinalizeTransaction(true);
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        e.stopPropagation();
        if (canSubmit) {
          handleFinalizeTransaction(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isCompleted,
    isProcessing,
    activeTab,
    cashTendered,
    roundedPayableTotal,
    splitCashPortion,
    onClose,
  ]);

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
        shift_id: activeShift?.id || undefined,
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

      setLastCompletedOrder({
        ...orderPayload,
        isOfflineOrder: !isOnline || (typeof navigator !== "undefined" && !navigator.onLine),
      });
      setIsCompleted(true);

      // Open cash drawer immediately if cash is involved and autoOpenDrawer is enabled
      const hwSettings = HardwareService.getSettings();
      if (
        hwSettings.autoOpenDrawer &&
        (finalPaymentMethod === "cash" || finalPaymentMethod === "mixed")
      ) {
        HardwareService.openCashDrawer().catch(() => {});
      }

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
        await HardwareService.printReceipt(receiptData, { skipDrawerKick: true });
      }

      // Deduct batch inventory in memory & clear active cart
      usePosStore.getState().deductCartInventory(cart);

      const customerPaymentMethod: CustomerPaymentMethod =
        finalPaymentMethod === "lao_qr"
          ? "QR"
          : finalPaymentMethod === "mixed"
          ? "SPLIT"
          : "CASH";

      // Broadcast STEP 4 (SUCCESS) to customer display (auto resets to IDLE after 4s)
      completePaymentOnCustomerDisplay({
        totalAmount: roundedPayableTotal,
        cashReceived: finalCashTendered,
        changeAmount: finalChangeAmount,
        paymentMethod: customerPaymentMethod,
      });

      clearCart();

      // Invalidate products, inventory, and orders caches across backoffice
      invalidateProductsAndInventory(queryClient).catch(() => {});
      invalidateOrders(queryClient).catch(() => {});

      onPaymentSuccess?.();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`w-full rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden ${
          isCompleted ? "max-w-lg" : "max-w-4xl"
        }`}
      >
        {/* Fixed Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {lo.payment.modalTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {user?.store_name_lo || DEFAULT_STORE.name_lo} • {user?.full_name_lo || cashier.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isCompleted ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
              <div className="pt-1">
                {lastCompletedOrder?.isOfflineOrder ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 text-xs font-bold">
                    <Database className="h-3.5 w-3.5 text-amber-600" />
                    <span>ບັນທຶກອອບລາຍໃນເຄື່ອງແລ້ວ (ລໍຖ້າຊິ້ງ)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ຊິ້ງຂຶ້ນ Cloud ຮຽບຮ້ອຍ</span>
                  </span>
                )}
              </div>
            </div>

            {/* 1. Final Total Paid Display */}
            <div className="rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-200 w-full text-center">
              <span className="text-xs text-emerald-800 font-bold block">
                ຍອດຊຳລະເງິນທັງໝົດ
              </span>
              <div className="text-3xl font-black text-emerald-900 tabular-nums mt-0.5">
                {formatLak(lastCompletedOrder?.final_total || 0)}
              </div>
            </div>

            {/* 2. Tendered Amount + Method Breakdown */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 w-full text-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">ຮູບແບບການຊຳລະ:</span>
                <span className="font-bold text-slate-900">
                  {lastCompletedOrder?.payment_method === "cash"
                    ? "ເງິນສົດ (Cash)"
                    : lastCompletedOrder?.payment_method === "lao_qr"
                    ? "ໂອນ LAO QR (BCEL One)"
                    : "ຈ່າຍຮ່ວມ (ສົດ + LAO QR)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">ເງິນທີ່ຮັບມາ:</span>
                <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                  {lastCompletedOrder?.payment_method === "cash"
                    ? formatLak(lastCompletedOrder?.cash_tendered || 0)
                    : lastCompletedOrder?.payment_method === "lao_qr"
                    ? formatLak(lastCompletedOrder?.final_total || 0)
                    : `${formatLak(lastCompletedOrder?.cash_tendered || 0)} (ສົດ) + ${formatLak((lastCompletedOrder?.final_total || 0) - (lastCompletedOrder?.cash_tendered || 0))} (QR)`}
                </span>
              </div>
            </div>

            {/* 3. Change Due Display (Highlighted if > 0) */}
            {lastCompletedOrder?.change_amount > 0 && (
              <div className="w-full text-center p-4 rounded-xl border border-amber-200 bg-amber-50">
                <span className="text-xs text-amber-800 font-bold block mb-1">
                  ເງິນທອນລູກຄ້າ
                </span>
                <div className="text-3xl font-black text-amber-600 tabular-nums">
                  {formatLak(lastCompletedOrder.change_amount)}
                </div>
              </div>
            )}

            {/* 4. Action Buttons & Next Customer Fast Flow */}
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
                  await HardwareService.printReceipt(receiptData, { skipDrawerKick: true });
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>ພິມບິນອີກຄັ້ງ</span>
              </button>

              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>ປິດ (ຂາຍລາຍການຕໍ່ໄປ)</span>
                <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[11px] font-mono">
                  {autoCloseSeconds}s
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              ກົດ Enter, Space ຫຼື Esc ເພື່ອປິດທັນທີ • ປິດອັດຕະໂນມັດໃນ {autoCloseSeconds}s...
            </p>
          </div>
        ) : (
          <>
            {/* Light Minimalist 2-Column Checkout Body (Cohesive White + QuickOne Emerald) */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* LEFT COLUMN: Single Unified Summary Card */}
                <div className="md:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-3">
                    {/* 1. Hero Total Due */}
                    <div className="pb-3 border-b border-slate-200/80">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>{lo.payment.totalDue}</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-emerald-700 tabular-nums tracking-tight mt-1">
                        {formatLak(roundedPayableTotal)}
                      </div>
                    </div>

                    {/* 2. Payment Method Selector */}
                    <div className="pb-3 border-b border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        ວິທີຊຳລະເງິນ
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab("cash")}
                          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-[11px] font-bold transition-all cursor-pointer border ${
                            activeTab === "cash"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Banknote className="h-4 w-4" />
                          <span>{lo.payment.methodCash}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("lao_qr")}
                          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-[11px] font-bold transition-all cursor-pointer border ${
                            activeTab === "lao_qr"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <QrCode className="h-4 w-4" />
                          <span>LAO QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("mixed")}
                          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-[11px] font-bold transition-all cursor-pointer border ${
                            activeTab === "mixed"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <WalletCards className="h-4 w-4" />
                          <span>ຈ່າຍຮ່ວມ</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. Framed Special Discount below Payment Method */}
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                      {/* Discount Row (Click to edit via Numpad) */}
                      <div
                        onClick={() => {
                          if (activeTab === "cash") setNumpadTarget("discount");
                        }}
                        className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 -mx-1 transition-colors cursor-pointer ${
                          activeTab === "cash" && numpadTarget === "discount"
                            ? "bg-amber-50/90"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-semibold ${
                              activeTab === "cash" && numpadTarget === "discount"
                                ? "text-amber-800 font-bold"
                                : "text-slate-600"
                            }`}
                          >
                            ສ່ວນຫຼຸດພິເສດ
                          </span>
                          {cashDiscount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiscountChange(0);
                              }}
                              className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                            >
                              (ລ້າງ)
                            </button>
                          )}
                        </div>
                        <div className="w-36">
                          <KipCurrencyInput
                            value={cashDiscount}
                            onFocus={() => {
                              if (activeTab === "cash") setNumpadTarget("discount");
                            }}
                            onValueChange={handleDiscountChange}
                            placeholder="0"
                            className={`h-8 text-xs font-bold text-right bg-white transition-all ${
                              activeTab === "cash" && numpadTarget === "discount"
                                ? "border-amber-400 ring-2 ring-amber-400/20 text-amber-800"
                                : "border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Change Due Indicator (Inside Unified Card) */}
                  {activeTab === "cash" && (
                    <div
                      className={`mt-1 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 ${
                        !isCashSufficient
                          ? "text-rose-600"
                          : changeDue > 0
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-600">
                        {lo.payment.cashChange}
                      </span>
                      {!isCashSufficient ? (
                        <span className="text-sm font-extrabold text-rose-600 tabular-nums">
                          ຂາດ {formatLak(roundedPayableTotal - cashTendered)}
                        </span>
                      ) : changeDue > 0 ? (
                        <span className="text-2xl font-black text-amber-600 tabular-nums">
                          {formatLak(changeDue)}
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          ພໍດີ (0 ₭)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Light Minimalist Interactive Tender Workspace */}
                <div className="md:col-span-7 flex flex-col justify-center">
                  {/* TAB 1: CASH ONLY */}
                  {activeTab === "cash" && (
                    <div className="space-y-3">
                      {/* Light Crisp Digital Readout (Supports both Cash Tendered & Cash Discount) */}
                      <div
                        onClick={() => {
                          if (numpadTarget === "discount") setNumpadTarget("cash");
                        }}
                        className={`rounded-2xl border-2 px-4 py-2.5 transition-all ${
                          numpadTarget === "discount"
                            ? "border-amber-400 bg-amber-50/40 cursor-pointer"
                            : "border-emerald-500/70 bg-emerald-50/25"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                          <span
                            className={
                              numpadTarget === "discount"
                                ? "text-amber-800"
                                : "text-slate-500"
                            }
                          >
                            {numpadTarget === "discount"
                              ? "ກຳລັງໃສ່: ສ່ວນຫຼຸດພິເສດ (Discount)"
                              : lo.payment.cashTendered}
                          </span>
                          {numpadTarget === "discount" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNumpadTarget("cash");
                              }}
                              className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              ກັບໄປໃສ່ເງິນສົດ
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              ກົດຕົວເລກ ຫຼື ພິມໄດ້ທັນທີ
                            </span>
                          )}
                        </div>
                        <KipCurrencyInput
                          value={numpadTarget === "discount" ? cashDiscount : cashTendered}
                          onValueChange={(val) => {
                            if (numpadTarget === "discount") {
                              handleDiscountChange(val);
                            } else {
                              setCashTendered(val);
                            }
                          }}
                          className="h-11 border-0 bg-transparent pl-0 pr-9 text-right text-3xl sm:text-4xl font-black text-slate-900 tabular-nums focus:ring-0"
                        />
                      </div>

                      <TouchNumpad
                        value={numpadTarget === "discount" ? cashDiscount : cashTendered}
                        onChange={(val) => {
                          if (numpadTarget === "discount") {
                            handleDiscountChange(val);
                          } else {
                            setCashTendered(val);
                          }
                        }}
                        exactAmount={
                          numpadTarget === "discount" ? undefined : roundedPayableTotal
                        }
                        onEnter={
                          numpadTarget === "discount"
                            ? () => setNumpadTarget("cash")
                            : undefined
                        }
                        showDenominations={numpadTarget === "cash"}
                      />
                    </div>
                  )}

                  {/* TAB 2: FULL LAO QR / BCEL ONE */}
                  {activeTab === "lao_qr" && (
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center">
                      {!isOnline && (
                        <div className="mb-3 w-full rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-left text-xs text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-amber-950">
                              ໂໝດອອບລາຍ: ບໍ່ມີສັນຍານອິນເຕີເນັດ
                            </div>
                            <div className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                              ກະລຸນາກວດສອບສະລິບໂອນໃນໂທລະສັບລູກຄ້າໃຫ້ລະອຽດກ່ອນກົດຢືນຢັນ.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mb-2 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        LAO QR - ສະແກນເພື່ອຊຳລະເງິນ
                      </div>

                      <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200 my-1 overflow-hidden">
                        <img
                          src="/QR.png"
                          alt="LAO QR"
                          className="h-full w-full object-contain rounded-xl"
                        />
                      </div>

                      <div className="text-sm font-bold text-slate-800 mt-2">
                        ຍອດໂອນ:{" "}
                        <span className="text-emerald-700 text-lg font-black tabular-nums">
                          {formatLak(roundedPayableTotal)}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                        ກະລຸນາກວດສອບສະລິບການໂອນເງິນກ່ອນກົດຢືນຢັນ
                      </p>
                    </div>
                  )}

                  {/* TAB 3: SPLIT TENDER (CASH + LAO QR) */}
                  {activeTab === "mixed" && (
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-medium flex items-center gap-2">
                        <WalletCards className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>ລູກຄ້າຈ່າຍເງິນສົດບາງສ່ວນ ແລະ ສ່ວນທີ່ເຫຼືອໂອນຜ່ານ LAO QR</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          1. ສ່ວນຮັບເງິນສົດ (Cash Received):
                        </label>
                        <KipCurrencyInput
                          value={splitCashPortion}
                          onValueChange={(val) => setSplitCashPortion(val)}
                          className="h-11 text-lg font-extrabold text-right text-slate-900 bg-white"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[20000, 50000, 100000, 200000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setSplitCashPortion(amt)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                splitCashPortion === amt
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {formatLak(amt)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 block">
                            2. ສ່ວນທີ່ເຫຼືອໂອນ LAO QR:
                          </label>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            ລວມ: {formatLak(roundedPayableTotal)}
                          </span>
                        </div>
                        <KipCurrencyInput
                          value={splitQrPortion}
                          onValueChange={(val) => {
                            const newCash = Math.max(0, roundedPayableTotal - val);
                            setSplitCashPortion(newCash);
                          }}
                          className="h-11 text-lg font-extrabold text-right text-emerald-800 border-emerald-400 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky / Always-Visible Footer: Checkout Buttons */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 flex gap-2.5">
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeTransaction(true)}
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>ພິມໃບບິນຮັບເງິນ (80mm)</span>
                <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                  Enter
                </span>
              </button>

              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeTransaction(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <span>ສຳເລັດ (ບໍ່ພິມໃບບິນ)</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                  F9
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
