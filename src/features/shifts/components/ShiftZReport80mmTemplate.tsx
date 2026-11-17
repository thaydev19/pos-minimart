"use client";

// ============================================================================
// ShiftZReport80mmTemplate: Standard 80mm POS Thermal Z-Report Receipt Slip
// Pure CSS print optimization compatible with 80mm thermal receipt printers
// ============================================================================

import React from "react";
import { ShiftClosingSummary } from "../types/shift.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatShiftDuration } from "../utils/shift.util";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { LAO_KIP_DENOMINATIONS } from "../constants/shift.constants";

interface ShiftZReport80mmTemplateProps {
  summary: ShiftClosingSummary;
  className?: string;
}

export function ShiftZReport80mmTemplate({
  summary,
  className = "",
}: ShiftZReport80mmTemplateProps) {
  const duration = formatShiftDuration(
    summary.shift.opening_time,
    summary.closed_at
  );

  const totalSales = summary.cash_sales + summary.transfer_sales;
  const countedDenoms = LAO_KIP_DENOMINATIONS.filter(
    (d) => (summary.counts[d] || 0) > 0
  );

  return (
    <div
      className={`receipt-80mm font-sans text-slate-900 w-full bg-white rounded-xl px-4 py-3 shadow-xs h-auto mx-auto select-none border border-slate-200/80 ${className}`}
    >
      {/* 1. Store Header */}
      <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
        <h2 className="font-extrabold text-[15px] uppercase tracking-tight text-slate-900 leading-tight">
          {DEFAULT_STORE.name_lo}
        </h2>
        <div className="text-[11px] text-slate-600 leading-snug space-y-0.5">
          <p>{DEFAULT_STORE.branch}</p>
          <p className="font-mono">ໂທ: {DEFAULT_STORE.phone}</p>
        </div>
        <div className="pt-1">
          <div className="inline-block bg-slate-900 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider">
            ໃບສະຫຼຸບປິດກະຂາຍເຄື່ອງ (Z-REPORT)
          </div>
        </div>
      </div>

      {/* 2. Shift Metadata */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 shrink-0">ລະຫັດກະ:</span>
          <span className="font-bold font-mono text-slate-900 shrink-0">
            #{summary.shift.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ພະນັກງານ:</span>
          <span className="font-bold text-slate-900 shrink-0">
            {summary.shift.cashier_name || DEFAULT_CASHIER.name}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ເວລາເປີດກະ:</span>
          <span className="font-medium text-slate-800 shrink-0">
            {new Date(summary.shift.opening_time).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ເວລາປິດກະ:</span>
          <span className="font-medium text-slate-800 shrink-0">
            {new Date(summary.closed_at).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ໄລຍະເວລາຂາຍ:</span>
          <span className="font-bold text-slate-900 shrink-0">{duration}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="shrink-0">ຈຳນວນບິນທີ່ຂາຍ:</span>
          <span className="font-bold text-slate-900 shrink-0">
            {summary.order_count} ບິນ
          </span>
        </div>
      </div>

      {/* 3. Cash Reconciliation Breakdown */}
      <div className="py-2 border-b border-dashed border-slate-400 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-700">
          <span>ເງິນທອນເລີ່ມຕົ້ນ:</span>
          <span className="font-bold tabular-nums text-slate-900">
            {formatLak(summary.opening_cash)}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-700">
          <span>ຍອດຂາຍເງິນສົດ:</span>
          <span className="font-bold tabular-nums text-emerald-800">
            +{formatLak(summary.cash_sales)}
          </span>
        </div>

        <div className="flex justify-between items-center font-bold text-slate-900 pt-0.5">
          <span>ເງິນສົດຄວນມີ (Expected):</span>
          <span className="font-extrabold tabular-nums">
            {formatLak(summary.expected_cash)}
          </span>
        </div>

        <div className="flex justify-between items-center font-bold text-slate-900 border-t border-dotted border-slate-300 pt-1">
          <span>ເງິນສົດຕົວຈິງ (Actual):</span>
          <span className="font-extrabold tabular-nums text-[13px]">
            {formatLak(summary.actual_cash)}
          </span>
        </div>

        {/* Discrepancy */}
        <div className="flex justify-between items-center font-extrabold pt-1">
          <span>ສ່ວນຕ່າງ (Variance):</span>
          <span
            className={`tabular-nums ${
              summary.discrepancy === 0
                ? "text-emerald-800"
                : summary.discrepancy > 0
                ? "text-blue-800"
                : "text-rose-700"
            }`}
          >
            {summary.discrepancy > 0 ? `+${formatLak(summary.discrepancy)}` : formatLak(summary.discrepancy)}
            {" "}
            <span className="text-[10px] font-medium">
              {summary.discrepancy === 0
                ? "(ພໍດີ)"
                : summary.discrepancy > 0
                ? "(ເກີນ)"
                : "(ຂາດ)"}
            </span>
          </span>
        </div>
      </div>

      {/* 4. Non-Cash & Total Revenue Summary */}
      <div className="py-2 border-b border-dashed border-slate-400 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-700">
          <span>ຍອດໂອນ LAO QR:</span>
          <span className="font-bold tabular-nums text-indigo-800">
            {formatLak(summary.transfer_sales)}
          </span>
        </div>

        <div className="flex justify-between items-center font-extrabold text-slate-950 pt-0.5">
          <span>ລວມຍອດຂາຍທັງໝົດ:</span>
          <span className="font-black tabular-nums text-[13px]">
            {formatLak(totalSales)}
          </span>
        </div>
      </div>

      {/* 5. Physical Denomination Counts (if counted) */}
      {countedDenoms.length > 0 && (
        <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
          <div className="font-bold text-slate-700 text-[10px] uppercase pb-0.5">
            ລາຍລະອຽດການນັບໃບເງິນກີບ:
          </div>
          {countedDenoms.map((d) => {
            const count = summary.counts[d] || 0;
            const subtotal = d * count;
            return (
              <div key={d} className="flex justify-between text-slate-600">
                <span>{formatLak(d, false)} ₭ x {count} ໃບ:</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {formatLak(subtotal)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Notes if any */}
      {summary.shift.notes && (
        <div className="py-1.5 border-b border-dashed border-slate-400 text-[11px] text-slate-600">
          <span className="font-bold text-slate-800">ໝາຍເຫດ: </span>
          <span>{summary.shift.notes}</span>
        </div>
      )}

      {/* 7. Signatures */}
      <div className="pt-3 pb-1 text-[11px] text-slate-700 space-y-5">
        <div className="flex justify-between items-end">
          <div className="text-center w-1/2">
            <div className="h-8"></div>
            <div className="border-t border-slate-400 pt-1 mx-2">
              <span className="font-semibold">ລາຍເຊັນພະນັກງານ</span>
            </div>
          </div>
          <div className="text-center w-1/2">
            <div className="h-8"></div>
            <div className="border-t border-slate-400 pt-1 mx-2">
              <span className="font-semibold">ຜູ້ກວດສອບ / ຜູ້ຈັດການ</span>
            </div>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-400 font-mono">
          ພິມເມື່ອ: {new Date().toLocaleString()} | QuickOne POS
        </div>
      </div>
    </div>
  );
}
