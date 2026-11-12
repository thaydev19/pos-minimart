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
      className={`receipt-80mm font-sans text-slate-900 text-xs p-4 bg-white max-w-[320px] mx-auto select-none ${className}`}
      style={{ width: "80mm" }}
    >
      {/* 1. Store Header */}
      <div className="text-center pb-2.5 border-b border-dashed border-slate-400 space-y-0.5">
        <h2 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
          {DEFAULT_STORE.name_lo}
        </h2>
        <p className="text-[10px] font-semibold text-slate-500">{DEFAULT_STORE.name_en}</p>
        <p className="text-[10px] text-slate-600">{DEFAULT_STORE.branch}</p>
        <p className="text-[10px] text-slate-600">ໂທ: {DEFAULT_STORE.phone}</p>
        {DEFAULT_STORE.taxCode && (
          <p className="text-[9px] text-slate-500">ເລກປະຈຳຕົວຜູ້ເສຍພາສີ: {DEFAULT_STORE.taxCode}</p>
        )}
      </div>

      {/* 2. Order Metadata */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
        <div className="flex justify-between">
          <span className="font-bold text-slate-700">ເລກທີບິນ:</span>
          <span className="font-bold font-mono text-slate-900">{order.order_number}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>ວັນທີ & ເວລາ:</span>
          <span>{formatReceiptDateTime(order.offline_created_at)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>ພະນັກງານຂາຍ:</span>
          <span className="font-semibold text-slate-800">{order.cashier_name || "ພະນັກງານເກັບເງິນ"}</span>
        </div>
        {order.status === "cancelled" && (
          <div className="mt-1 bg-rose-600 text-white text-center font-bold text-[10px] py-0.5 rounded">
            *** ບິນນີ້ຖືກຍົກເລີກແລ້ວ (VOIDED) ***
          </div>
        )}
      </div>

      {/* 3. Items List */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[10px]">
        <div className="flex justify-between font-bold pb-1 border-b border-dashed border-slate-300 text-slate-700">
          <span className="w-1/2">ລາຍການ</span>
          <span className="w-1/4 text-center">ຈຳນວນ</span>
          <span className="w-1/4 text-right">ລວມ (₭)</span>
        </div>

        <div className="divide-y divide-dashed divide-slate-100 py-1 space-y-1.5">
          {(order.items || []).map((item, idx) => (
            <div key={item.id || idx} className="pt-1 space-y-0.5">
              <div className="font-bold text-slate-900 truncate leading-tight">{item.product_name}</div>
              <div className="flex justify-between text-slate-500 text-[9px] tabular-nums">
                <span>
                  {item.quantity} {item.unit_name} x {formatLak(item.unit_price, false)}
                </span>
                <span className="font-bold text-slate-900">
                  {formatLak(item.total_price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Financial Totals */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
        <div className="flex justify-between text-slate-600">
          <span>ລວມເງິນສິນຄ້າ (Subtotal):</span>
          <span className="tabular-nums font-semibold">{formatLak(order.subtotal)}</span>
        </div>

        {order.discount_amount > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>ສ່ວນຫຼຸດ (Discount):</span>
            <span className="tabular-nums font-semibold">-{formatLak(order.discount_amount)}</span>
          </div>
        )}

        {order.vat_amount > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>ອາກອນ (VAT 7%):</span>
            <span className="tabular-nums font-semibold">{formatLak(order.vat_amount)}</span>
          </div>
        )}

        <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-slate-800 text-slate-900">
          <span>ຍອດລວມທັງໝົດ:</span>
          <span className="tabular-nums">{formatLak(order.final_total)}</span>
        </div>
      </div>

      {/* 5. Payment Details */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-600">ວິທີຊຳລະເງິນ:</span>
          <span className="font-bold text-slate-800">{methodLabel}</span>
        </div>

        {order.payment_method === "cash" && (
          <>
            <div className="flex justify-between text-slate-600">
              <span>ຮັບເງິນສົດມາ:</span>
              <span className="tabular-nums font-semibold">{formatLak(order.cash_tendered)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>ເງິນທອນ:</span>
              <span className="tabular-nums text-emerald-700">{formatLak(order.change_amount)}</span>
            </div>
          </>
        )}
      </div>

      {/* 6. Thank You Footer */}
      <div className="text-center pt-3 space-y-1">
        <p className="font-bold text-[11px] text-slate-800">ຂໍຂອບໃຈທີ່ອຸດໜູນ</p>
        <p className="text-[9px] text-slate-500">
          ສິນຄ້າຊື້ແລ້ວ ກະລຸນາກວດສອບກ່ອນອອກຈາກຮ້ານ
        </p>
        <p className="text-[8px] text-slate-400 font-sans mt-2">
          ລະບົບຂາຍໜ້າຮ້ານ Lao Minimart POS Cloud
        </p>
      </div>
    </div>
  );
}

