"use client";

// ============================================================================
// OrderDetailDrawer: Slide-over Drawer for Order Breakdown & Thermal Print
// ============================================================================

import React from "react";
import {
  X,
  Receipt,
  Printer,
  Ban,
  Clock,
  User,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useOrderStore } from "../stores/order.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
} from "../constants/order.constants";
import { Receipt80mmTemplate } from "./Receipt80mmTemplate";

export function OrderDetailDrawer() {
  const selectedOrder = useOrderStore((s) => s.selectedOrderForDetail);
  const closeDetail = useOrderStore((s) => s.closeDetail);
  const openVoidDialog = useOrderStore((s) => s.openVoidDialog);
  const setReprintOrder = useOrderStore((s) => s.setReprintOrder);

  if (!selectedOrder) return null;

  const statusCfg =
    ORDER_STATUS_CONFIG[selectedOrder.status] || ORDER_STATUS_CONFIG.completed;
  const paymentCfg =
    ORDER_PAYMENT_METHODS[selectedOrder.payment_method] || ORDER_PAYMENT_METHODS.cash;

  const handlePrint = () => {
    setReprintOrder(selectedOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeDetail}
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                ລາຍລະອຽດບິນ #{selectedOrder.order_number}
              </h3>
              <p className="text-[10px] text-slate-500">
                {formatReceiptDateTime(selectedOrder.offline_created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDetail}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Order Status Banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">ສະຖານະບິນ:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border mt-0.5 ${statusCfg.bgClass}`}
              >
                {selectedOrder.status === "completed" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                <span>{statusCfg.label_lo}</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">ພະນັກງານ:</span>
              <span className="text-xs font-bold text-slate-800">
                {selectedOrder.cashier_name || "ພະນັກງານເກັບເງິນ"}
              </span>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              ລາຍການສິນຄ້າ ({selectedOrder.items?.length || 0} ລາຍການ)
            </h4>

            <div className="rounded-2xl border border-zinc-200/90 divide-y divide-zinc-100 bg-white shadow-2xs overflow-hidden">
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 leading-tight">
                      {item.product_name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {item.quantity} {item.unit_name} x {formatLak(item.unit_price, false)} ₭
                      {item.conversion_rate > 1 && ` (x${item.conversion_rate})`}
                    </div>
                  </div>

                  <div className="text-right font-extrabold text-slate-900 tabular-nums">
                    {formatLak(item.total_price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 space-y-2 text-xs shadow-2xs">
            <div className="flex justify-between text-slate-600">
              <span>ລວມມູນຄ່າສິນຄ້າ:</span>
              <span className="font-bold tabular-nums">
                {formatLak(selectedOrder.subtotal)}
              </span>
            </div>

            {selectedOrder.discount_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ສ່ວນຫຼຸດ:</span>
                <span className="font-bold tabular-nums text-rose-600">
                  -{formatLak(selectedOrder.discount_amount)}
                </span>
              </div>
            )}

            {selectedOrder.vat_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ອາກອນ (VAT):</span>
                <span className="font-bold tabular-nums">
                  {formatLak(selectedOrder.vat_amount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-zinc-100 font-extrabold text-slate-900 text-sm">
              <span>ຍອດລວມທັງໝົດ:</span>
              <span className="text-emerald-700 tabular-nums">
                {formatLak(selectedOrder.final_total)}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-between text-xs text-slate-500">
              <span>ວິທີຊຳລະເງິນ:</span>
              <span className="font-bold text-slate-800">{paymentCfg.label_lo}</span>
            </div>

            {selectedOrder.payment_method === "cash" && (
              <>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ເງິນຮັບມາ:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {formatLak(selectedOrder.cash_tendered)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ເງິນທອນ:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {formatLak(selectedOrder.change_amount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {selectedOrder.notes && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-line border border-slate-200/80">
              <span className="font-bold block mb-0.5">ໝາຍເຫດບິນ:</span>
              {selectedOrder.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/70 p-4">
          <div>
            {selectedOrder.status === "completed" && (
              <button
                type="button"
                onClick={() => openVoidDialog(selectedOrder)}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>ຍົກເລີກບິນນີ້</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>ພິມບິນຄືນ (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

