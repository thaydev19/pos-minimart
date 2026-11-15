"use client";

// ============================================================================
// Receipt80mmTemplate: Standard 80mm Thermal Receipt Layout for Printing
// Supports POS Checkout Instant Print & Order History Reprint
// ============================================================================

import React from "react";
import { OrderRecord } from "../types/order.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import { ORDER_PAYMENT_METHODS } from "../constants/order.constants";

interface Receipt80mmTemplateProps {
  order: OrderRecord;
  className?: string;
}

export function Receipt80mmTemplate({
  order,
  className = "",
}: Receipt80mmTemplateProps) {
  const methodLabel =
    ORDER_PAYMENT_METHODS[order.payment_method]?.label_lo || order.payment_method;

  return (
    <div
      className={`receipt-80mm font-sans text-slate-900 w-full bg-white rounded-xl px-4 py-3.5 shadow-xs h-auto mx-auto select-none border border-slate-200/80 ${className}`}
    >
      {/* 1. Store Header */}
      <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
        <h2 className="font-bold text-[15px] uppercase tracking-tight text-slate-900 leading-tight">
          {DEFAULT_STORE.name_lo}
        </h2>
        <div className="text-[11px] text-slate-500 leading-snug space-y-0.5">
          <p className="font-medium text-slate-600">{DEFAULT_STORE.name_en}</p>
          <p className="text-slate-600">{DEFAULT_STORE.branch}</p>
          <p className="font-mono text-slate-600">ໂທ: {DEFAULT_STORE.phone}</p>
          {DEFAULT_STORE.taxCode && (
            <p className="text-[10px] text-slate-500 font-mono">
              ເລກປະຈຳຕົວ: {DEFAULT_STORE.taxCode}
            </p>
          )}
        </div>
      </div>

      {/* 2. Order Metadata */}
      <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-600 shrink-0">ເລກທີບິນ:</span>
          <span className="font-bold font-mono text-slate-900 text-xs shrink-0">{order.order_number}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ວັນທີ & ເວລາ:</span>
          <span className="font-medium text-slate-800 shrink-0">{formatReceiptDateTime(order.offline_created_at)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ພະນັກງານຂາຍ:</span>
          <span className="font-semibold text-slate-800 shrink-0">{order.cashier_name || "ພະນັກງານເກັບເງິນ"}</span>
        </div>
        {order.status === "cancelled" && (
          <div className="mt-1 bg-rose-600 text-white text-center font-bold text-[11px] py-0.5 rounded-md">
            *** ບິນນີ້ຖືກຍົກເລີກແລ້ວ (VOIDED) ***
          </div>
        )}
      </div>

      {/* 3. Items List */}
      <div className="py-2 border-b border-dashed border-slate-300">
        <div className="flex justify-between font-bold pb-1 border-b border-dashed border-slate-200 text-slate-600 text-[11px]">
          <span className="w-1/2">ລາຍການ</span>
          <span className="w-1/4 text-center">ຈຳນວນ</span>
          <span className="w-1/4 text-right">ລວມ (₭)</span>
        </div>

        <div className="divide-y divide-dashed divide-slate-100 py-1 space-y-1.5">
          {(order.items || []).map((item, idx) => (
            <div key={item.id || idx} className="pt-1.5">
              <div className="font-semibold text-[12px] text-slate-900 leading-tight break-words">
                {item.product_name}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600 tabular-nums leading-tight mt-0.5">
                <span>
                  {item.quantity} {item.unit_name} x {formatLak(item.unit_price, false)}
                </span>
                <span className="font-semibold text-[11px] text-slate-900 shrink-0">
                  {formatLak(item.total_price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Financial Totals */}
      <div className="py-1.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between text-slate-600">
          <span className="shrink-0">ລວມເງິນສິນຄ້າ (Subtotal):</span>
          <span className="tabular-nums font-semibold text-slate-900 shrink-0">{formatLak(order.subtotal)}</span>
        </div>

        {order.discount_amount > 0 && (
          <div className="flex justify-between text-rose-600 font-medium">
            <span className="shrink-0">ສ່ວນຫຼຸດ (Discount):</span>
            <span className="tabular-nums font-semibold shrink-0">-{formatLak(order.discount_amount)}</span>
          </div>
        )}

        {order.vat_amount > 0 && (
          <div className="flex justify-between text-slate-600">
            <span className="shrink-0">ອາກອນ (VAT 7%):</span>
            <span className="tabular-nums font-semibold text-slate-900 shrink-0">{formatLak(order.vat_amount)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline font-extrabold text-[14px] pt-1.5 border-t border-slate-900 text-slate-900">
          <span className="shrink-0">ຍອດລວມທັງໝົດ:</span>
          <span className="tabular-nums font-black text-[15px] text-slate-900 shrink-0">{formatLak(order.final_total)}</span>
        </div>
      </div>

      {/* 5. Payment Details */}
      <div className="py-1.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 shrink-0">ວິທີຊຳລະເງິນ:</span>
          <span className="font-bold text-slate-800 shrink-0">{methodLabel}</span>
        </div>

        {order.payment_method === "cash" && (
          <>
            <div className="flex justify-between items-center text-slate-600">
              <span className="shrink-0">ຮັບເງິນສົດມາ:</span>
              <span className="tabular-nums font-semibold text-slate-900 shrink-0">{formatLak(order.cash_tendered)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-slate-900">
              <span className="shrink-0">ເງິນທອນ:</span>
              <span className="tabular-nums text-emerald-700 font-extrabold text-xs shrink-0">{formatLak(order.change_amount)}</span>
            </div>
          </>
        )}
      </div>

      {/* 6. Thank You Footer */}
      <div className="text-center pt-2 space-y-0.5">
        <p className="font-bold text-[11px] text-slate-800">ຂໍຂອບໃຈທີ່ອຸດໜູນ</p>
        <p className="text-[10px] text-slate-500">
          ສິນຄ້າຊື້ແລ້ວ ກະລຸນາກວດສອບກ່ອນອອກຈາກຮ້ານ
        </p>
        <p className="text-[9px] text-slate-400 font-sans mt-1">
          ລະບົບຂາຍໜ້າຮ້ານ Lao Minimart POS Cloud
        </p>
      </div>
    </div>
  );
}

