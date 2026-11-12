"use client";

// ============================================================================
// Dashboard Overview Page (ພາບລວມຍອດຂາຍ & ສະຖິຕິຮ້ານ)
// ============================================================================

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ScanBarcode,
  PackagePlus,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatLak } from "@/utils/formatLakCurrency";

export function DashboardPage() {
  const stats = [
    {
      title: "ຍອດຂາຍລວມມື້ນີ້",
      value: formatLak(14250000),
      change: "+12.5% ທຽບກັບມື້ວານ",
      icon: TrendingUp,
      color: "emerald",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200/80",
    },
    {
      title: "ຈຳນວນບິນຂາຍມື້ນີ້",
      value: "148 ບິນ",
      change: "ສະເລ່ຍ 96,280 ₭/ບິນ",
      icon: ShoppingBag,
      color: "blue",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200/80",
    },
    {
      title: "ສິນຄ້າໃກ້ໝົດອາຍຸ (FEFO)",
      value: "3 ລາຍການ",
      change: "ແນະນຳຕິດປ້າຍຫຼຸດລາຄາ",
      icon: AlertTriangle,
      color: "amber",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200/80",
    },
    {
      title: "ສິນຄ້າໃກ້ໝົດສາງ",
      value: "5 ລາຍການ",
      change: "ຕ້ອງສັ່ງຊື້ເພີ່ມດ່ວນ",
      icon: Boxes,
      color: "rose",
      bgLight: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200/80",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-20261113-009",
      time: "01:35",
      itemsCount: 4,
      total: 95000,
      paymentMethod: "BCEL One QR",
      status: "ສຳເລັດ",
    },
    {
      id: "ORD-20261113-008",
      time: "01:28",
      itemsCount: 2,
      total: 28000,
      paymentMethod: "ເງິນສົດ (Cash)",
      status: "ສຳເລັດ",
    },
    {
      id: "ORD-20261113-007",
      time: "01:15",
      itemsCount: 6,
      total: 165000,
      paymentMethod: "BCEL One QR",
      status: "ສຳເລັດ",
    },
    {
      id: "ORD-20261113-006",
      time: "00:54",
      itemsCount: 1,
      total: 14000,
      paymentMethod: "ເງິນສົດ (Cash)",
      status: "ສຳເລັດ",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ພາບລວມລະບົບຮ້ານຄ້າ (Store Overview)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ອັບເດດສະຖິຕິການຂາຍ, ຍອດເງິນສົດ, QR Code ແລະ ແຈ້ງເຕືອນສາງສິນຄ້າ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <ScanBarcode className="h-4 w-4" />
            <span>ໄປໜ້າຂາຍໜ້າຮ້ານ (POS)</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex flex-col justify-between rounded-2xl border ${item.borderColor} bg-white p-4 shadow-2xs`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">{item.title}</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                    {item.value}
                  </div>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bgLight} ${item.textColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-medium text-slate-500">
                <span>{item.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Orders & Expiry Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Recent POS Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5 border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ລາຍການບິນຂາຍຫຼ້າສຸດ</h3>
              <p className="text-[11px] text-slate-400">ລາຍການຊຳລະເງິນສົດ ແລະ QR ຜ່ານລະບົບ POS</p>
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
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-slate-800">{ord.id}</td>
                    <td className="py-2.5 text-slate-500">{ord.time}</td>
                    <td className="py-2.5 text-slate-600">{ord.itemsCount} ລາຍການ</td>
                    <td className="py-2.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: FEFO Expiry & Stock Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">ແຈ້ງເຕືອນ FEFO (ໝົດອາຍຸ)</h3>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              ມີ <strong>3 ລາຍການສິນຄ້າ</strong> ທີ່ຈະໝົດອາຍຸພາຍໃນ 7 ມື້ຂ້າງໜ້າ (ໝີ່ຕົ້ມຍຳ, ນົມແລັກຕາຊອຍ, ກ້ວຍຫອມ).
            </p>
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
                <span>ສິນຄ້າ & ຫົວໜ່ວຍ</span>
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

