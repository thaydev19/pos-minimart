"use client";

// ============================================================================
// OrdersTable: Responsive Order History Table with Quick Print & Void
// ============================================================================

import React, { memo, useMemo } from "react";
import {
  Receipt,
  Eye,
  Printer,
  Ban,
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
import { useVirtualTableWindow } from "@/hooks/useVirtualTableWindow";

const ORDER_ROW_HEIGHT = 54;

interface OrdersTableProps {
  orders: OrderRecord[];
  isLoading: boolean;
}

const OrderTableRow = memo(function OrderTableRow({ o }: { o: OrderRecord }) {
  const statusCfg =
    ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.completed;
  const paymentCfg =
    ORDER_PAYMENT_METHODS[o.payment_method] || ORDER_PAYMENT_METHODS.cash;
  const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <tr
      onClick={() => {
        triggerHapticFeedback(20);
        useOrderStore.getState().openDetail(o);
      }}
      className={`h-[54px] hover:bg-emerald-50/60 active:bg-emerald-100/70 cursor-pointer group ${
        o.status === "cancelled" ? "bg-rose-50/20 opacity-75" : ""
      }`}
      title="ແຕະເພື່ອເບິ່ງລາຍລະອຽດບິນ & ພິມບິນຄືນ"
    >
      {/* Order Number */}
      <td className="py-2 px-4 font-mono font-semibold text-slate-900 group-hover:text-emerald-700 text-[13px] whitespace-nowrap">
        {o.order_number}
      </td>

      {/* Date & Time */}
      <td className="py-2 px-3 whitespace-nowrap">
        <div className="text-xs font-medium text-slate-700">
          {formatReceiptDateTime(o.offline_created_at)}
        </div>
      </td>

      {/* Cashier */}
      <td className="py-2 px-3 whitespace-nowrap">
        <span className="text-xs font-medium text-slate-700">
          {o.cashier_name || "ພະນັກງານເກັບເງິນ"}
        </span>
      </td>

      {/* Items Count */}
      <td className="py-2 px-3 text-center text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
        {itemCount} ລາຍການ
      </td>

      {/* Payment Method */}
      <td className="py-2 px-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${paymentCfg.badgeClass}`}
        >
          {paymentCfg.short_lo}
        </span>
      </td>

      {/* Total Amount */}
      <td className="py-2 px-3 text-right font-semibold text-slate-900 text-[13px] tabular-nums whitespace-nowrap">
        {formatLak(o.final_total)}
      </td>

      {/* Status */}
      <td className="py-2 px-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusCfg.bgClass}`}
        >
          {o.status === "completed" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          <span>{statusCfg.label_lo}</span>
        </span>
      </td>

      {/* Action Buttons */}
      <td className="py-2 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback(20);
              useOrderStore.getState().openDetail(o);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer touch-manipulation"
            title="ເບິ່ງລາຍລະອຽດບິນ"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback(30);
              useOrderStore.getState().setReprintOrder(o);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer touch-manipulation"
            title="ພິມບິນຄືນ (80mm)"
          >
            <Printer className="h-4 w-4" />
          </button>

          {o.status === "completed" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHapticFeedback(40);
                useOrderStore.getState().openVoidDialog(o);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer touch-manipulation"
              title="ຍົກເລີກບິນ ແລະ ຄືນສະຕັອກ"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const { tbodyRef, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } =
    useVirtualTableWindow(orders.length, ORDER_ROW_HEIGHT, 8);
  const visibleOrders = useMemo(
    () => orders.slice(startIndex, endIndex),
    [orders, startIndex, endIndex]
  );

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
    <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden select-none touch-manipulation">
      <div className="overflow-x-auto touch-pan-x touch-pan-y overscroll-x-contain">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-4">ເລກທີບິນ (Bill No.)</th>
              <th className="py-2.5 px-3">ເວລາຂາຍ</th>
              <th className="py-2.5 px-3">ພະນັກງານ</th>
              <th className="py-2.5 px-3 text-center">ຈຳນວນລາຍການ</th>
              <th className="py-2.5 px-3">ວິທີຊຳລະ</th>
              <th className="py-2.5 px-3 text-right">ຍອດລວມ (Total)</th>
              <th className="py-2.5 px-3 text-center">ສະຖານະ</th>
              <th className="py-2.5 px-4 text-center">ຈັດການ</th>
            </tr>
          </thead>

          <tbody ref={tbodyRef} className="divide-y divide-zinc-100">
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={8} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
            {visibleOrders.map((o) => (
              <OrderTableRow key={o.id} o={o} />
            ))}
            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={8} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

