"use client";

// ============================================================================
// OrdersPage: Comprehensive Sales Order History & Integrated Shifts Tab
// 100% Real Supabase + Dexie Offline DB, Strict Lao Localization
// ============================================================================

import React, { useState } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import { useOrderStore } from "../stores/order.store";
import { OrderSummaryCards } from "../components/OrderSummaryCards";
import { OrdersTable } from "../components/OrdersTable";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { VoidOrderDialog } from "../components/VoidOrderDialog";
import { Receipt80mmTemplate } from "../components/Receipt80mmTemplate";
import { ShiftsPage } from "@/features/shifts";
import { triggerHapticFeedback } from "@/utils/haptics";

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "shifts">("orders");
  const { orders, totalCount, kpis, isLoading, refresh } = useOrders();

  const filters = useOrderStore((s) => s.filters);
  const setDateRange = useOrderStore((s) => s.setDateRange);
  const setPaymentMethod = useOrderStore((s) => s.setPaymentMethod);
  const setStatus = useOrderStore((s) => s.setStatus);
  const setSearchTerm = useOrderStore((s) => s.setSearchTerm);

  const selectedOrderForDetail = useOrderStore((s) => s.selectedOrderForDetail);
  const closeDetail = useOrderStore((s) => s.closeDetail);
  const openVoidDialog = useOrderStore((s) => s.openVoidDialog);
  const orderForReprint = useOrderStore((s) => s.orderForReprint);
  const setReprintOrder = useOrderStore((s) => s.setReprintOrder);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ປະຫວັດບິນຂາຍ & ກະເຮັດວຽກ (Sales & Shifts)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ກວດສອບລາຍການບິນ, ພິມບິນຄືນ (80mm) ແລະ ຕິດຕາມກະຂາຍເຄື່ອງ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Module Tab Toggle (min-h-[48px]) */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                setActiveTab("orders");
              }}
              className={`flex min-h-[44px] h-11 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                activeTab === "orders"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>ປະຫວັດບິນ ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                setActiveTab("shifts");
              }}
              className={`flex min-h-[44px] h-11 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                activeTab === "shifts"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>ກະຂາຍເຄື່ອງ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex min-h-[48px] h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50 touch-manipulation"
            title="ດຶງຂໍ້ມູນລ່າສຸດ"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Tab Contents */}
      {activeTab === "shifts" ? (
        <ShiftsPage />
      ) : (
        <>
          {/* Orders Top Summary KPIs */}
          <OrderSummaryCards kpis={kpis} />

          {/* Orders Filter & Search Toolbar (Touchscreen standard min-h-[48px]) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-2xs select-none touch-manipulation">
            {/* Search Input (h-12 / 48px) */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ຄົ້ນຫາເລກທີບິນ, ຊື່ພະນັກງານ, ຊື່ສິນຄ້າ..."
                className="h-12 w-full rounded-2xl border border-slate-200 pl-10 pr-4 text-xs sm:text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
              />
            </div>

            {/* Filters Row (All elements min-h-[48px]) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range Chips */}
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
                {(["today", "week", "month", "all"] as const).map((r) => {
                  const labelMap = {
                    today: "ມື້ນີ້",
                    week: "7 ວັນ",
                    month: "30 ວັນ",
                    all: "ທັງໝົດ",
                  };
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(20);
                        setDateRange(r);
                      }}
                      className={`min-h-[40px] h-10 rounded-xl px-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                        filters.dateRange === r
                          ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {labelMap[r]}
                    </button>
                  );
                })}
              </div>

              {/* Payment Method Dropdown (h-12) */}
              <select
                value={filters.paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="all">ທຸກວິທີຊຳລະ (All)</option>
                <option value="cash">ເງິນສົດ (Cash)</option>
                <option value="transfer">LAO QR (Transfer)</option>
              </select>

              {/* Status Dropdown (h-12) */}
              <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="all">ທຸກສະຖານະ (All)</option>
                <option value="completed">ສຳເລັດ (Completed)</option>
                <option value="cancelled">ຍົກເລີກ (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <OrdersTable orders={orders} isLoading={isLoading} />

          {/* Touch-Friendly Order Details Modal & Void Dialog */}
          <OrderDetailModal
            order={selectedOrderForDetail}
            isOpen={Boolean(selectedOrderForDetail)}
            onClose={closeDetail}
            onVoid={(ord) => {
              closeDetail();
              openVoidDialog(ord);
            }}
            onReprint={(ord) => {
              setReprintOrder(ord);
            }}
          />
          <VoidOrderDialog />

          {/* 80mm Reprint Preview Modal */}
          {orderForReprint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Printer className="h-4 w-4 text-emerald-600" />
                    <span>ພິມໃບບິນຂາຍ (80mm)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setReprintOrder(null)}
                    className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Printable container */}
                <div className="max-h-[60vh] overflow-y-auto border border-zinc-200 rounded-xl bg-slate-50 p-2">
                  <Receipt80mmTemplate order={orderForReprint} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setReprintOrder(null)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    ປິດ
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>ກົດພິມດຽວນີ້</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
