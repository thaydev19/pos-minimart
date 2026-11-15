"use client";

// ============================================================================
// OrderDetailModal: Touch-First Modal for Order Details & 80mm Reprint / Void
// Meets 100% Touchscreen Specifications (min-h-[48px], active:scale-95)
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Receipt,
  Printer,
  Ban,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Loader2,
} from "lucide-react";
import { OrderRecord } from "../types/order.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
} from "../constants/order.constants";
import { HardwareService } from "@/features/pos/services/hardware.service";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface OrderDetailModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onVoid?: (order: OrderRecord) => void;
  onReprint?: (order: OrderRecord) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onVoid,
  onReprint,
}: OrderDetailModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !order) return null;

  const statusCfg =
    ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.completed;
  const paymentCfg =
    ORDER_PAYMENT_METHODS[order.payment_method] || ORDER_PAYMENT_METHODS.cash;

  const handleReprintReceipt = async () => {
    triggerHapticFeedback(30);
    setIsPrinting(true);

    try {
      if (onReprint) {
        onReprint(order);
        setIsPrinting(false);
        return;
      }

      const receiptData = {
        orderNumber: order.order_number,
        dateTime: new Date(order.offline_created_at || Date.now()).toLocaleString("en-GB"),
        cashierName: order.cashier_name || "ພະນັກງານເກັບເງິນ",
        items: (order.items || []).map((it) => ({
          name: it.product_name || "ສິນຄ້າ",
          unitName: it.unit_name || "ອັນ",
          qty: it.quantity,
          unitPrice: it.unit_price,
          totalPrice: it.total_price,
        })),
        subtotal: order.subtotal,
        discountAmount: order.discount_amount,
        vatAmount: order.vat_amount,
        finalTotal: order.final_total,
        paymentMethod: order.payment_method,
        cashTendered: order.cash_tendered,
        changeAmount: order.change_amount,
        storeName: DEFAULT_STORE.name_lo,
        storeBranch: DEFAULT_STORE.branch,
        storeTel: DEFAULT_STORE.phone,
        storeTaxCode: DEFAULT_STORE.taxCode,
      };

      const res = await HardwareService.printReceipt(receiptData);
      if (res.success) {
        toast.success("ສັ່ງພິມບິນຄືນສຳເລັດແລ້ວ");
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການພິມບິນ");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none touch-manipulation">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {order.order_number}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusCfg.bgClass}`}
                >
                  {order.status === "completed" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  <span>{statusCfg.label_lo}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{formatReceiptDateTime(order.offline_created_at)}</span>
                <span>•</span>
                <span>{order.cashier_name || "ພະນັກງານເກັບເງິນ"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Order Items & Totals */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ລາຍການສິນຄ້າ ({order.items?.length || 0} ລາຍການ)
              </span>
              <span className="text-xs font-semibold text-slate-400">
                ຊ່ອງທາງ: <strong className="text-slate-700">{paymentCfg.label_lo}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/90 divide-y divide-slate-100 bg-white overflow-hidden shadow-2xs">
              {(order.items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-slate-900 leading-tight">
                      {item.product_name || "ສິນຄ້າ"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {item.quantity} {item.unit_name} x {formatLak(item.unit_price, false)} ₭
                      {item.conversion_rate > 1 && ` (x${item.conversion_rate})`}
                    </div>
                  </div>

                  <div className="text-right font-black text-slate-900 text-sm tabular-nums">
                    {formatLak(item.total_price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>ລວມມູນຄ່າສິນຄ້າ (Subtotal):</span>
              <span className="font-bold tabular-nums text-slate-900">
                {formatLak(order.subtotal)}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>ສ່ວນຫຼຸດ (Discount):</span>
                <span className="font-bold tabular-nums">
                  -{formatLak(order.discount_amount)}
                </span>
              </div>
            )}

            {order.vat_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ອາກອນ (VAT):</span>
                <span className="font-bold tabular-nums text-slate-900">
                  {formatLak(order.vat_amount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
              <span className="text-sm font-extrabold">ຍອດຊຳລະເງິນທັງໝົດ:</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
                {formatLak(order.final_total)}
              </span>
            </div>

            {order.payment_method === "cash" && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>ເງິນທີ່ຮັບມາ (Cash Tendered):</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatLak(order.cash_tendered)}
                  </span>
                </div>
                {order.change_amount > 0 && (
                  <div className="flex justify-between items-center rounded-xl bg-amber-50 border border-amber-200 p-2 text-amber-900 font-bold">
                    <span>ເງິນທອນລູກຄ້າ (Change Due):</span>
                    <span className="text-sm font-black text-amber-600 tabular-nums">
                      {formatLak(order.change_amount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {order.notes && (
            <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 whitespace-pre-line border border-slate-200">
              <span className="font-bold block mb-0.5 text-slate-800">ໝາຍເຫດ (Notes):</span>
              {order.notes}
            </div>
          )}
        </div>

        {/* Modal Footer: Large Touch Buttons (min-h-[48px]) */}
        <div className="flex items-center gap-2.5 border-t border-slate-200/80 bg-white p-4 sm:p-5">
          {order.status === "completed" && onVoid && (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                onVoid(order);
              }}
              className="h-12 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
            >
              <Ban className="h-4 w-4" />
              <span>ຍົກເລີກບິນ</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReprintReceipt}
            disabled={isPrinting}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            <span>ພິມບິນຄືນ / In lại (80mm)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-12 px-4 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            ປິດ
          </button>
        </div>
      </div>
    </div>
  );
}
