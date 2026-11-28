"use client";

// ============================================================================
// Settings Page (ຕັ້ງຄ່າລະບົບ) - Streamlined Hardware & System Control Center
// 1. Direct Inline Receipt Printer & Cash Drawer Configuration
// 2. Customer Display Toggle & Cash Drawer Open Controls
// 3. Manual System Update Card
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Monitor,
  LockOpen,
  Loader2,
  Cpu,
} from "lucide-react";
import { HardwareService } from "@/features/pos/services/hardware.service";
import { PrinterSettingsPanel } from "@/features/pos/components/PrinterSettingsModal";
import { SystemUpdateCard } from "@/components/TauriAutoUpdater";
import { ConfirmPinDialog } from "@/components/ConfirmPinDialog";
import { useAuth } from "@/features/auth";
import { usePosStore } from "@/features/pos/stores/pos.store";
import { isCustomerDisplayWindowOpenAsync } from "@/features/pos/utils/tauriWindow";
import {
  initCustomerDisplay,
  closeCustomerDisplay,
} from "@/features/pos/utils/dualScreenManager";
import {
  subscribeCustomerDisplay,
  broadcastCurrentCustomerDisplayState,
} from "@/features/pos/utils/customerDisplaySync";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

export function SettingsPage() {
  const { user } = useAuth();
  const [isCustomerDisplayActive, setIsCustomerDisplayActive] = useState(false);
  const [isDrawerKicking, setIsDrawerKicking] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const closingDisplayUntilRef = useRef(0);

  const isCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.isCustomerDisplayFloatingOpen
  );
  const setCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.setCustomerDisplayFloatingOpen
  );

  useEffect(() => {
    const unsubscribe = subscribeCustomerDisplay((msg) => {
      if (Date.now() < closingDisplayUntilRef.current) return;
      if (
        msg.type === "CUSTOMER_DISPLAY_READY" ||
        msg.type === "CUSTOMER_DISPLAY_PING" ||
        msg.type === "REQUEST_CUSTOMER_DISPLAY_SYNC"
      ) {
        setIsCustomerDisplayActive(true);
      } else if (msg.type === "CUSTOMER_DISPLAY_CLOSED") {
        setIsCustomerDisplayActive(false);
      }
    });

    const syncState = async () => {
      if (Date.now() < closingDisplayUntilRef.current) return;
      const open = await isCustomerDisplayWindowOpenAsync();
      setIsCustomerDisplayActive(
        open || usePosStore.getState().isCustomerDisplayFloatingOpen
      );
    };

    syncState();
    const interval = setInterval(syncState, 2000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const executeOpenDrawer = async () => {
    setIsDrawerKicking(true);
    triggerHapticFeedback(50);
    try {
      const res = await HardwareService.openCashDrawer();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການໄຂລິ້ນຊັກເງິນ");
    } finally {
      setIsDrawerKicking(false);
    }
  };

  const handleOpenCashDrawer = () => {
    triggerHapticFeedback(30);
    if (user?.role === "cashier") {
      setIsPinDialogOpen(true);
    } else {
      executeOpenDrawer();
    }
  };

  const handleToggleCustomerDisplay = async () => {
    triggerHapticFeedback(30);

    if (isCustomerDisplayActive || isCustomerDisplayFloatingOpen) {
      closingDisplayUntilRef.current = Date.now() + 2000;
      setIsCustomerDisplayActive(false);
      setCustomerDisplayFloatingOpen(false);
      await closeCustomerDisplay();
      toast.info("ໄດ້ປິດຈໍລູກຄ້າແລ້ວ (Customer Display Closed)");
      return;
    }

    closingDisplayUntilRef.current = 0;
    const opened = await initCustomerDisplay();
    if (opened) {
      setIsCustomerDisplayActive(true);
      toast.success("ໄດ້ເປີດຈໍລູກຄ້າແລ້ວ (Customer Display Active)");
    } else {
      setCustomerDisplayFloatingOpen(true);
      setIsCustomerDisplayActive(true);
      broadcastCurrentCustomerDisplayState();
      toast.success("ອຸປະກອນມີ 1 ໜ້າຈໍ: ໄດ້ເປີດຈໍລູກຄ້າຈຳລອງ (Floating Preview)");
    }
  };

  const displayOn = isCustomerDisplayActive || isCustomerDisplayFloatingOpen;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຕັ້ງຄ່າລະບົບ & ອຸປະກອນ (Settings)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ຕັ້ງຄ່າເຄື່ອງພິມໃບບິນ, ໄຂລິ້ນຊັກເກັບເງິນ, ຈໍລູກຄ້າ ແລະ ອັບເດດລະບົບ
            </p>
          </div>
        </div>
      </div>

      {/* Balanced 2-Column Hardware & System Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (7/12): Inline Receipt Printer Settings */}
        <div className="lg:col-span-7">
          <PrinterSettingsPanel isActive={true} variant="inline" />
        </div>

        {/* Right Column (5/12): Peripherals Quick Controls + System Update */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Peripherals Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  ຄວບຄຸມອຸປະກອນໜ້າຮ້ານ
                </h2>
                <p className="text-[11px] text-slate-500">
                  ເປີດຈໍລູກຄ້າ ແລະ ໄຂລິ້ນຊັກເງິນດ່ວນ
                </p>
              </div>
            </div>

            {/* 1. Customer Display Button */}
            <button
              type="button"
              onClick={handleToggleCustomerDisplay}
              className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors active:scale-[0.99] cursor-pointer ${
                displayOn
                  ? "border-emerald-500 bg-emerald-50/70 hover:bg-emerald-50"
                  : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    displayOn
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    ຈໍລູກຄ້າ (Customer Display)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {displayOn
                      ? "ກຳລັງເປີດຢູ່ • ກົດເພື່ອປິດຈໍລູກຄ້າ"
                      : "ກົດເພື່ອເປີດໜ້າຈໍສະແດງຜົນໃຫ້ລູກຄ້າ"}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  displayOn
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    displayOn ? "bg-white" : "bg-slate-500"
                  }`}
                />
                <span>{displayOn ? "ເປີດຢູ່" : "ປິດຢູ່"}</span>
              </span>
            </button>

            {/* 2. Open Cash Drawer Button */}
            <button
              type="button"
              disabled={isDrawerKicking}
              onClick={handleOpenCashDrawer}
              className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200/80">
                  {isDrawerKicking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LockOpen className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    ໄຂລີ້ນຊັກເກັບເງິນ (Cash Drawer)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    ສົ່ງຄຳສັ່ງເປີດລິ້ນຊັກເງິນສົດທັນທີ (F10)
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg bg-white border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                {isDrawerKicking ? "ກຳລັງເປີດ..." : "ເປີດເລີຍ"}
              </span>
            </button>
          </div>

          {/* System Update Card */}
          <SystemUpdateCard />
        </div>
      </div>

      {/* Manager PIN Override Dialog for Cashier opening Cash Drawer */}
      <ConfirmPinDialog
        isOpen={isPinDialogOpen}
        onClose={() => setIsPinDialogOpen(false)}
        onSuccess={() => {
          setIsPinDialogOpen(false);
          executeOpenDrawer();
        }}
        actionTitle="ຢືນຢັນສິດທິຜູ້ຈັດການເພື່ອໄຂລິ້ນຊັກເງິນ"
      />
    </div>
  );
}
