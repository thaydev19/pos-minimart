"use client";

// ============================================================================
// Dashboard Overview Page (ພາບລວມຍອດຂາຍ, ຕົ້ນທຶນ, ກຳໄລ & ສະຖິຕິຮ້ານ)
// 100% Real Database Connected with TanStack / Zustand & Supabase Queries
// ============================================================================

import React, { useEffect, useState } from "react";
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
import { DashboardTimeRange, DashboardRecentOrder } from "../types/dashboard.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { OrderRecord, OrderDetailModal, ordersApi } from "@/features/orders";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";

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

  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange, loadDashboardStats]);

  const handleRowClick = async (ord: DashboardRecentOrder) => {
    try {
      const fullOrder = await ordersApi.getOrderById(ord.id);
      if (fullOrder) {
        setSelectedOrder(fullOrder);
      } else {
        setSelectedOrder({
          id: ord.id,
          store_id: DEFAULT_STORE.id,
          cashier_id: "cashier",
          order_number: ord.orderNumber,
          subtotal: ord.total,
          discount_amount: 0,
          vat_amount: 0,
          final_total: ord.total,
          payment_method: ord.paymentMethod.toLowerCase().includes("cash") ? "cash" : "transfer",
          cash_tendered: ord.total,
          change_amount: 0,
          status: (ord.status as any) || "completed",
          offline_created_at: ord.createdAt,
          items: [],
        });
      }
      setIsDetailOpen(true);
    } catch {
      // Fallback
      setSelectedOrder({
        id: ord.id,
        store_id: DEFAULT_STORE.id,
        cashier_id: "cashier",
        order_number: ord.orderNumber,
        subtotal: ord.total,
        discount_amount: 0,
        vat_amount: 0,
        final_total: ord.total,
        payment_method: "cash",
        cash_tendered: ord.total,
        change_amount: 0,
        status: "completed",
        offline_created_at: ord.createdAt,
        items: [],
      });
      setIsDetailOpen(true);
    }
  };

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
          {/* Time Range Selector (min-h-[48px]) */}
          <div className="flex items-center rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80 shadow-2xs">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeRange(opt.id)}
                className={`min-h-[48px] h-12 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 touch-manipulation select-none ${
                  timeRange === opt.id
                    ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Data Button (min-h-[48px]) */}
          <button
            type="button"
            onClick={() => loadDashboardStats()}
            disabled={isLoading}
            className="flex min-h-[48px] h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 touch-manipulation"
            title="ໂຫຼດຂໍ້ມູນໃໝ່ (Refresh)"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* Jump to POS Terminal (min-h-[48px]) */}
          <Link
            href="/pos"
            className="flex min-h-[48px] h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all touch-manipulation"
          >
            <ScanBarcode className="h-5 w-5" />
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
                <tr className="border-b border-zinc-200/80 bg-slate-50/70 text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">ລະຫັດບິນ (Bill No.)</th>
                  <th className="py-3 px-3">ເວລາ</th>
                  <th className="py-3 px-3">ຈຳນວນ</th>
                  <th className="py-3 px-3">ຊ່ອງທາງ</th>
                  <th className="py-3 px-4 text-right">ຍອດລວມ (Total)</th>
                  <th className="py-3 px-3 text-center">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
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
                      <tr
                        key={ord.id}
                        onClick={() => handleRowClick(ord)}
                        className="hover:bg-emerald-50/60 active:bg-emerald-100/70 active:scale-[0.99] transition-all cursor-pointer touch-manipulation select-none group"
                        title="ແຕະເພື່ອເບິ່ງລາຍລະອຽດບິນ & ພິມບິນຄືນ"
                      >
                        <td className="py-4 px-4 font-mono font-black text-slate-900 group-hover:text-emerald-700 text-xs sm:text-sm">
                          {ord.orderNumber}
                        </td>
                        <td className="py-4 px-3 text-slate-600 font-medium">{timeFormatted}</td>
                        <td className="py-4 px-3 text-slate-700 font-bold">{ord.itemsCount} ລາຍການ</td>
                        <td className="py-4 px-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                              ord.paymentMethod.includes("Cash") || ord.paymentMethod.includes("ສົດ")
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 text-sm tabular-nums">
                          {formatLak(ord.total)}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
