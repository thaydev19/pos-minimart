"use client";

// ============================================================================
// OrdersTable: Responsive Order History Table with Quick Print & Void
// ============================================================================

import React from "react";
import {
  Receipt,
  Eye,
  Printer,
  Ban,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { OrderRecord } from "../types/order.types";
import { useOrderStore } from "../stores/order.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
} from "../constants/order.constants";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OrdersTableProps {
  orders: OrderRecord[];
  isLoading: boolean;
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const openDetail = useOrderStore((s) => s.openDetail);
  const openVoidDialog = useOrderStore((s) => s.openVoidDialog);
  const setReprintOrder = useOrderStore((s) => s.setReprintOrder);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">ກຳລັງໂຫຼດລາຍການບິນ...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          <Receipt className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ບໍ່ພົບລາຍການບິນ</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          ບໍ່ມີຂໍ້ມູນບິນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຊ່ວງເວລາທີ່ເລືອກ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden select-none touch-manipulation">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">ເລກທີບິນ (Bill No.)</th>
              <th className="py-3.5 px-3">ເວລາຂາຍ</th>
              <th className="py-3.5 px-3">ພະນັກງານ</th>
              <th className="py-3.5 px-3 text-center">ຈຳນວນລາຍການ</th>
              <th className="py-3.5 px-3">ວິທີຊຳລະ</th>
              <th className="py-3.5 px-3 text-right">ຍອດລວມ (Total)</th>
              <th className="py-3.5 px-3 text-center">ສະຖານະ</th>
              <th className="py-3.5 px-4 text-center">ຈັດການ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => {
              const statusCfg =
                ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.completed;
              const paymentCfg =
                ORDER_PAYMENT_METHODS[o.payment_method] || ORDER_PAYMENT_METHODS.cash;
              const itemCount = (o.items || []).reduce(
                (sum, i) => sum + i.quantity,
                0
              );

              return (
                <tr
                  key={o.id}
                  onClick={() => {
                    triggerHapticFeedback(20);
                    openDetail(o);
                  }}
                  className={`hover:bg-emerald-50/60 active:bg-emerald-100/70 active:scale-[0.99] transition-all cursor-pointer group ${
                    o.status === "cancelled" ? "bg-rose-50/20 opacity-75" : ""
                  }`}
                  title="ແຕະເພື່ອເບິ່ງລາຍລະອຽດບິນ & ພິມບິນຄືນ"
                >
                  {/* Order Number */}
                  <td className="py-4 px-4 font-mono font-black text-slate-900 group-hover:text-emerald-700 text-xs sm:text-sm">
                    {o.order_number}
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-3">
                    <div className="font-semibold text-slate-800">
                      {formatReceiptDateTime(o.offline_created_at)}
                    </div>
                  </td>

                  {/* Cashier */}
                  <td className="py-4 px-3">
                    <span className="font-semibold text-slate-700">
                      {o.cashier_name || "ພະນັກງານເກັບເງິນ"}
                    </span>
                  </td>

                  {/* Items Count */}
                  <td className="py-4 px-3 text-center font-bold text-slate-800 tabular-nums">
                    {itemCount} ລາຍການ
                  </td>

                  {/* Payment Method */}
                  <td className="py-4 px-3">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold border ${paymentCfg.badgeClass}`}
                    >
                      {paymentCfg.short_lo}
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="py-4 px-3 text-right font-black text-slate-900 text-sm tabular-nums">
                    {formatLak(o.final_total)}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusCfg.bgClass}`}
                    >
                      {o.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span>{statusCfg.label_lo}</span>
                    </span>
                  </td>

                  {/* Action Buttons: Min 44x44px, gap-3 (12px), distinct colors */}
                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-3">
                      {/* View Detail */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback(20);
                          openDetail(o);
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-2xs touch-manipulation"
                        title="ເບິ່ງລາຍລະອຽດບິນ"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Print 80mm */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback(30);
                          setReprintOrder(o);
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-2xs touch-manipulation"
                        title="ພິມບິນຄືນ (80mm)"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      {/* Void Order */}
                      {o.status === "completed" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback(40);
                            openVoidDialog(o);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer shadow-2xs touch-manipulation"
                          title="ຍົກເລີກບິນ ແລະ ຄືນສະຕັອກ"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

