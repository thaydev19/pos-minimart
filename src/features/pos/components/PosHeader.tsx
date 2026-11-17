"use client";

// ============================================================================
// POS Terminal Header: Streamlined Touch Bar (Góc phải chỉ còn đúng 4 cụm)
// 1. Clock & Network Sync Status
// 2. Hardware & Peripherals Dropdown (Settings2: Drawer F10, Customer Display, Printer)
// 3. Smart Shift Control Button (Single Alert/Active Button)
// 4. Quick Logout Button (LogOut)
// Zero Emojis - Lucide Icons Exclusively
// ============================================================================

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Store,
  Clock,
  Menu,
  Monitor,
  Printer,
  Settings2,
  LockOpen,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { NetworkSyncBadge } from "@/components/NetworkSyncBadge";
import { DEFAULT_STORE } from "../constants/pos.constants";
import { HoldOrdersTabs } from "./HoldOrdersTabs";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth, UserProfileMenu } from "@/features/auth";
import {
  useShiftStore,
  OpenShiftDialog,
  CloseShiftBlindDialog,
  formatShiftDuration,
} from "@/features/shifts";
import { isCustomerDisplayWindowOpen } from "../utils/tauriWindow";
import {
  initCustomerDisplay,
  closeCustomerDisplay,
} from "../utils/dualScreenManager";
import {
  subscribeCustomerDisplay,
  broadcastCurrentCustomerDisplayState,
} from "../utils/customerDisplaySync";
import { HardwareService } from "../services/hardware.service";
import { PrinterSettingsModal } from "./PrinterSettingsModal";
import { ConfirmPinDialog } from "@/components/ConfirmPinDialog";
import { usePosStore } from "../stores/pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

