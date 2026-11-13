"use client";

// ============================================================================
// Dashboard Overview Page (ພາບລວມຍອດຂາຍ, ຕົ້ນທຶນ, ກຳໄລ & ສະຖິຕິຮ້ານ)
// 100% Real Database Connected with TanStack / Zustand & Supabase Queries
// ============================================================================

import React, { useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ScanBarcode,
  RefreshCw,
  Clock,
  CheckCircle2,
  Coins,
  Percent,
  Wallet,
  QrCode,
  Calendar,
} from "lucide-react";
import { useDashboardStore } from "../stores/dashboard.store";
import { DashboardTimeRange } from "../types/dashboard.types";
import { formatLak } from "@/utils/formatLakCurrency";

export function DashboardPage() {
  const {
    timeRange,
    setTimeRange,
    kpis,
    paymentBreakdown,
    stockAlerts,
    recentOrders,
    isLoading,
    loadDashboardStats,
  } = useDashboardStore();

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange, loadDashboardStats]);

  const timeRangeOptions: { id: DashboardTimeRange; label: string }[] = [
    { id: "today", label: "ມື້ນີ້ (Today)" },
    { id: "week", label: "7 ວັນຜ່ານມາ (Week)" },
    { id: "month", label: "30 ວັນຜ່ານມາ (Month)" },
  ];

  const totalRevenue = kpis?.totalRevenue || 0;
  const totalCost = kpis?.totalCost || 0;
  const estimatedGrossProfit = kpis?.estimatedGrossProfit || 0;
  const grossProfitMarginPct = kpis?.grossProfitMarginPct || 0;
  const totalOrdersCount = kpis?.totalOrdersCount || 0;
  const averageOrderValue = kpis?.averageOrderValue || 0;

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Title, Range Filter & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ພາບລວມລະບົບຮ້ານຄ້າ (Store Overview)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ອັບເດດສະຖິຕິຍອດຂາຍ, ຕົ້ນທຶນ, ກຳໄລ, ການຊຳລະເງິນ ແລະ ແຈ້ງເຕືອນສາງສິນຄ້າ (FEFO)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeRange(opt.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  timeRange === opt.id
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={() => loadDashboardStats()}
            disabled={isLoading}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="ໂຫຼດຂໍ້ມູນໃໝ່ (Refresh)"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* Jump to POS Terminal */}
          <Link
            href="/pos"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <ScanBarcode className="h-4 w-4" />
            <span className="hidden sm:inline">ຂາຍໜ້າຮ້ານ (POS)</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Financial Metrics: Revenue, Cost, Gross Profit, Profit Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">ຍອດຂາຍລວມ (Total Revenue)</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 tabular-nums">
                {formatLak(totalRevenue)}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
            <span>ຈຳນວນບິນຂາຍ:</span>
            <span className="font-bold text-slate-700 tabular-nums">{totalOrdersCount} ບິນ</span>
          </div>
        </div>

        {/* Total Cost / Giá nhập */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">ຕົ້ນທຶນສິນຄ້າ (Total Cost)</span>
              <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1 tabular-nums">
                {formatLak(totalCost)}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
            <span>ມູນຄ່າຕົ້ນທຶນສິນຄ້າທີ່ຂາຍໄດ້</span>
          </div>
        </div>

        {/* Gross Profit / Tổng lãi */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1 tabular-nums">
                +{formatLak(estimatedGrossProfit)}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
            <span>ກຳໄລ = ຍອດຂາຍ - ຕົ້ນທຶນ</span>
            <span className="font-bold text-indigo-700">+{formatLak(estimatedGrossProfit)}</span>
          </div>
        </div>

        {/* Profit Margin % */}
        <div className="flex flex-col justify-between rounded-2xl border border-purple-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">ອັດຕາກຳໄລ (Profit Margin)</span>
              <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1 tabular-nums">
                +{grossProfitMarginPct}%
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
            <span>ສະເລ່ຍຕໍ່ບິນ:</span>
            <span className="font-bold text-slate-700 tabular-nums">{formatLak(averageOrderValue)}</span>
          </div>
        </div>
      </div>

      {/* 3. Secondary Metrics: Payment Method Breakdown & FEFO Alert Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Cash Payment Stat */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                ຊຳລະເງິນສົດ (Cash)
              </span>
              <div className="text-base font-extrabold text-slate-900 tabular-nums">
                {formatLak(paymentBreakdown?.cashTotal || 0)}
              </div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 tabular-nums">
            {paymentBreakdown?.cashPct || 0}% ({paymentBreakdown?.cashCount || 0} ບິນ)
          </span>
        </div>

        {/* Transfer / QR Payment Stat */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                ໂອນເງິນ / QR (Transfer)
              </span>
              <div className="text-base font-extrabold text-slate-900 tabular-nums">
                {formatLak(paymentBreakdown?.transferTotal || 0)}
              </div>
            </div>
          </div>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800 tabular-nums">
            {paymentBreakdown?.transferPct || 0}% ({paymentBreakdown?.transferCount || 0} ບິນ)
          </span>
        </div>

        {/* FEFO Expiry / Stock Alert Summary */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                ເຕືອນສິນຄ້າ FEFO
              </span>
              <div className="text-base font-extrabold text-slate-900">
                {stockAlerts.length} ລາຍການ
              </div>
            </div>
          </div>
          <Link
            href="/inventory"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all"
          >
            ກວດສອບ
          </Link>
        </div>
      </div>

      {/* 4. Main Grid: Real Recent Orders & FEFO Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Real Recent POS Orders from DB */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5 border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ລາຍການບິນຂາຍຫຼ້າສຸດ (Recent Orders)</h3>
              <p className="text-[11px] text-slate-400">ຂໍ້ມູນຈິງຈາກຖານຂໍ້ມູນ (Database Orders)</p>
            </div>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>ເບິ່ງທັງໝົດ</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] text-slate-400 uppercase font-semibold">
                  <th className="py-2">ລະຫັດບິນ</th>
                  <th className="py-2">ເວລາ</th>
                  <th className="py-2">ຈຳນວນ</th>
                  <th className="py-2">ຊ່ອງທາງ</th>
                  <th className="py-2 text-right">ຍອດລວມ</th>
                  <th className="py-2 text-center">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                      ຍັງບໍ່ທັນມີລາຍການບິນຂາຍໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const timeFormatted = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString("lo-LA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-slate-800">
                          {ord.orderNumber}
                        </td>
                        <td className="py-2.5 text-slate-500">{timeFormatted}</td>
                        <td className="py-2.5 text-slate-600">{ord.itemsCount} ລາຍການ</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              ord.paymentMethod.includes("Cash")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}
                          >
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-slate-900 tabular-nums">
                          {formatLak(ord.total)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>{ord.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: FEFO Expiry & Quick Links */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">ແຈ້ງເຕືອນ FEFO (ວັນໝົດອາຍຸ)</h3>
            </div>
            
            {stockAlerts.length === 0 ? (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ບໍ່ມີສິນຄ້າໃກ້ໝົດອາຍຸໃນໄລຍະ 30 ວັນນີ້. ສິນຄ້າທັງໝົດຢູ່ໃນສະພາບສົດໃໝ່!
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {stockAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-amber-200 bg-white p-2.5 text-xs shadow-2xs"
                  >
                    <div className="font-bold text-slate-800 truncate">{alert.productName}</div>
                    <div className="text-[10.5px] text-amber-700 mt-0.5">{alert.detail}</div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/inventory"
              className="mt-3 block text-center rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all"
            >
              ຈັດການລັອດສິນຄ້າ FEFO
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800">ເມນູດ່ວນອື່ນໆ</h4>
            <div className="space-y-1.5">
              <Link
                href="/products"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>ສິນຄ້າ & ຫົວໜ່ວຍຂາຍ</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/categories"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>ໝວດໝູ່ສິນຄ້າ</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>ຕັ້ງຄ່າຮ້ານຄ້າ & ເຄື່ອງພິມ</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
