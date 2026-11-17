"use client";

// ============================================================================
// ShiftsPage: Cashier Shifts Management, Live Float & Blind Closing
// 100% Real Supabase + Dexie Sync, Strict Lao Localization
// ============================================================================

import React from "react";
import {
  Clock,
  Coins,
  RefreshCw,
  PlusCircle,
  LogOut,
  QrCode,
  Receipt,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useShifts } from "../hooks/useShifts";
import { useShiftStore } from "../stores/shift.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatShiftDuration } from "../utils/shift.util";
import { ShiftHistoryTable } from "../components/ShiftHistoryTable";
import { OpenShiftDialog } from "../components/OpenShiftDialog";
import { CloseShiftBlindDialog } from "../components/CloseShiftBlindDialog";

export function ShiftsPage() {
  const { activeShift, shiftHistory, isLoading, refreshActiveShift, refreshHistory } =
    useShifts();

  const openOpenShiftModal = useShiftStore((s) => s.openOpenShiftModal);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);

  const handleRefresh = async () => {
    await Promise.all([refreshActiveShift(), refreshHistory()]);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ຄຸ້ມຄອງກະຂາຍເຄື່ອງ (Cashier Shifts)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ເປີດກະ, ກວດນັບເງິນທອນ, ປິດກະແບບ Blind Close ແລະ ກວດສອບສ່ວນຕ່າງເງິນສົດ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="ດຶງຂໍ້ມູນລ່າສຸດຈາກ Supabase"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`}
            />
            <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
          </button>

          {!activeShift && (
            <button
              type="button"
              onClick={openOpenShiftModal}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>ເປີດກະຂາຍເຄື່ອງໃໝ່</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Current Active Shift Status Card */}
      {activeShift ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-emerald-950">
                  ກະຂາຍປັດຈຸບັນກຳລັງເປີດຢູ່ (Active Shift)
                </h2>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  ເລີ່ມຕັ້ງແຕ່: {new Date(activeShift.opening_time).toLocaleTimeString()} ({formatShiftDuration(activeShift.opening_time)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCloseShiftModal}
                className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-2xs transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>ປິດກະ & ນັບເງິນ</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of Active Shift */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white p-3 border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                <span>ເງິນທອນເລີ່ມຕົ້ນ</span>
              </div>
              <div className="text-base font-extrabold text-slate-900 tabular-nums mt-1">
                {formatLak(activeShift.opening_cash)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-emerald-700" />
                <span>ຍອດຂາຍເງິນສົດ</span>
              </div>
              <div className="text-base font-extrabold text-emerald-700 tabular-nums mt-1">
                +{formatLak(activeShift.total_cash_sales || 0)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                <span>ຍອດໂອນ LAO QR</span>
              </div>
              <div className="text-base font-extrabold text-indigo-700 tabular-nums mt-1">
                {formatLak(activeShift.total_transfer_sales || 0)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-slate-600" />
                <span>ຈຳນວນບິນທີ່ຂາຍ</span>
              </div>
              <div className="text-base font-extrabold text-slate-900 tabular-nums mt-1">
                {activeShift.total_orders_count || 0} ບິນ
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-amber-950">
                ປະຈຸບັນຍັງບໍ່ມີກະຂາຍເຄື່ອງທີ່ເປີດຢູ່
              </h2>
              <p className="text-[10px] text-amber-800 mt-0.5">
                ກະລຸນາເປີດກະ ແລະ ປ້ອນເງິນທອນເລີ່ມຕົ້ນກ່ອນທີ່ຈະເລີ່ມຕົ້ນຂາຍສິນຄ້າໜ້າຮ້ານ (POS)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openOpenShiftModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>ເປີດກະຂາຍເຄື່ອງດຽວນີ້</span>
          </button>
        </div>
      )}

      {/* 3. Past Shifts History Table */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
          ປະຫວັດການເປີດ-ປິດກະຂາຍເຄື່ອງ (Shift History)
        </h2>
        <ShiftHistoryTable shifts={shiftHistory} isLoading={isLoading} />
      </div>

      {/* 4. Shift Dialogs */}
      <OpenShiftDialog />
      <CloseShiftBlindDialog />
    </div>
  );
}