export function PosHeader() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [isCustomerDisplayActive, setIsCustomerDisplayActive] = useState(false);
  const [isDrawerKicking, setIsDrawerKicking] = useState(false);
  const [isHardwareMenuOpen, setIsHardwareMenuOpen] = useState(false);
  const [isPinDialogOpenForDrawer, setIsPinDialogOpenForDrawer] = useState(false);

  // Floating Customer Display State
  const isCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.isCustomerDisplayFloatingOpen
  );
  const setCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.setCustomerDisplayFloatingOpen
  );

  const hardwareMenuRef = useRef<HTMLDivElement>(null);

  // Shift Store
  const activeShift = useShiftStore((s) => s.activeShift);
  const openOpenShiftModal = useShiftStore((s) => s.openOpenShiftModal);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);

  // Clock interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor Customer Display state
  useEffect(() => {
    const unsubscribe = subscribeCustomerDisplay((msg) => {
      if (
        msg.type === "CUSTOMER_DISPLAY_READY" ||
        msg.type === "CUSTOMER_DISPLAY_PING"
      ) {
        setIsCustomerDisplayActive(true);
      }
    });

    const checkInterval = setInterval(() => {
      if (isCustomerDisplayWindowOpen()) {
        setIsCustomerDisplayActive(true);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, []);

  // Close hardware dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hardwareMenuRef.current &&
        !hardwareMenuRef.current.contains(event.target as Node)
      ) {
        setIsHardwareMenuOpen(false);
      }
    };

    if (isHardwareMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHardwareMenuOpen]);

  // Execute actual opening of Cash Drawer via ESC/POS
  const executeOpenDrawer = async () => {
    setIsDrawerKicking(true);
    triggerHapticFeedback(50);
    try {
      const res = await HardwareService.openCashDrawer(2);
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

  // Trigger cash drawer with role/PIN verification
  const handleTriggerDrawer = () => {
    triggerHapticFeedback(30);
    setIsHardwareMenuOpen(false);

    // If user is cashier, require Manager PIN override
    if (user?.role === "cashier") {
      setIsPinDialogOpenForDrawer(true);
    } else {
      // Owner or Store Manager can open directly
      executeOpenDrawer();
    }
  };

  // Keyboard shortcut F10 listener for Cash Drawer
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleTriggerDrawer();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [user]);

  // Toggle Customer Display
  const handleToggleCustomerDisplay = async () => {
    triggerHapticFeedback(30);
    setIsHardwareMenuOpen(false);

    if (isCustomerDisplayActive || isCustomerDisplayFloatingOpen) {
      await closeCustomerDisplay();
      setIsCustomerDisplayActive(false);
      setCustomerDisplayFloatingOpen(false);
      toast.info("ໄດ້ປິດຈໍລູກຄ້າແລ້ວ (Customer Display Closed)");
      return;
    }

    const opened = await initCustomerDisplay();
    if (opened) {
      setIsCustomerDisplayActive(true);
      toast.success("ໄດ້ເປີດຈໍລູກຄ້າແລ້ວ (Customer Display Active)");
    } else {
      // No secondary hardware display connected (e.g. testing on WSA, single tablet, single monitor)
      // Automatically fall back to the In-App Floating Preview so the user can test everything!
      setCustomerDisplayFloatingOpen(true);
      setIsCustomerDisplayActive(true);
      broadcastCurrentCustomerDisplayState();
      toast.success("ອຸປະກອນມີ 1 ໜ້າຈໍ: ໄດ້ເປີດຈໍລູກຄ້າຈຳລອງ (Floating Preview)");
    }
  };

  const shiftDuration = activeShift
    ? formatShiftDuration(activeShift.opening_time)
    : "";

  return (
    <>
      <header className="flex h-12 w-full items-center justify-between border-b border-slate-200/90 bg-white px-2.5 sm:px-4 shadow-2xs select-none gap-2 shrink-0 touch-manipulation">
        {/* 1. Left: Menu Drawer Trigger + Store Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(20);
              setIsMenuOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
            title="ເມນູລະບົບ (Menu)"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center">
            {/* Desktop & Tablet: Sleek, well-proportioned QuickOne logo with text */}
            <div className="hidden sm:flex items-center">
              <Image
                src="/logo-text.svg"
                alt="QuickOne POS"
                width={150}
                height={40}
                className="h-7.5 sm:h-8 w-auto object-contain"
                priority
              />
            </div>

            {/* Mobile: Clean standalone logo icon */}
            <div className="flex sm:hidden items-center justify-center">
              <Image
                src="/logo.svg"
                alt="QuickOne"
                width={32}
                height={32}
                className="h-7.5 w-7.5 object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* 2. Center: Bill / Hold Order Tabs (ບິນປັດຈຸບັນ & ພັກບິນ) */}
        <div className="flex items-center justify-center flex-1 max-w-xl mx-auto overflow-hidden">
          <HoldOrdersTabs />
        </div>

        {/* 3. Right: Exactly 4 Streamlined Elements */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* ELEMENT 1: Clock & Network Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 h-9 text-xs font-bold text-slate-700 shadow-2xs font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>
            <NetworkSyncBadge />
          </div>

          {/* ELEMENT 2: Hardware & Peripherals Dropdown (Settings2) */}
          <div className="relative shrink-0" ref={hardwareMenuRef}>
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                setIsHardwareMenuOpen((prev) => !prev);
              }}
              className={`relative flex h-9 items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                isHardwareMenuOpen
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              title="ອຸປະກອນ & ລິ້ນຊັກເງິນ (Hardware Peripherals)"
            >
              <Settings2 className="h-4 w-4 text-slate-700 shrink-0" />
              <span className="hidden xl:inline text-xs">ອຸປະກອນ</span>
              {/* Online Hardware Status Dot Indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform ${
                  isHardwareMenuOpen ? "rotate-180 text-emerald-600" : ""
                }`}
              />
            </button>

            {/* Popover Dropdown Menu */}
            {isHardwareMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    ອຸປະກອນເຊື່ອມຕໍ່ (Peripherals)
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ຈັດການລິ້ນຊັກ, ຈໍລູກຄ້າ ແລະ ເຄື່ອງພິມ
                  </p>
                </div>

                {/* 1. Cash Drawer Kick */}
                <button
                  type="button"
                  disabled={isDrawerKicking}
                  onClick={handleTriggerDrawer}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-amber-50/80 transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-200 transition-colors shrink-0">
                      {isDrawerKicking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-800" />
                      ) : (
                        <LockOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-amber-950">
                        ໄຂລີ້ນຊັກເກັບເງິນ
                      </p>
                      <p className="text-[10px] text-slate-500">
                        ເປີດລິ້ນຊັກເງິນສົດ RJ11
                      </p>
                    </div>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                    F10
                  </kbd>
                </button>

                {/* 2. Customer Display Toggle */}
                <button
                  type="button"
                  onClick={handleToggleCustomerDisplay}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-emerald-50/80 transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-200 transition-colors shrink-0">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                        ຈໍລູກຄ້າ (Customer Display)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                          ? "ກົດເພື່ອປິດໜ້າຈໍສະແດງຜົນ"
                          : "ກົດເພື່ອເປີດໜ້າຈໍສະແດງຜົນ"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                          ? "bg-emerald-600 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    <span>
                      {isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                        ? isCustomerDisplayFloatingOpen
                          ? "ຈຳລອງ"
                          : "ເປີດຢູ່"
                        : "ປິດຢູ່"}
                    </span>
                  </span>
                </button>

                {/* 3. Printer Settings & Test Print */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    setIsHardwareMenuOpen(false);
                    setIsPrinterSettingsOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-blue-50/80 transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-200 transition-colors shrink-0">
                      <Printer className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-950">
                        ຕັ້ງຄ່າເຄື່ອງພິມ (Printer)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Thermal 80mm / 58mm & ທົດສອບພິມ
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">
                    ESC/POS
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ELEMENT 3: Smart Shift Control Button (Single Button) */}
          {!activeShift ? (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                openOpenShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2 sm:px-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກົດເພື່ອເປີດກະຂາຍໃໝ່ (Open Shift)"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">ເປີດກະຂາຍ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                openCloseShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2 sm:px-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກວດສອບ ຫຼື ປິດກະຂາຍ (Click to view or close shift)"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">
                ປິດກະ{" "}
                <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                  ({shiftDuration})
                </span>
              </span>
            </button>
          )}

          {/* ELEMENT 4: Logout / Exit Button */}
          <UserProfileMenu compact={true} />
        </div>
      </header>

      {/* Slide-out Navigation Drawer for POS Terminal */}
      <AppSidebar
        mode="drawer"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Printer & Cash Drawer Settings Modal */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />

      {/* Manager PIN Override Dialog for Cashier opening Cash Drawer */}
      <ConfirmPinDialog
        isOpen={isPinDialogOpenForDrawer}
        onClose={() => setIsPinDialogOpenForDrawer(false)}
        onSuccess={() => {
          setIsPinDialogOpenForDrawer(false);
          executeOpenDrawer();
        }}
        actionTitle="ຢືນຢັນສິດທິຜູ້ຈັດການເພື່ອໄຂລິ້ນຊັກເງິນ"
      />

      {/* Shift Dialogs */}
      <OpenShiftDialog />
      <CloseShiftBlindDialog />
    </>
  );
}
