"use client";

// ============================================================================
// ShiftHistoryTable: Audit History of Cashier Shifts & Cash Variances
// ============================================================================

import React, { useState } from "react";
import { Clock, User, AlertCircle, CheckCircle2, History, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { ShiftItem } from "../types/shift.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatShiftDuration } from "../utils/shift.util";
import { SHIFT_STATUS_LABELS } from "../constants/shift.constants";
import { useShiftStore } from "../stores/shift.store";
import { useShiftMutations } from "../hooks/useShiftMutations";

interface ShiftHistoryTableProps {
  shifts: ShiftItem[];
  isLoading: boolean;
}

export function ShiftHistoryTable({ shifts, isLoading }: ShiftHistoryTableProps) {
  const activeShift = useShiftStore((s) => s.activeShift);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);
  const { forceCloseShift } = useShiftMutations();
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleForceClose = async (shiftId: string) => {
    if (window.confirm("ທ່ານຕ້ອງການປິດກະເກົ່າທີ່ຄ້າງນີ້ແທ້ຫຼືບໍ່?")) {
      setClosingId(shiftId);
      try {
        await forceCloseShift(shiftId, "ປິດກະເກົ່າທີ່ຄ້າງໂດຍຜູ້ໃຊ້");
      } finally {
        setClosingId(null);
      }
    }
  };
  if (isLoading && shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">ກຳລັງໂຫຼດປະຫວັດກະຂາຍເຄື່ອງ...</p>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          <History className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ບໍ່ພົບປະຫວັດກະຂາຍເຄື່ອງ</h3>
        <p className="text-xs text-slate-400 mt-1">
          ຍັງບໍ່ມີຂໍ້ມູນການເປີດ-ປິດກະໃນລະບົບ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">ເວລາເປີດ - ປິດກະ</th>
              <th className="py-3 px-3">ພະນັກງານ</th>
              <th className="py-3 px-3 text-right">ເງິນເລີ່ມຕົ້ນ</th>
              <th className="py-3 px-3 text-right">ເງິນຄວນມີ (Expected)</th>
              <th className="py-3 px-3 text-right">ເງິນນັບໄດ້ (Actual)</th>
              <th className="py-3 px-3 text-right">ສ່ວນຕ່າງ (Variance)</th>
              <th className="py-3 px-4 text-center">ສະຖານະ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {shifts.map((s) => {
              const statusCfg =
                SHIFT_STATUS_LABELS[s.status] || SHIFT_STATUS_LABELS.closed;
              const duration = formatShiftDuration(s.opening_time, s.closing_time);
              const discrepancy = s.discrepancy ?? null;

              return (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Time & Duration */}
                  <td className="py-2.5 px-4 min-w-[180px]">
                    <div className="font-bold text-slate-900">
                      {new Date(s.opening_time).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>ໄລຍະເວລາ: {duration}</span>
                    </div>
                  </td>

                  {/* Cashier */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{s.cashier_name || "ພະນັກງານເກັບເງິນ"}</span>
                    </div>
                    {s.notes && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">
                        {s.notes}
                      </div>
                    )}
                  </td>

                  {/* Starting Float */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                    {formatLak(s.opening_cash)}
                  </td>

                  {/* Expected Cash */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-700 tabular-nums">
                    {s.status === "open"
                      ? "-"
                      : typeof s.expected_closing_cash === "number"
                      ? formatLak(s.expected_closing_cash)
                      : "0 ₭"}
                  </td>

                  {/* Actual Cash */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                    {s.status === "open"
                      ? "-"
                      : typeof s.actual_closing_cash === "number"
                      ? formatLak(s.actual_closing_cash)
                      : "0 ₭"}
                  </td>

                  {/* Discrepancy Variance */}
                  <td className="py-2.5 px-3 text-right font-extrabold tabular-nums">
                    {s.status === "open" ? (
                      <span className="text-slate-400">-</span>
                    ) : typeof discrepancy === "number" ? (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] ${
                          discrepancy === 0
                            ? "text-emerald-700 bg-emerald-50"
                            : discrepancy > 0
                            ? "text-amber-700 bg-amber-50"
                            : "text-rose-600 bg-rose-50"
                        }`}
                      >
                        {discrepancy > 0 ? `+${formatLak(discrepancy)}` : formatLak(discrepancy)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Status & Actions */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusCfg.bgClass}`}
                      >
                        {s.status === "open" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                        )}
                        <span>{statusCfg.label_lo}</span>
                      </span>

                      {/* If open: allow closing */}
                      {s.status === "open" && (
                        s.id === activeShift?.id ? (
                          <button
                            type="button"
                            onClick={openCloseShiftModal}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs transition-all cursor-pointer"
                          >
                            <LogOut className="h-2.5 w-2.5" />
                            <span>ປິດກະ & ນັບເງິນ</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleForceClose(s.id)}
                            disabled={closingId === s.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 transition-all cursor-pointer disabled:opacity-50"
                            title="ປິດກະເກົ່າທີ່ຕົກຄ້າງໃນລະບົບ"
                          >
                            {closingId === s.id ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
                            )}
                            <span>ປິດກະຄ້າງ</span>
                          </button>
                        )
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

